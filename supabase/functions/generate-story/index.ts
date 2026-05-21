import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Shared prompt ────────────────────────────────────────────
const systemPrompt = `You are a historical storyteller specialising in vintage postcards and historical photographs. Create engaging, immersive narratives that transport readers to the time and place depicted. Your stories should:

1. Be written in vivid, sensory-rich prose
2. Include historical context and fascinating details about the era
3. Paint a picture of daily life, architecture, and culture
4. Be 3–4 paragraphs long
5. Maintain historical accuracy while being engaging
6. Use a warm, nostalgic tone that honours the past`;

function userPrompt(postcard: { title: string; description: string; latitude: number; longitude: number }) {
  return `Create a captivating historical narrative for this postcard:

Title: ${postcard.title}
Description: ${postcard.description}
Location: ${postcard.latitude}°N, ${postcard.longitude}°E

Generate a story that brings this moment in history to life.`;
}

// ── OpenAI ───────────────────────────────────────────────────
async function generateWithOpenAI(postcard: object, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt(postcard as any) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

// ── Gemini ───────────────────────────────────────────────────
async function generateWithGemini(postcard: object, apiKey: string): Promise<string> {
  const prompt = `${systemPrompt}\n\n${userPrompt(postcard as any)}`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.8 },
      }),
    }
  );
  if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// ── Handler ──────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { postcard, provider = "openai", apiKey: clientKey } = await req.json();

    // Resolve API key: client-provided → Supabase secret
    const openaiSecret = Deno.env.get("OPENAI_API_KEY");
    const geminiSecret = Deno.env.get("GEMINI_API_KEY");

    let story: string;

    if (provider === "gemini") {
      const key = clientKey || geminiSecret;
      if (!key) throw new Error("Gemini API key not configured. Add it in Settings or set GEMINI_API_KEY in Supabase secrets.");
      story = await generateWithGemini(postcard, key);
    } else {
      const key = clientKey || openaiSecret;
      if (!key) throw new Error("OpenAI API key not configured. Add it in Settings or set OPENAI_API_KEY in Supabase secrets.");
      story = await generateWithOpenAI(postcard, key);
    }

    return new Response(JSON.stringify({ story }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-story:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
