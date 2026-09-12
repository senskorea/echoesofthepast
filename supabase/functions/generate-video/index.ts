import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

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

    const key = typeof clientKey === "string" ? clientKey.trim() : "";
    if (!key) {
      throw new Error("A Gemini API key from Settings is required for video generation.");
    }

    if (action === "generate") {
      if (!prompt) throw new Error("Prompt is required for video generation.");
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predictLongRunning`;
      
      const instance: { prompt: string; image?: { bytesBase64Encoded: string; mimeType: string } } = { prompt };
      if (base64Image) {
        instance.image = {
          bytesBase64Encoded: base64Image.split(",").pop() || base64Image,
          mimeType,
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
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

      const url = `https://generativelanguage.googleapis.com/v1beta/${cleanName}`;
      
      const res = await fetch(url, { headers: { "x-goog-api-key": key } });
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
        
        const videoResponse = await fetch(videoUri, { headers: { "x-goog-api-key": key } });
        if (!videoResponse.ok) throw new Error(`Failed to retrieve generated video: ${videoResponse.status}`);

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase storage credentials are unavailable.");

        const storage = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
        const objectPath = `generated-videos/${crypto.randomUUID()}.mp4`;
        const { error: uploadError } = await storage.storage
          .from("postcards")
          .upload(objectPath, await videoResponse.arrayBuffer(), {
            contentType: videoResponse.headers.get("content-type") || "video/mp4",
            upsert: false,
          });
        if (uploadError) throw new Error(`Failed to store generated video: ${uploadError.message}`);

        const { data: publicUrl } = storage.storage.from("postcards").getPublicUrl(objectPath);

        return new Response(JSON.stringify({ done: true, videoUrl: publicUrl.publicUrl }), {
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
