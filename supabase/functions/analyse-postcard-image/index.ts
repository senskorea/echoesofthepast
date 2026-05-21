import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANALYSIS_PROMPT = `You are an expert historical archivist and geographer specialising in vintage postcards.

Analyse this image carefully and return a JSON object with these fields:

{
  "title": "Concise title with location and approximate era (e.g. 'Rue de Rivoli, Paris, c.1905')",
  "description": "2–3 sentences on what is shown, historical context, and notable details.",
  "latitude": <decimal number>,
  "longitude": <decimal number>,
  "era": "Approximate decade (e.g. 'Early 1900s')",
  "confidence": "low | medium | high"
}

Rules:
- Return ONLY valid JSON, no markdown.
- For coordinates: identify location from visual clues. If uncertain, use best estimate with confidence "low".`;

// ── OpenAI Vision ─────────────────────────────────────────────
async function analyseWithOpenAI(imageUrl: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
          { type: "text", text: ANALYSIS_PROMPT },
        ],
      }],
    }),
  });
  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

// ── Gemini Vision ─────────────────────────────────────────────
async function analyseWithGemini(imageUrl: string, apiKey: string) {
  // Fetch image and convert to base64 for Gemini inline_data
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error("Could not fetch image for Gemini analysis");
  const imgBuffer = await imgRes.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
  const mimeType = imgRes.headers.get("content-type") || "image/jpeg";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: ANALYSIS_PROMPT },
          ],
        }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.2 },
      }),
    }
  );
  if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function cleanJson(raw: string): unknown {
  let clean = raw.trim();
  if (clean.startsWith("```json")) clean = clean.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
  else if (clean.startsWith("```")) clean = clean.replace(/```\n?/g, "");
  return JSON.parse(clean);
}

// ── Handler ───────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, provider = "openai", apiKey: clientKey } = await req.json();
    if (!imageUrl) throw new Error("imageUrl is required");

    const openaiSecret = Deno.env.get("OPENAI_API_KEY");
    const geminiSecret = Deno.env.get("GEMINI_API_KEY");

    let rawResult: string;

    if (provider === "gemini") {
      const key = clientKey || geminiSecret;
      if (!key) throw new Error("Gemini API key not configured.");
      rawResult = await analyseWithGemini(imageUrl, key);
    } else {
      const key = clientKey || openaiSecret;
      if (!key) throw new Error("OpenAI API key not configured.");
      rawResult = await analyseWithOpenAI(imageUrl, key);
    }

    const parsed = cleanJson(rawResult);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyse-postcard-image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
