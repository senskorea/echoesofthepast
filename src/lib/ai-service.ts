import { getAIConfig, getSupabaseConfig } from "./supabase-config";

type ApiError = { error?: { message?: string } | string; message?: string };

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({})) as ApiError;
  if (typeof body.error === "string") return body.error;
  return body.error?.message || body.message || fallback;
}

export async function generateText(prompt: string, modelId: string, base64Image?: string, mimeType: string = "image/jpeg"): Promise<string> {
  const { provider, apiKey } = getAIConfig();
  if (!apiKey) throw new Error(`No API key found for this provider. Add it in Settings.`);

  if (modelId.includes("gemini")) {
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: prompt }];
    if (base64Image) {
      parts.push({ inlineData: { mimeType, data: base64Image.split(",").pop() || base64Image } });
    }
    
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ 
          contents: [{ parts }], 
          generationConfig: { maxOutputTokens: 2000, temperature: 0.8 } 
        }),
      }
    );
    if (!res.ok) { 
      throw new Error(await errorMessage(res, `Gemini error ${res.status}`));
    }
    const d = await res.json();
    return d.candidates[0].content.parts[0].text;
  } else {
    const messageContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [{ type: "text", text: prompt }];
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
        ...(modelId.startsWith("gpt-5") || modelId.startsWith("o") ? { max_completion_tokens: 2000 } : { max_tokens: 2000 })
      }),
    });
    if (!res.ok) { 
      throw new Error(await errorMessage(res, `OpenAI error ${res.status}`));
    }
    const d = await res.json();
    return d.choices[0].message.content;
  }
}

export async function generateImage(prompt: string, modelId: string): Promise<string> {
  const { apiKey } = getAIConfig();
  if (!apiKey) throw new Error(`API key missing. Add it in Settings.`);

  if (modelId.includes("gemini")) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      }
    );
    if (!res.ok) {
      throw new Error(await errorMessage(res, `Gemini image API error ${res.status}.`));
    }
    const d = await res.json();
    const imagePart = d.candidates?.[0]?.content?.parts?.find((part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData?.data);
    if (!imagePart?.inlineData?.data) throw new Error("Gemini returned no generated image.");
    return `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`;
  } else {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        model: modelId,
        prompt, 
        size: "1024x1024", 
        quality: "medium",
        n: 1 
      }),
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, `OpenAI image error ${res.status}`));
    }
    const d = await res.json();
    const result = d.data?.[0];
    if (result?.b64_json) return `data:image/png;base64,${result.b64_json}`;
    if (result?.url) return result.url;
    throw new Error("OpenAI returned no generated image.");
  }
}

export async function generateAudio(text: string): Promise<Blob> {
  const openaiKey = localStorage.getItem("openai_api_key");
  if (!openaiKey) throw new Error("Audio generation requires an OpenAI API key. Add it in Settings → AI Provider.");

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ 
      model: "gpt-4o-mini-tts",
      input: text.slice(0, 4096), 
      voice: "nova" 
    }),
  });
  if (!res.ok) { 
    throw new Error(await errorMessage(res, `TTS error ${res.status}`));
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
    throw new Error(await errorMessage(res, `Failed to initiate video generation (status ${res.status}).`));
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
      throw new Error(await errorMessage(res, `Failed to check video status: ${res.status}`));
    }

    const d = await res.json();
    if (d.done) {
      if (!d.videoUrl) {
        throw new Error("Video generation completed, but no video URL was found.");
      }

      return d.videoUrl;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    attempts++;
  }

  throw new Error("Video generation timed out. Please try again.");
}
