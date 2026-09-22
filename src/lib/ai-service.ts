import { getSupabaseConfig } from './supabase-config';
import { getVisitorSession } from './supabase-client';
import { responseError, ServiceError } from './service-errors';

export async function callService<T>(body: Record<string, unknown>, requestId?: string): Promise<T> {
  const { url, anonKey } = getSupabaseConfig();
  if (import.meta.env.VITE_CENTRAL_SERVICES_ENABLED !== 'true' || !url || !anonKey) throw new ServiceError('unavailable');
  const session = await getVisitorSession();
  // Persist only a digest + request ID, not prompts. Retrying an uncertain
  // request reuses its reservation rather than charging for new work.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body)));
  const key = 'eop-request-' + session.user.id + '-' + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  if (body.action !== 'poll') {
    try {
      requestId ||= localStorage.getItem(key) || crypto.randomUUID();
      localStorage.setItem(key, requestId);
    } catch { throw new ServiceError('storage'); }
  } else { requestId ||= crypto.randomUUID(); }
  let response: Response;
  try {
    response = await fetch(`${url}/functions/v1/ai-gateway`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ...body, requestId }),
      signal: AbortSignal.timeout(150_000),
    });
  } catch { throw new ServiceError('network', requestId); }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    // A confirmed failure can be retried explicitly; uncertain or pending work
    // must keep its ID to avoid duplicate paid requests.
    if (body.action !== 'poll' && (result?.terminal === true || result?.code === 'provider_busy')) {
      try { localStorage.removeItem(key); } catch { /* Safe to keep the old ID. */ }
    }
    throw responseError(response.status, result?.code, requestId);
  }
  const valid = result && (body.action === 'text' ? typeof result.text === 'string' && result.text.trim().length > 0
    : body.action === 'video' ? typeof result.jobId === 'string' && result.jobId.length > 0
    : body.action === 'poll' ? typeof result.done === 'boolean' && (!result.done || typeof result.url === 'string')
    : typeof result.url === 'string' && /^https:\/\//.test(result.url));
  if (!valid) throw new ServiceError('unavailable', requestId);
  if (body.action !== 'poll') { try { localStorage.removeItem(key); } catch { /* Cached server result remains safe. */ } }
  return result as T;
}
export async function generateText(prompt: string, modelId: string, base64Image?: string, mimeType = 'image/jpeg'): Promise<string> {
  const result = await callService<{ text: string }>({ action: 'text', prompt, modelId, base64Image, mimeType });
  if (typeof result.text !== 'string') throw new ServiceError('unavailable');
  return result.text;
}
export async function generateImage(prompt: string, modelId: string): Promise<string> {
  const result = await callService<{ url: string }>({ action: 'image', prompt, modelId });
  if (!result.url) throw new ServiceError('unavailable');
  return result.url;
}
export async function generateAudio(text: string): Promise<Blob> {
  const result = await callService<{ url: string }>({ action: 'audio', prompt: text.slice(0, 4096) });
  try {
    const response = await fetch(result.url);
    if (!response.ok) throw new Error();
    return await response.blob();
  } catch { throw new ServiceError('network'); }
}
export async function generateVideo(prompt: string, modelId: string, base64Image?: string, mimeType = 'image/jpeg'): Promise<string> {
  const result = await callService<{ jobId: string }>({ action: 'video', prompt, modelId, base64Image, mimeType });
  if (!result.jobId) throw new ServiceError('unavailable');
  return result.jobId;
}
export async function pollVideoOperation(jobId: string, onProgress?: (status: string) => void): Promise<string> {
  for (let attempt = 0; attempt < 120; attempt++) {
    onProgress?.('Your video is being created…');
    const result = await callService<{ done: boolean; url?: string }>({ action: 'poll', jobId });
    if (result.done && result.url) return result.url;
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  throw new ServiceError('timeout', jobId);
}
export async function uploadImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new ServiceError('invalid');
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  const result = await callService<{ url: string }>({ action: 'upload', base64Image: btoa(binary), mimeType: file.type });
  return result.url;
}
