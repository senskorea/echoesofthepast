import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {createGateway} from './gateway-handler';
const origin='https://senskorea.github.io';
const id='20000000-0000-4000-8000-000000000001';
const owner='10000000-0000-4000-8000-000000000001';
const env: Record<string,string>={ALLOWED_ORIGINS:origin,SUPABASE_URL:'https://project.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'server-only',GEMINI_API_KEY:'provider-secret',GENERATION_ENABLED:'true'};
const input={action:'text',requestId:id,prompt:'history',modelId:'gemini-3.6-flash'};
const request=(body:unknown=input,auth=true)=>new Request('https://project.supabase.co/functions/v1/ai-gateway',{method:'POST',headers:{origin,...(auth ? {authorization:'Bearer visitor-token'} : {})},body:JSON.stringify(body)});
beforeEach(()=>vi.spyOn(console,'error').mockImplementation(()=>{}));
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
it('rejects missing auth without any external call',async()=>{
  const mock=vi.fn();vi.stubGlobal('fetch',mock);
  const response=await createGateway(k=>env[k])(request(input,false));
  expect(response.status).toBe(401);expect(mock).not.toHaveBeenCalled();
});
it('rejects an unapproved origin',async()=>{
  const mock=vi.fn();vi.stubGlobal('fetch',mock);
  const response=await createGateway(k=>env[k])(new Request('https://project.supabase.co',{method:'POST',headers:{origin:'https://other.test'}}));
  expect(response.status).toBe(403);expect(mock).not.toHaveBeenCalled();
});
it('checks the user but does not call providers or DB when disabled',async()=>{
  const mock=vi.fn(async(_url:RequestInfo|URL)=>Response.json({id:owner}));vi.stubGlobal('fetch',mock);
  const response=await createGateway(k=>k==='GENERATION_ENABLED' ? 'false' : env[k])(request());
  expect(response.status).toBe(503);expect(mock).toHaveBeenCalledTimes(1);expect(String(mock.mock.calls[0][0])).toContain('/auth/v1/user');
});
it('rejects an invalid visitor JWT',async()=>{
  const mock=vi.fn(async()=>Response.json({message:'invalid token'},{status:401}));vi.stubGlobal('fetch',mock);
  const response=await createGateway(k=>env[k])(request());expect(response.status).toBe(401);expect(mock).toHaveBeenCalledTimes(1);
});
it('does not spend when the quota ledger denies reservation',async()=>{
  const mock=vi.fn(async(url:RequestInfo|URL)=>String(url).includes('/auth/v1/user') ? Response.json({id:owner}) : Response.json({code:'limit'}));vi.stubGlobal('fetch',mock);
  const response=await createGateway(k=>env[k])(request());expect(response.status).toBe(429);expect(mock).toHaveBeenCalledTimes(2);
  expect(mock.mock.calls.map(c=>String(c[0])).every(url=>url.startsWith(env.SUPABASE_URL))).toBe(true);
});
it('returns the cached result without a second generation',async()=>{
  const mock=vi.fn(async(url:RequestInfo|URL)=>String(url).includes('/auth/v1/user') ? Response.json({id:owner}) : Response.json({cached:true,job:{status:'complete',result:{text:'saved result'}}}));vi.stubGlobal('fetch',mock);
  const response=await createGateway(k=>env[k])(request());expect(await response.json()).toEqual({text:'saved result'});expect(mock).toHaveBeenCalledTimes(2);
});
it('cannot poll another visitor job',async()=>{
  const mock=vi.fn(async(url:RequestInfo|URL)=>String(url).includes('/auth/v1/user') ? Response.json({id:owner}) : Response.json(null));vi.stubGlobal('fetch',mock);
  const response=await createGateway(k=>env[k])(request({action:'poll',requestId:id,jobId:id}));
  expect(response.status).toBe(404);expect(String(mock.mock.calls[1][0])).toContain(`owner_id=eq.${owner}`);expect(mock).toHaveBeenCalledTimes(2);
});
it('marks cached failures terminal without calling the provider again',async()=>{
  const mock=vi.fn(async(url:RequestInfo|URL)=>String(url).includes('/auth/v1/user') ? Response.json({id:owner}) : Response.json({cached:true,job:{status:'failed',error_code:'unavailable'}}));vi.stubGlobal('fetch',mock);
  const response=await createGateway(k=>env[k])(request());
  expect(await response.json()).toEqual({code:'unavailable',requestId:id,terminal:true});
  expect(mock).toHaveBeenCalledTimes(2);
});
