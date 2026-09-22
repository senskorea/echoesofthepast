import { GatewayError, type Input, safeGoogleMedia } from './gateway-validation.ts';

type Env = (name: string) => string | undefined;
export type ProviderResult = { text: string } | { bytes: Uint8Array; mime: string } | { operation: string };
async function providerFetch(url: string, init: RequestInit, fetcher: typeof fetch): Promise<Response> {
  const response = await fetcher(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(100_000) });
  if (!response.ok) {
    const failure = await response.json().catch(()=>({}));
    // Record only bounded diagnostics, never raw provider messages or credentials.
    const details = JSON.stringify(failure.error?.details || []);
    console.error(JSON.stringify({providerStatus:response.status,quotaZero:/"quotaValue"\s*:\s*"?0"?/.test(details),billingRequired:/billing|paid tier/i.test(failure.error?.message || '')}));
    throw new GatewayError(response.status===429 ? 'limit' : response.status===400 ? 'refused' : 'unavailable', response.status===429 ? 429 : 503);
  }
  return response;
}
function decode(data: string) { return Uint8Array.from(atob(data), c => c.charCodeAt(0)); }
async function downloadVideo(uri: string, key: string, fetcher: typeof fetch): Promise<Uint8Array> {
  let url = new URL(uri);
  for (let hop = 0; hop < 4; hop++) {
    const googleApi = url.hostname === 'generativelanguage.googleapis.com';
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
        (!googleApi && url.hostname !== 'storage.googleapis.com')) throw new GatewayError('unavailable');
    if (googleApi) url = new URL(safeGoogleMedia(url.href));
    url.searchParams.delete('key');
    const response = await fetcher(url.href, { redirect: 'manual', signal: AbortSignal.timeout(100_000),
      headers: googleApi ? { 'x-goog-api-key': key } : {} });
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) throw new GatewayError('unavailable');
      url = new URL(location, url);
      continue;
    }
    if (!response.ok || !response.body) throw new GatewayError('unavailable');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 50 * 1024 * 1024) { await reader.cancel(); throw new GatewayError('unavailable'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return bytes;
  }
  throw new GatewayError('unavailable');
}
export function providerKey(input: Input, env: Env): string {
  const key = env(input.action==='video' || input.modelId?.startsWith('gemini') ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY');
  if (!key) throw new GatewayError('unavailable');
  return key;
}
export async function generate(input: Input, env: Env, fetcher: typeof fetch = fetch): Promise<ProviderResult> {
  const key = providerKey(input, env);
  const google = input.modelId?.startsWith('gemini') || input.action==='video';
  const headers = { 'Content-Type':'application/json', ...(google ? {'x-goog-api-key':key} : {Authorization:`Bearer ${key}`}) };
  if (input.action==='video') {
    const instance = {prompt:input.prompt, ...(input.base64Image ? {image:{bytesBase64Encoded:input.base64Image,mimeType:input.mimeType}} : {})};
    const response = await providerFetch(`https://generativelanguage.googleapis.com/v1beta/models/${input.modelId}:predictLongRunning`, {method:'POST',headers,body:JSON.stringify({instances:[instance],parameters:{sampleCount:1,aspectRatio:'16:9',durationSeconds:4,resolution:'720p'}})},fetcher);
    const data = await response.json();
    if (typeof data.name !== 'string' || !/^models\/[a-zA-Z0-9.-]+\/operations\/[a-zA-Z0-9_-]+$/.test(data.name)) throw new GatewayError('unavailable');
    return {operation:data.name};
  }
  if (input.action==='audio') {
    const response = await providerFetch('https://api.openai.com/v1/audio/speech',{method:'POST',headers,body:JSON.stringify({model:'gpt-4o-mini-tts',input:input.prompt,voice:'nova',response_format:'mp3'})},fetcher);
    return {bytes:new Uint8Array(await response.arrayBuffer()),mime:'audio/mpeg'};
  }
  if (google) {
    const parts: unknown[] = [{text:input.prompt}];
    if (input.base64Image) parts.push({inlineData:{mimeType:input.mimeType,data:input.base64Image}});
    // Count multimodal input before generation so the reservation has a bounded cost.
    const countResponse = await providerFetch(`https://generativelanguage.googleapis.com/v1beta/models/${input.modelId}:countTokens`, {method:'POST',headers,body:JSON.stringify({contents:[{parts}]})},fetcher);
    const tokenCount = (await countResponse.json()).totalTokens;
    if (!Number.isInteger(tokenCount) || tokenCount < 0 || tokenCount > 32768) throw new GatewayError('invalid',400);
    const response = await providerFetch(`https://generativelanguage.googleapis.com/v1beta/models/${input.modelId}:generateContent`,{method:'POST',headers,body:JSON.stringify({contents:[{parts}],generationConfig:input.action==='image' ? {responseModalities:['IMAGE'],candidateCount:1,maxOutputTokens:8192,imageConfig:{imageSize:'1K'}} : {maxOutputTokens:2000,temperature:0.8}})},fetcher);
    const data = await response.json();
    const output = data.candidates?.[0]?.content?.parts as Array<{text?:string;inlineData?:{data:string;mimeType:string}}> | undefined;
    if (input.action==='text') {
      const text = output?.map(p=>p.text || '').join('');
      if (!text) throw new GatewayError('refused',422);
      return {text};
    }
    const image = output?.find(p=>p.inlineData)?.inlineData;
    if (!image || !['image/png','image/jpeg','image/webp'].includes(image.mimeType)) throw new GatewayError('refused',422);
    return {bytes:decode(image.data),mime:image.mimeType};
  }
  if (input.action==='image') {
    const response = await providerFetch('https://api.openai.com/v1/images/generations',{method:'POST',headers,body:JSON.stringify({model:input.modelId,prompt:input.prompt,size:'1024x1024',quality:'medium',n:1})},fetcher);
    const data = await response.json();
    if (!data.data?.[0]?.b64_json) throw new GatewayError('unavailable');
    return {bytes:decode(data.data[0].b64_json),mime:'image/png'};
  }
  const content: unknown[] = [{type:'text',text:input.prompt}];
  if (input.base64Image) content.push({type:'image_url',image_url:{url:`data:${input.mimeType};base64,${input.base64Image}`}});
  const response = await providerFetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers,body:JSON.stringify({model:input.modelId,messages:[{role:'user',content}],...(input.modelId?.startsWith('gpt-5') ? {max_completion_tokens:2000} : {max_tokens:2000})})},fetcher);
  const data = await response.json();
  if (typeof data.choices?.[0]?.message?.content !== 'string') throw new GatewayError('refused',422);
  return {text:data.choices[0].message.content};
}
export async function poll(operation: string, env: Env, fetcher: typeof fetch = fetch): Promise<{bytes:Uint8Array;mime:string} | null> {
  if (!/^models\/[a-zA-Z0-9.-]+\/operations\/[a-zA-Z0-9_-]+$/.test(operation)) throw new GatewayError('invalid',400);
  const key=env('GEMINI_API_KEY');
  if (!key) throw new GatewayError('unavailable');
  const headers={'x-goog-api-key':key};
  const response=await providerFetch(`https://generativelanguage.googleapis.com/v1beta/${operation}`,{headers},fetcher);
  const data=await response.json();
  if (data.error) throw new GatewayError('refused',422);
  if (!data.done) return null;
  const samples=data.response?.generatedSamples || data.response?.generateVideoResponse?.generatedSamples;
  const uri=safeGoogleMedia(samples?.[0]?.video?.uri);
  const bytes=await downloadVideo(uri,key,fetcher);
  return {bytes,mime:'video/mp4'};
}
