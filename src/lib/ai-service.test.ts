import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { generateImage, generateText, callService } from './ai-service';
vi.mock('./supabase-client', () => ({ getVisitorSession: vi.fn(async () => ({access_token:'visitor-jwt',user:{id:'visitor-1'}})) }));
const values = new Map<string,string>();
beforeEach(() => {
  values.clear();
  vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key) || null,setItem:(key:string,v:string)=>values.set(key,v),removeItem:(key:string)=>values.delete(key)});
  vi.stubEnv('VITE_SUPABASE_URL','https://project.supabase.co');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY','public-key');
  vi.stubEnv('VITE_CENTRAL_SERVICES_ENABLED','true');
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('central AI adapter',()=>{
  it('uses only the deployment endpoint and visitor token, ignoring old keys',async()=>{
    values.set('gemini_api_key','must-not-leak');values.set('supabase_url','https://attacker.invalid');
    const mock=vi.fn(async()=>Response.json({text:'answer'}));vi.stubGlobal('fetch',mock);
    expect(await generateText('question','gemini-3.6-flash')).toBe('answer');
    const [url,options]=mock.mock.calls[0] as unknown as [string,RequestInit];
    expect(url).toBe('https://project.supabase.co/functions/v1/ai-gateway');
    expect(options.headers).toMatchObject({Authorization:'Bearer visitor-jwt',apikey:'public-key'});
    expect(JSON.stringify(options)).not.toContain('must-not-leak');
  });
  it('does not call any service until centrally enabled',async()=>{
    vi.stubEnv('VITE_CENTRAL_SERVICES_ENABLED','false');const mock=vi.fn();vi.stubGlobal('fetch',mock);
    await expect(generateImage('image','gemini-3.1-flash-image')).rejects.toMatchObject({code:'unavailable'});
    expect(mock).not.toHaveBeenCalled();
  });
  it('reuses the request ID after an uncertain network response',async()=>{
    const mock=vi.fn().mockRejectedValueOnce(new TypeError('failed')).mockResolvedValue(Response.json({text:'answer'}));vi.stubGlobal('fetch',mock);
    await expect(generateText('question','gemini-3.6-flash')).rejects.toMatchObject({code:'network'});
    await generateText('question','gemini-3.6-flash');
    const first=JSON.parse(mock.mock.calls[0][1].body);const second=JSON.parse(mock.mock.calls[1][1].body);
    expect(second.requestId).toBe(first.requestId);
  });
  it('does not display upstream secrets or raw messages',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>Response.json({error:'provider secret=value',code:'alien-code'},{status:500})));
    await expect(callService({action:'text'})).rejects.toMatchObject({code:'unavailable'});
  });
});
