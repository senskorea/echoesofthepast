import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { json } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const systemPrompt = `You are a JSON transformation assistant. Your task is to convert any postcard-related JSON data into the following simple format:

{
  "id": "unique-id-string",
  "title": "Postcard title",
  "description": "Detailed description",
  "image_url": "URL to the image",
  "latitude": 48.8584,
  "longitude": 2.2945
}

Rules:
1. Extract or generate a unique ID (use postcard_id if available, otherwise generate one)
2. Extract the title
3. Combine all descriptive information into a single description field
4. Extract the image_url
5. Extract latitude and longitude coordinates
6. Return ONLY a valid JSON array of objects in this format
7. If input has multiple postcards, return an array with all of them
8. If any field is missing, try to infer reasonable defaults or use the data available

Input JSON will vary in structure. Your job is to intelligently extract and map the data.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Transform this JSON:\n\n${json}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI formatting failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const formattedJson = data.choices[0].message.content;

    // Extract JSON from markdown code blocks if present
    let cleanJson = formattedJson.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/```\n?/g, "").replace(/```\n?$/g, "");
    }

    // Validate it's proper JSON
    const parsed = JSON.parse(cleanJson);

    return new Response(JSON.stringify({ formatted: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in format-postcard-json:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
