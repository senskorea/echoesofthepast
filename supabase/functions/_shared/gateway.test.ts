import { describe,it,expect,vi } from 'vitest';
import { validateInput,safeGoogleMedia } from './gateway-validation';
import { generate,poll } from './providers';
const requestId='00000000-0000-4000-8000-000000000001';
describe('gateway validation',()=>{
  it.each([
    {action:'text',requestId,prompt:'ok',modelId:'../unapproved'},
    {action:'text',requestId,prompt:'ok',modelId:'gemini-3.6-flash',apiKey:'client-key'},
    {action:'poll',requestId,jobId:'../other-job'},
    {action:'upload',requestId,base64Image:'AAAA',mimeType:'image/png'},
    {action:'text',requestId,prompt:'a'.repeat(16001),modelId:'gemini-3.6-flash'},
  ])('rejects invalid input %#',input=>expect(()=>validateInput(input)).toThrow());
  it('accepts valid bounded text',()=>expect(validateInput({action:'text',requestId,prompt:'history',modelId:'gemini-3.6-flash'}).action).toBe('text'));
  it.each(['https://evil.test/video','http://generativelanguage.googleapis.com/v1beta/files/a','https://generativelanguage.googleapis.com.evil.test/v1beta/files/a','https://user:pass@generativelanguage.googleapis.com/v1beta/files/a'])('rejects unsafe media fetch %s',url=>expect(()=>safeGoogleMedia(url)).toThrow());
});
describe('provider adapters',()=>{
  it('uses the server secret in headers and returns only result text',async()=>{
    const mock=vi.fn(async()=>Response.json({totalTokens:10,candidates:[{content:{parts:[{text:'answer'}]}}]}));
    const result=await generate({action:'text',requestId,prompt:'q',modelId:'gemini-3.6-flash'},()=> 'server-secret',mock);
    expect(result).toEqual({text:'answer'});
    const [url,options]=mock.mock.calls[0] as unknown as [string,RequestInit];
    expect(url).not.toContain('server-secret');expect(options.headers).toMatchObject({'x-goog-api-key':'server-secret'});expect(options.redirect).toBe('error');
  });
  it('does not request a provider when its secret is missing',async()=>{
    const mock=vi.fn();await expect(generate({action:'audio',requestId,prompt:'q'},()=>undefined,mock)).rejects.toMatchObject({code:'unavailable'});expect(mock).not.toHaveBeenCalled();
  });
  it('does not fetch arbitrary media returned by a provider',async()=>{
    const mock=vi.fn(async()=>Response.json({done:true,response:{generatedSamples:[{video:{uri:'https://evil.test/steal'}}]}}));
    await expect(poll('models/veo-3.1-generate-preview/operations/abc',()=> 'server-secret',mock)).rejects.toThrow();expect(mock).toHaveBeenCalledTimes(1);
  });
  it('redacts provider failures',async()=>{
    const mock=vi.fn(async()=>Response.json({error:{message:'secret-value'}},{status:403}));
    await expect(generate({action:'audio',requestId,prompt:'q'},()=> 'key',mock)).rejects.toMatchObject({message:'unavailable'});
  });
});

describe('video download redirects',()=>{
  it('follows Google storage redirects without forwarding the API secret',async()=>{
    const mock=vi.fn().mockResolvedValueOnce(Response.json({done:true,response:{generatedSamples:[{video:{uri:'https://generativelanguage.googleapis.com/v1beta/files/a:download?key=old'}}]}}))
      .mockResolvedValueOnce(new Response(null,{status:302,headers:{location:'https://storage.googleapis.com/video/file?signature=abc'}}))
      .mockResolvedValueOnce(new Response(new Uint8Array([1,2,3])));
    const result=await poll('models/veo-3.1-generate-preview/operations/abc',()=> 'server-secret',mock);
    expect(result?.bytes.length).toBe(3);
    expect(mock.mock.calls[1][0]).not.toContain('key=');
    expect(mock.mock.calls[2][1].headers).toEqual({});
  });
  it('rejects a redirect to an unapproved host before fetching it',async()=>{
    const mock=vi.fn().mockResolvedValueOnce(Response.json({done:true,response:{generatedSamples:[{video:{uri:'https://generativelanguage.googleapis.com/v1beta/files/a'}}]}}))
      .mockResolvedValueOnce(new Response(null,{status:302,headers:{location:'https://evil.test/secret'}}));
    await expect(poll('models/veo-3.1-generate-preview/operations/abc',()=> 'server-secret',mock)).rejects.toThrow();
    expect(mock).toHaveBeenCalledTimes(2);
  });
});

it('rejects oversized model input before paid generation',async()=>{
 const mock=vi.fn(async()=>Response.json({totalTokens:32769}));
 await expect(generate({action:'text',requestId,prompt:'history',modelId:'gemini-3.6-flash'},()=> 'key',mock)).rejects.toMatchObject({code:'invalid'});
 expect(mock).toHaveBeenCalledTimes(1);
 expect((mock.mock.calls[0] as unknown as [string])[0]).toContain(':countTokens');
});
it('distinguishes provider outages without exposing raw provider messages',async()=>{
  const mock=vi.fn(async()=>Response.json({error:{message:'private provider details'}},{status:503}));
  const log=vi.spyOn(console,'error').mockImplementation(()=>{});
  try {
    await expect(generate({action:'text',requestId,prompt:'history',modelId:'gemini-3.6-flash'},()=> 'server-secret',mock)).rejects.toMatchObject({code:'provider_busy',status:503});
    expect(mock).toHaveBeenCalledTimes(1);
  } finally {log.mockRestore();}
});
