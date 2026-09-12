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

interface PostcardInput { title: string; description: string; latitude: number; longitude: number }

function userPrompt(postcard: PostcardInput) {
  return `Create a captivating historical narrative for this postcard:

Title: ${postcard.title}
Description: ${postcard.description}
Location: ${postcard.latitude}°N, ${postcard.longitude}°E

Generate a story that brings this moment in history to life.`;
}

// ── OpenAI ───────────────────────────────────────────────────
async function generateWithOpenAI(postcard: PostcardInput, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt(postcard) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

// ── Gemini ───────────────────────────────────────────────────
async function generateWithGemini(postcard: PostcardInput, apiKey: string): Promise<string> {
  const prompt = `${systemPrompt}\n\n${userPrompt(postcard)}`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
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

    const key = typeof clientKey === "string" ? clientKey.trim() : "";
    if (!key) throw new Error("An AI API key from Settings is required.");

    let story: string;

    if (provider === "gemini") {
      story = await generateWithGemini(postcard, key);
    } else {
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
