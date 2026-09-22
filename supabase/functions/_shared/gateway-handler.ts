import { createClient } from '@supabase/supabase-js';
import { GatewayError, validateInput } from './gateway-validation.ts';
import { generate, poll, providerKey } from './providers.ts';

export function createGateway(env: (name: string) => string | undefined) {
const allowedOrigins = (env('ALLOWED_ORIGINS') || '').split(',').map(s=>s.trim()).filter(Boolean);
return async (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const headers: Record<string,string> = {'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
  if (allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin']=origin;
    headers['Access-Control-Allow-Headers']='authorization, apikey, content-type, x-client-info';
    headers['Access-Control-Allow-Methods']='POST, OPTIONS';
  }
  const reply = (body: unknown, status=200) => new Response(JSON.stringify(body),{status,headers});
  if (!allowedOrigins.includes(origin)) return reply({code:'unavailable'},403);
  if (req.method==='OPTIONS') return new Response(null,{status:204,headers});
  if (req.method!=='POST') return reply({code:'invalid'},405);
  let requestId: string | undefined;
  try {
    const url=env('SUPABASE_URL');
    const key=env('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new GatewayError('unavailable');
    const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const auth=req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) throw new GatewayError('unavailable',401);
    const {data:userData,error:authError}=await admin.auth.getUser(auth.slice(7));
    if (authError || !userData.user) throw new GatewayError('unavailable',401);
    const owner=userData.user.id;
    // Stream with a bound: do not trust Content-Length from clients.
    if (Number(req.headers.get('content-length'))>7_100_000) throw new GatewayError('invalid',413);
    const reader=req.body?.getReader();
    if (!reader) throw new GatewayError('invalid',400);
    const chunks: Uint8Array[]=[];
    let size=0;
    while (true) {
      const {done,value}=await reader.read();
      if (done) break;
      size+=value.length;
      if (size>7_100_000) { await reader.cancel(); throw new GatewayError('invalid',413); }
      chunks.push(value);
    }
    const bytes=new Uint8Array(size);
    let offset=0;
    for (const chunk of chunks) {bytes.set(chunk,offset);offset+=chunk.length;}
    let parsed: unknown;
    try {parsed=JSON.parse(new TextDecoder().decode(bytes));} catch {throw new GatewayError('invalid',400);}
    const input=validateInput(parsed);
    requestId=input.requestId;
    const update = async (id:string,values:Record<string,unknown>) => {
      const {error}=await admin.from('generation_jobs').update(values).eq('id',id).eq('owner_id',owner);
      if (error) throw new GatewayError('unavailable');
    };
    const storeMedia=async (id:string,content:Uint8Array,mime:string) => {
      if (content.length>50*1024*1024) throw new GatewayError('unavailable');
      const ext: Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','audio/mpeg':'mp3','video/mp4':'mp4'};
      if (!ext[mime]) throw new GatewayError('unavailable');
      const path=`${owner}/${id}.${ext[mime]}`;
      const {error}=await admin.storage.from('postcards').upload(path,content,{contentType:mime,upsert:true});
      if (error) throw new GatewayError('unavailable');
      return admin.storage.from('postcards').getPublicUrl(path).data.publicUrl;
    };
    if (input.action==='poll') {
      const {data:job,error}=await admin.from('generation_jobs').select('*').eq('id',input.jobId).eq('owner_id',owner).eq('action','video').maybeSingle();
      if (error || !job) throw new GatewayError('invalid',404);
      if (job.status==='complete') return reply({done:true,...job.result});
      if (job.status==='failed') throw new GatewayError(job.error_code || 'unavailable');
      if (!job.operation) return reply({done:false});
      // Atomic lease serializes provider polling and upload completion.
      const {data:claimed,error:claimError}=await admin.from('generation_jobs').update({poll_after:new Date(Date.now()+240_000).toISOString()}).eq('id',job.id).eq('status','pending').lte('poll_after',new Date().toISOString()).select('id');
      if (claimError) throw new GatewayError('unavailable');
      if (!claimed?.length) return reply({done:false});
      try {
        const media=await poll(job.operation,env);
        if (!media) {await update(job.id,{poll_after:new Date(Date.now()+3000).toISOString()});return reply({done:false});}
        const mediaUrl=await storeMedia(job.id,media.bytes,media.mime);
        const result={jobId:job.id,url:mediaUrl};
        await update(job.id,{status:'complete',result});
        return reply({done:true,...result});
      } catch(error) {
        if (error instanceof GatewayError && error.code==='refused') await update(job.id,{status:'failed',error_code:'refused'});
        // Keep lease on network/unknown errors; never launch a replacement job.
        throw error;
      }
    }
    if (env('GENERATION_ENABLED')!=='true') throw new GatewayError('unavailable');
    if (input.action!=='upload') providerKey(input,env);
    const hashBytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(input)));
    const hash=Array.from(new Uint8Array(hashBytes),b=>b.toString(16).padStart(2,'0')).join('');
    const {data:reservation,error}=await admin.rpc('reserve_generation',{p_id:input.requestId,p_owner:owner,p_action:input.action,p_hash:hash});
    if (error || !reservation) throw new GatewayError('unavailable');
    if (reservation.code) throw new GatewayError(reservation.code,reservation.code==='limit' ? 429 : reservation.code==='invalid' ? 400 : 503);
    if (reservation.cached) {
      const job=reservation.job;
      if (job.status==='complete' || (job.status==='pending' && job.action==='video')) return reply(job.result);
      throw new GatewayError(job.status==='failed' ? job.error_code || 'unavailable' : 'busy',409);
    }
    try {
      const output=input.action==='upload' ? {bytes:Uint8Array.from(atob(input.base64Image!),c=>c.charCodeAt(0)),mime:input.mimeType!} : await generate(input,env);
      if ('operation' in output) {
        const result={jobId:input.requestId};
        await update(input.requestId,{status:'pending',operation:output.operation,result});
        return reply(result);
      }
      const result='text' in output ? output : {url:await storeMedia(input.requestId,output.bytes,output.mime)};
      await update(input.requestId,{status:'complete',result});
      return reply(result);
    } catch(error) {
      const code=error instanceof GatewayError ? error.code : 'unavailable';
      await update(input.requestId,{status:'failed',error_code:code});
      // Failed reservations count toward allowance. Never retry paid calls here.
      throw error;
    }
  } catch(error) {
    const known=error instanceof GatewayError;
    console.error(JSON.stringify({requestId,code:known ? error.code : 'unavailable'}));
    return reply({code:known ? error.code : 'unavailable',requestId},known ? error.status : 503);
  }
};
}
