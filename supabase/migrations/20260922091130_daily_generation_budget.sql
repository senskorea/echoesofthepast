-- User-approved limits: five generation requests per visitor and EUR 50
-- reserved across the whole service per UTC day. Costs must be configured to
-- conservative upper bounds for every allowed model before actions are enabled.
create table public.generation_budget (
  id integer primary key check(id=1),
  daily_eur numeric(12,6) not null check(daily_eur >= 0),
  visitor_daily integer not null check(visitor_daily >= 0)
);
insert into public.generation_budget values(1,50,5);
alter table public.generation_budget enable row level security;
revoke all on public.generation_budget from public,anon,authenticated;
grant all on public.generation_budget to service_role;
alter table public.generation_limits add column max_cost_eur numeric(12,6) not null default 0 check(max_cost_eur >= 0);
alter table public.generation_jobs add column reserved_cost_eur numeric(12,6) not null default 0 check(reserved_cost_eur >= 0);

create or replace function public.reserve_generation(p_id uuid, p_owner uuid, p_action text, p_hash text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare limits public.generation_limits; budget public.generation_budget; job public.generation_jobs; total integer; personal integer; reserved_eur numeric;
begin
  -- Lock the shared budget first: cross-action requests cannot overspend or
  -- evade the combined five-generations allowance through parallel requests.
  select * into budget from public.generation_budget where id=1 for update;
  if not found then return jsonb_build_object('code','unavailable'); end if;
  -- Serialize reservations for this action across every function instance.
  select * into limits from public.generation_limits where action=p_action for update;
  if not found then return jsonb_build_object('code','invalid'); end if;
  select * into job from public.generation_jobs where id=p_id;
  if found then
    if job.owner_id <> p_owner or job.action <> p_action or job.request_hash <> p_hash then
      return jsonb_build_object('code','invalid');
    end if;
    return jsonb_build_object('cached',true,'job',to_jsonb(job));
  end if;
  if not limits.enabled or limits.global_daily=0 or limits.visitor_daily=0 then
    return jsonb_build_object('code','unavailable');
  end if;
  if p_action <> 'upload' then
    if limits.max_cost_eur <= 0 then return jsonb_build_object('code','unavailable'); end if;
    select coalesce(sum(reserved_cost_eur),0), count(*) filter(where owner_id=p_owner)
      into reserved_eur, personal from public.generation_jobs
      where action <> 'upload' and created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
    if personal >= budget.visitor_daily or reserved_eur + limits.max_cost_eur > budget.daily_eur then
      return jsonb_build_object('code','limit');
    end if;
  end if;
  select count(*), count(*) filter(where owner_id=p_owner) into total, personal
    from public.generation_jobs where action=p_action and created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
  if total >= limits.global_daily or personal >= limits.visitor_daily then
    return jsonb_build_object('code','limit');
  end if;
  if (select count(*) from public.generation_jobs where action=p_action and status='processing' and created_at > now()-interval '3 minutes') >= limits.max_concurrent then
    return jsonb_build_object('code','busy');
  end if;
  if exists(select 1 from public.generation_jobs where owner_id=p_owner and status='processing' and created_at > now()-interval '3 minutes') then
    return jsonb_build_object('code','busy');
  end if;
  insert into public.generation_jobs(id,owner_id,action,request_hash,reserved_cost_eur) values(p_id,p_owner,p_action,p_hash,case when p_action='upload' then 0 else limits.max_cost_eur end);
  return jsonb_build_object('reserved',true);
end;
$$;
revoke all on function public.reserve_generation(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.reserve_generation(uuid,uuid,text,text) to service_role;


-- The dashboard-created event trigger needs no client RPC execution grants.
do $permissions$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
  end if;
end;
$permissions$;
