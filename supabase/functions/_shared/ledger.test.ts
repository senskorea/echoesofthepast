import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,it,expect} from 'vitest';
const db=new PGlite();
const owner='10000000-0000-4000-8000-000000000001';
const other='10000000-0000-4000-8000-000000000002';
const id='20000000-0000-4000-8000-000000000001';
beforeAll(async()=>{
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); insert into auth.users values('${owner}'),('${other}'); create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
  await db.exec(readFileSync(new URL('../../migrations/20260922082623_central_generation.sql',import.meta.url),'utf8'));
  await db.exec(readFileSync(new URL('../../migrations/20260922091130_daily_generation_budget.sql',import.meta.url),'utf8'));
},20000);
afterAll(()=>db.close());
async function reserve(jobId:string,user=owner,hash='hash') {
  return (await db.query<{result:Record<string,unknown>}>('select public.reserve_generation($1,$2,$3,$4) as result',[jobId,user,'text',hash])).rows[0].result;
}
it('disables paid work by default',async()=>{expect(await reserve(id)).toEqual({code:'unavailable'});});
it('reserves atomically, caches retries and enforces ownership and limits',async()=>{
  await db.exec("update public.generation_limits set enabled=true,global_daily=1,visitor_daily=1,max_cost_eur=1 where action='text'");
  expect(await reserve(id)).toEqual({reserved:true});
  expect(await reserve(id)).toHaveProperty('cached',true);
  expect(await reserve(id,other)).toEqual({code:'invalid'});
  expect(await reserve(id,owner,'changed')).toEqual({code:'invalid'});
  expect(await reserve('20000000-0000-4000-8000-000000000002',other)).toEqual({code:'limit'});
  expect((await db.query('select * from public.generation_jobs')).rows).toHaveLength(1);
});
it('denies client access to jobs, limits and reservation function',async()=>{
  for (const role of ['anon','authenticated']) {
    await db.exec(`set role ${role}`);
    await expect(db.query('select * from public.generation_jobs')).rejects.toThrow();
    await expect(db.query('update public.generation_limits set enabled=true')).rejects.toThrow();
    await expect(reserve(id)).rejects.toThrow();
    await db.exec('reset role');
  }
});

it('shares a five-request allowance across creation types and a global EUR 50 reservation cap',async()=>{
  await db.exec("truncate public.generation_jobs; update public.generation_limits set enabled=true,global_daily=100,visitor_daily=100,max_cost_eur=1");
  for(let i=1;i<=5;i++) {
    const job=`30000000-0000-4000-8000-${String(i).padStart(12,'0')}`;
    const result=await db.query<{result:Record<string,unknown>}>('select public.reserve_generation($1,$2,$3,$4) as result',[job,owner,i%2?'text':'image','hash']);
    expect(result.rows[0].result).toEqual({reserved:true});
    await db.exec("update public.generation_jobs set status='complete'");
  }
  expect(await reserve('30000000-0000-4000-8000-000000000006')).toEqual({code:'limit'});
  await db.exec("update public.generation_limits set max_cost_eur=46 where action='text'");
  expect(await reserve('30000000-0000-4000-8000-000000000007',other)).toEqual({code:'limit'});
  await db.exec("update public.generation_limits set max_cost_eur=45 where action='text'");
  expect(await reserve('30000000-0000-4000-8000-000000000007',other)).toEqual({reserved:true});
  expect(await reserve('30000000-0000-4000-8000-000000000007',other)).toHaveProperty('cached',true);
  expect((await db.query<{sum:string}>('select sum(reserved_cost_eur) from public.generation_jobs')).rows[0].sum).toBe('50.000000');
});
it('keeps paid work unavailable until conservative costs are configured',async()=>{
  await db.exec("truncate public.generation_jobs; update public.generation_limits set max_cost_eur=0");
  expect(await reserve(id)).toEqual({code:'unavailable'});
});
