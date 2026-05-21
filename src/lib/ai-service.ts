import { getAIConfig, getSupabaseConfig } from "./supabase-config";

export async function generateText(prompt: string, modelId: string, base64Image?: string, mimeType: string = "image/jpeg"): Promise<string> {
  const { provider, apiKey } = getAIConfig();
  if (!apiKey) throw new Error(`No API key found for this provider. Add it in Settings.`);

  if (modelId.includes("gemini")) {
    const parts: any[] = [{ text: prompt }];
    if (base64Image) {
      parts.push({ inlineData: { mimeType, data: base64Image.split(",").pop() || base64Image } });
    }
    
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ parts }], 
          generationConfig: { maxOutputTokens: 2000, temperature: 0.8 } 
        }),
      }
    );
    if (!res.ok) { 
      const e = await res.json().catch(() => ({})); 
      throw new Error(e?.error?.message || `Gemini error ${res.status}`); 
    }
    const d = await res.json();
    return d.candidates[0].content.parts[0].text;
  } else {
    const messageContent: any[] = [{ type: "text", text: prompt }];
    if (base64Image) {
      const b64 = base64Image.includes(",") ? base64Image : `data:${mimeType};base64,${base64Image}`;
      messageContent.push({ type: "image_url", image_url: { url: b64 } });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        model: modelId, 
        messages: [{ role: "user", content: messageContent }], 
        max_tokens: 2000 
      }),
    });
    if (!res.ok) { 
      const e = await res.json().catch(() => ({})); 
      throw new Error(e?.error?.message || `OpenAI error ${res.status}`); 
    }
    const d = await res.json();
    return d.choices[0].message.content;
  }
}

export async function generateImage(prompt: string, modelId: string): Promise<string> {
  const { apiKey } = getAIConfig();
  if (!apiKey) throw new Error(`API key missing. Add it in Settings.`);

  if (modelId.includes("imagen")) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 },
        }),
      }
    );
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e?.error?.message || `Imagen API error ${res.status}.`);
    }
    const d = await res.json();
    const b64 = d.predictions[0].bytesBase64Encoded;
    return `data:image/png;base64,${b64}`;
  } else {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        model: "dall-e-3", 
        prompt, 
        size: "1024x1024", 
        quality: "standard", 
        n: 1 
      }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e?.error?.message || `DALL-E error ${res.status}`);
    }
    const d = await res.json();
    return d.data[0].url;
  }
}

export async function generateAudio(text: string): Promise<Blob> {
  const openaiKey = localStorage.getItem("openai_api_key");
  if (!openaiKey) throw new Error("Audio generation requires an OpenAI API key. Add it in Settings → AI Provider.");

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ 
      model: "tts-1", 
      input: text.slice(0, 4096), 
      voice: "nova" 
    }),
  });
  if (!res.ok) { 
    const e = await res.json().catch(() => ({})); 
    throw new Error(e?.error?.message || `TTS error ${res.status}`); 
  }
  return res.blob();
}

export async function generateVideo(
  prompt: string,
  modelId: string,
  base64Image?: string,
  mimeType: string = "image/jpeg"
): Promise<string> {
  const { url: supabaseUrl, anonKey: supabaseKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase is not configured. Please complete settings configuration first.");
  }

  const apiKey = localStorage.getItem("gemini_api_key") || "";

  const res = await fetch(`${supabaseUrl}/functions/v1/generate-video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      action: "generate",
      prompt,
      modelId,
      base64Image,
      mimeType,
      apiKey,
    }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error || e?.message || `Failed to initiate video generation (status ${res.status}).`);
  }

  const d = await res.json();
  if (!d.operationName) {
    throw new Error("No operation name returned from video generation function.");
  }
  return d.operationName;
}

export async function pollVideoOperation(
  operationName: string,
  onProgress?: (status: string) => void
): Promise<string> {
  const { url: supabaseUrl, anonKey: supabaseKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase is not configured. Please complete settings configuration first.");
  }

  const apiKey = localStorage.getItem("gemini_api_key") || "";

  let attempts = 0;
  const maxAttempts = 120; // 6 minutes max polling
  const delayMs = 3000;

  while (attempts < maxAttempts) {
    if (onProgress) {
      onProgress(`Video generating... (poll #${attempts + 1})`);
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/generate-video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        action: "poll",
        operationName,
        apiKey,
      }),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e?.error || e?.message || `Failed to check video status: ${res.status}`);
    }

    const d = await res.json();
    if (d.done) {
      if (!d.videoUrl) {
        throw new Error("Video generation completed, but no video URL was found.");
      }

      if (onProgress) {
        onProgress("Downloading generated video...");
      }

      // Download the video via the direct URL to turn it into a local object URL blob
      const videoRes = await fetch(d.videoUrl);
      if (!videoRes.ok) {
        // Fallback: if browser blocks fetch due to CORS on the media URL, just return d.videoUrl directly!
        // As a public video source, <video> tag can play d.videoUrl directly without CORS issues.
        console.warn("Direct video file fetch blocked by CORS, falling back to direct video URL playback.");
        return d.videoUrl;
      }

      const videoBlob = await videoRes.blob();
      return URL.createObjectURL(videoBlob);
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    attempts++;
  }

  throw new Error("Video generation timed out. Please try again.");
}


