import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCHEMA = `{
  "id": "unique-id-string",
  "title": "Postcard title including location and era",
  "description": "Detailed description combining all available context",
  "imageUrl": "URL to the image",
  "latitude": 48.8584,
  "longitude": 2.2945
}`;

function buildPrompt(json: string) {
  return `You are a JSON transformation assistant for a historical postcard mapping platform.

Convert any postcard-related JSON into this exact format:
${SCHEMA}

Rules:
1. Extract or generate a unique ID (use postcard_id if available, otherwise generate one)
2. Extract the title (include location and era if visible)
3. Combine all descriptive fields into one description
4. Extract imageUrl (use image_url, imageUrl, or any image field)
5. Extract latitude and longitude as numbers
6. Return ONLY a valid JSON array, no markdown, no prose
7. If multiple postcards exist in input, return all of them
8. If any field is missing, use reasonable defaults or leave blank

Input JSON:
${json}`;
}

// ── OpenAI ────────────────────────────────────────────────────
async function formatWithOpenAI(json: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: buildPrompt(json) }],
    }),
  });
  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

// ── Gemini ────────────────────────────────────────────────────
async function formatWithGemini(json: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(json) }] }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.1 },
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
    const { json, provider = "openai", apiKey: clientKey } = await req.json();
    const openaiSecret = Deno.env.get("OPENAI_API_KEY");
    const geminiSecret = Deno.env.get("GEMINI_API_KEY");

    let rawResult: string;

    if (provider === "gemini") {
      const key = clientKey || geminiSecret;
      if (!key) throw new Error("Gemini API key not configured.");
      rawResult = await formatWithGemini(json, key);
    } else {
      const key = clientKey || openaiSecret;
      if (!key) throw new Error("OpenAI API key not configured.");
      rawResult = await formatWithOpenAI(json, key);
    }

    const formatted = cleanJson(rawResult);

    return new Response(JSON.stringify({ formatted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in format-postcard-json:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
