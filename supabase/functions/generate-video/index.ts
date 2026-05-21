import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { 
      action, // "generate" | "poll"
      prompt, 
      modelId = "veo-3.1-generate-preview", 
      base64Image, 
      mimeType = "image/jpeg", 
      operationName, 
      apiKey: clientKey 
    } = body;

    const geminiSecret = Deno.env.get("GEMINI_API_KEY");
    const key = clientKey || geminiSecret;
    if (!key) {
      throw new Error("Gemini API key not configured. Add it in Settings or set GEMINI_API_KEY in Supabase secrets.");
    }

    if (action === "generate") {
      if (!prompt) throw new Error("Prompt is required for video generation.");
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predictLongRunning?key=${key}`;
      
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

      return new Response(JSON.stringify({ operationName: d.name }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "poll") {
      if (!operationName) throw new Error("Operation name is required for polling.");
      
      const cleanName = operationName.startsWith("operations/") || operationName.startsWith("projects/") 
        ? operationName 
        : `operations/${operationName}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/${cleanName}?key=${key}`;
      
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
        
        // Append API key if required
        const finalVideoUrl = videoUri.includes("?key=") 
          ? videoUri 
          : `${videoUri}${videoUri.includes("?") ? "&" : "?"}key=${key}`;

        return new Response(JSON.stringify({ done: true, videoUrl: finalVideoUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ done: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error("Error in generate-video:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
