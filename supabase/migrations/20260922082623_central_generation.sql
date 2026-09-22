-- Service-role-only execution ledger. No client may edit limits, counters or jobs.
create table public.generation_limits (
  action text primary key check (action in ('text','image','audio','video','upload')),
  max_concurrent integer not null default 2 check (max_concurrent > 0),
  enabled boolean not null default false,
  global_daily integer not null default 0 check (global_daily >= 0),
  visitor_daily integer not null default 0 check (visitor_daily >= 0)
);
insert into public.generation_limits(action) values ('text'),('image'),('audio'),('video'),('upload');
create table public.generation_jobs (
  id uuid primary key,
  owner_id uuid not null references auth.users(id),
  action text not null references public.generation_limits(action),
  request_hash text not null,
  created_at timestamptz not null default now(),
  status text not null default 'processing' check (status in ('processing','pending','complete','failed')),
  operation text,
  result jsonb,
  error_code text,
  poll_after timestamptz not null default now()
);
create index generation_jobs_daily on public.generation_jobs(action, created_at, owner_id);
alter table public.generation_limits enable row level security;
alter table public.generation_jobs enable row level security;
revoke all on public.generation_limits, public.generation_jobs from public, anon, authenticated;
grant all on public.generation_limits, public.generation_jobs to service_role;

create or replace function public.reserve_generation(p_id uuid, p_owner uuid, p_action text, p_hash text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare limits public.generation_limits; job public.generation_jobs; total integer; personal integer;
begin
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
  insert into public.generation_jobs(id,owner_id,action,request_hash) values(p_id,p_owner,p_action,p_hash);
  return jsonb_build_object('reserved',true);
end;
$$;
revoke all on function public.reserve_generation(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.reserve_generation(uuid,uuid,text,text) to service_role;

-- Public-by-link media, not publication in the shared catalogue. Only the
-- validated gateway may write/list/delete; visitors receive no storage policies.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('postcards','postcards',true,52428800,array['image/jpeg','image/png','image/webp','audio/mpeg','video/mp4']);
