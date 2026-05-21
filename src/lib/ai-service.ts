import { getAIConfig } from "./supabase-config";

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
  const apiKey = localStorage.getItem("gemini_api_key");
  if (!apiKey) throw new Error(`Gemini API key missing. Add it in Settings under AI Provider.`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predictLongRunning?key=${apiKey}`;

  const instance: any = { prompt };
  if (base64Image) {
    instance.image = {
      bytesBase64Encoded: base64Image.split(",").pop() || base64Image,
      mimeType,
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [instance],
      parameters: {
        sampleCount: 1,
        aspectRatio: "16:9",
        durationSeconds: 4,
      },
    }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `Veo Video API error ${res.status}.`);
  }

  const d = await res.json();
  if (!d.name) {
    throw new Error("No operation name returned from Veo API.");
  }
  return d.name;
}

export async function pollVideoOperation(
  operationName: string,
  onProgress?: (status: string) => void
): Promise<string> {
  const apiKey = localStorage.getItem("gemini_api_key");
  if (!apiKey) throw new Error(`Gemini API key missing. Add it in Settings under AI Provider.`);

  const cleanName = operationName.startsWith("operations/") || operationName.startsWith("projects/") 
    ? operationName 
    : `operations/${operationName}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/${cleanName}?key=${apiKey}`;

  let attempts = 0;
  const maxAttempts = 120; // 6 minutes max polling
  const delayMs = 3000;

  while (attempts < maxAttempts) {
    if (onProgress) {
      onProgress(`Video generating... (poll #${attempts + 1})`);
    }

    const res = await fetch(url);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e?.error?.message || `Failed to check video status: ${res.status}`);
    }

    const d = await res.json();
    if (d.done) {
      const samples = d.response?.generatedSamples || d.response?.generateVideoResponse?.generatedSamples;
      const videoUri = samples?.[0]?.video?.uri;

      if (!videoUri) {
        throw new Error("Video generation completed, but no video URI was found.");
      }

      if (onProgress) {
        onProgress("Downloading generated video...");
      }

      const downloadUrl = videoUri.includes("?key=") 
        ? videoUri 
        : `${videoUri}${videoUri.includes("?") ? "&" : "?"}key=${apiKey}`;

      const videoRes = await fetch(downloadUrl);
      if (!videoRes.ok) {
        throw new Error(`Failed to download video file: ${videoRes.status}`);
      }

      const videoBlob = await videoRes.blob();
      return URL.createObjectURL(videoBlob);
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    attempts++;
  }

  throw new Error("Video generation timed out. Please try again.");
}


