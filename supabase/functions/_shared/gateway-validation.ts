export class GatewayError extends Error {
  constructor(public code: string, public status = 503) { super(code); }
}
export const models = {
  text: ['gemini-3.6-flash', 'gpt-5-mini', 'gpt-4.1-mini'],
  image: ['gemini-3.1-flash-image', 'gpt-image-2.5-flare'],
  video: ['veo-3.1-generate-preview'],
};
export type Action = 'text' | 'image' | 'audio' | 'video' | 'upload' | 'poll';
export interface Input { action: Action; requestId: string; prompt?: string; modelId?: string; base64Image?: string; mimeType?: string; jobId?: string }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateInput(value: unknown): Input {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new GatewayError('invalid',400);
  const input = value as Input;
  if (Object.keys(input).some(k => !['action','requestId','prompt','modelId','base64Image','mimeType','jobId'].includes(k))) throw new GatewayError('invalid',400);
  if (typeof input.requestId !== 'string' || !uuid.test(input.requestId) || !['text','image','audio','video','upload','poll'].includes(input.action)) throw new GatewayError('invalid',400);
  if (input.action === 'poll') {
    if (typeof input.jobId !== 'string' || !uuid.test(input.jobId)) throw new GatewayError('invalid',400);
    return input;
  }
  if (input.action !== 'upload' && (typeof input.prompt !== 'string' || !input.prompt.trim() || input.prompt.length > (input.action === 'audio' ? 4096 : 16000))) throw new GatewayError('invalid',400);
  if (['text','image','video'].includes(input.action) && !models[input.action as keyof typeof models].includes(input.modelId || '')) throw new GatewayError('invalid',400);
  if (input.base64Image !== undefined) {
    if (typeof input.base64Image !== 'string') throw new GatewayError('invalid',400);
    input.base64Image = input.base64Image.replace(/^data:image\/(jpeg|png|webp);base64,/, '');
    if (input.base64Image.length > 7_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(input.base64Image) || !['image/jpeg','image/png','image/webp'].includes(input.mimeType || '')) throw new GatewayError('invalid',400);
    let bytes: Uint8Array;
    try { bytes = Uint8Array.from(atob(input.base64Image), c => c.charCodeAt(0)); } catch { throw new GatewayError('invalid',400); }
    if (bytes.length > 5*1024*1024) throw new GatewayError('invalid',413);
    const png = bytes[0]===137 && bytes[1]===80 && bytes[2]===78 && bytes[3]===71;
    const jpeg = bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
    const webp = new TextDecoder().decode(bytes.slice(0,4))==='RIFF' && new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
    if (!(input.mimeType==='image/png' ? png : input.mimeType==='image/jpeg' ? jpeg : webp)) throw new GatewayError('invalid',400);
  }
  if (input.action==='upload' && !input.base64Image) throw new GatewayError('invalid',400);
  return input;
}
export function safeGoogleMedia(value: unknown): string {
  if (typeof value !== 'string') throw new GatewayError('unavailable');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'generativelanguage.googleapis.com' || url.port || url.username || url.password || !url.pathname.startsWith('/v1beta/files/')) throw new GatewayError('unavailable');
  url.searchParams.delete('key');
  return url.href;
}
