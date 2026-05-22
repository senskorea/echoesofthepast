import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload, Loader2, Sparkles, ClipboardCopy, Check,
  ImagePlus, FileJson, MapPin, X, AlertTriangle, Crop as CropIcon
} from "lucide-react";
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Postcard } from "@/types/postcard";
import { getSupabaseConfig, getAIConfig } from "@/lib/supabase-config";
import { getSupabaseClient } from "@/lib/supabase-client";

interface ImportDialogProps {
  onImport: (postcards: Postcard[]) => void;
  editingCard?: Postcard;
  trigger?: React.ReactNode;
}

type Tab = "upload" | "json";

const JSON_FORMAT_PROMPT = `
You are a data formatting assistant for GeoStories, a historical postcard mapping app.

Convert my data into an array of postcard objects with this exact structure:

[
  {
    "id": "unique-string-id",
    "title": "Descriptive title of the postcard",
    "description": "One or more sentences describing the historical scene or location",
    "imageUrl": "https://direct-link-to-image.jpg",
    "latitude": 48.8584,
    "longitude": 2.2945
  }
]

Rules:
- "id" must be unique per entry (use a UUID or slug)
- "latitude" and "longitude" must be numbers (not strings)
- "imageUrl" must be a publicly accessible direct image URL
- Return ONLY the JSON array, no prose or code fences

Here is my data to convert:
[PASTE YOUR DATA HERE]
`.trim();

const BUCKET_SETUP_PROMPT = `
You are a setup assistant for the Echoes of the Past platform, which uses Supabase for storage. Your goal is to help me create a public storage bucket.

IMPORTANT INSTRUCTION: DO NOT dump all these instructions at once. That is overwhelming. Guide me interactively, step-by-step. Give me ONE step to do, wait for me to confirm I have done it, and only then provide the next step.

Here is the process:
1. Go to https://supabase.com/dashboard and open your project.
2. In the left sidebar, click "Storage".
3. Click "New bucket".
4. Name it exactly: postcards
5. Enable "Public bucket" (toggle it ON).
6. Click "Save".
7. Go to Storage → Policies and add an INSERT policy allowing public/anon uploads with the formula 'true'.

Please begin by giving me just Step 1.
`.trim();

const ImportDialog = ({ onImport, editingCard, trigger }: ImportDialogProps) => {
  const [tab, setTab] = useState<Tab>("upload");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // ── Bucket health check ──
  const [bucketStatus, setBucketStatus] = useState<"unknown" | "ok" | "missing" | "no-config">("unknown");
  const [copiedBucketGuide, setCopiedBucketGuide] = useState(false);

  const checkBucket = async () => {
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) { setBucketStatus("no-config"); return; }
    try {
      const supabase = getSupabaseClient();
      
      // Try to auto-create the bucket just in case they have permissions
      await supabase.storage.createBucket("postcards", { public: true }).catch(() => {});

      const { error } = await supabase.storage.from("postcards").list("", { limit: 1 });
      setBucketStatus(error ? "missing" : "ok");
    } catch {
      setBucketStatus("missing");
    }
  };

  const handleCopyBucketGuide = () => {
    navigator.clipboard.writeText(BUCKET_SETUP_PROMPT).then(() => {
      setCopiedBucketGuide(true);
      setTimeout(() => setCopiedBucketGuide(false), 2500);
    });
  };

  // ── Upload tab state ──
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [secondaryImages, setSecondaryImages] = useState<{file: File, preview: string, url?: string}[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [visionResults, setVisionResults] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // ── Cropping state ──
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const [fields, setFields] = useState({
    title: editingCard?.title || "",
    description: editingCard?.description || "",
    latitude: String(editingCard?.latitude || ""),
    longitude: String(editingCard?.longitude || ""),
  });

  useEffect(() => {
    if (editingCard && open) {
      setFields({
        title: editingCard.title,
        description: editingCard.description,
        latitude: String(editingCard.latitude),
        longitude: String(editingCard.longitude),
      });
      setImagePreview(editingCard.imageUrl || editingCard.image_url || "");
      setUploadedUrl(editingCard.imageUrl || editingCard.image_url || "");
    }
  }, [editingCard, open]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── JSON tab state ──
  const [jsonInput, setJsonInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // ────────────────────────────────────────────
  // SHARED RESET
  // ────────────────────────────────────────────
  const resetAll = () => {
    setImageFile(null);
    setImagePreview("");
    setSecondaryImages([]);
    setUploadedUrl("");
    setVisionResults(null);
    setBucketStatus("unknown");
    setFields({ title: "", description: "", latitude: "", longitude: "" });
    setJsonInput("");
    setTab("upload");
  };

  // ────────────────────────────────────────────
  // IMAGE UPLOAD TAB
  // ────────────────────────────────────────────
  const handleFileSelect = (file: File, isSecondary = false) => {
    if (!file.type.startsWith("image/")) {
      const desc = "Please select an image file.";
      toast({
        title: "Invalid file",
        description: desc,
        variant: "destructive",
        action: (
          <ToastAction altText="Copy error" onClick={() => navigator.clipboard.writeText(desc)}>
            Copy
          </ToastAction>
        ),
      });
      return;
    }
    if (isSecondary) {
      setSecondaryImages(prev => [...prev, { file, preview: URL.createObjectURL(file) }]);
    } else {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setUploadedUrl("");
      setFields({ title: "", description: "", latitude: "", longitude: "" });
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleCropComplete = () => {
    if (!completedCrop || !imgRef.current) {
      setIsCropping(false);
      return;
    }
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Check if the crop has any dimensions to avoid drawing a 0x0 canvas
    if (!completedCrop.width || !completedCrop.height) {
      setIsCropping(false);
      return;
    }

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCropping(false);
      return;
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const newFile = new File([blob], imageFile?.name || 'cropped.jpg', { type: imageFile?.type || 'image/jpeg' });
      setImageFile(newFile);
      setImagePreview(URL.createObjectURL(newFile));
      setIsCropping(false);
      setUploadedUrl("");
    }, imageFile?.type || 'image/jpeg');
  };

  const uploadToSupabase = async (fileParam?: File): Promise<string> => {
    const fileToUpload = fileParam || imageFile;
    if (!fileToUpload) throw new Error("No image selected");
    const supabase = getSupabaseClient();
    
    // Attempt to create the bucket if it doesn't exist (this works if the project allows it)
    await supabase.storage.createBucket("postcards", { public: true }).catch(() => {});

    const ext = fileToUpload.name.split(".").pop();
    const filename = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("postcards")
      .upload(filename, fileToUpload, { upsert: false, contentType: fileToUpload.type });
      
    if (error) {
      if (error.message.includes("Bucket not found")) {
        throw new Error("Storage Bucket 'postcards' does not exist in your Supabase project. Please go to your Supabase Dashboard -> Storage -> Create a new public bucket named 'postcards'.");
      }
      throw new Error(`Upload failed: ${error.message}`);
    }
    const { data } = supabase.storage.from("postcards").getPublicUrl(filename);
    return data.publicUrl;
  };


  const analyseWithAI = async () => {
    if (!imageFile) return;
    setAnalysing(true);

    try {
      // ── Stage 1: Get AI config ──
      const { provider, apiKey } = getAIConfig();
      if (!apiKey) {
        throw new Error(
          `No ${provider === "gemini" ? "Gemini" : "OpenAI"} API key configured. Add it in Settings → AI Provider.`
        );
      }

      // ── Stage 2: Upload image to Supabase Storage (or skip if already done) ──
      let imgUrl = uploadedUrl;
      if (!imgUrl) {
        setUploading(true);
        try {
          imgUrl = await uploadToSupabase();
          setUploadedUrl(imgUrl);
        } catch (uploadErr) {
          throw new Error(
            `Image upload failed: ${uploadErr instanceof Error ? uploadErr.message : "check that the 'postcards' bucket exists in Supabase Storage."}`
          );
        } finally {
          setUploading(false);
        }
      }

      const VISION_PROMPT = `You are an expert historical archivist analysing a vintage postcard or historical photograph.
Return ONLY a JSON object with these fields (no markdown, no prose):
{
  "title": "Concise title with location and approximate era, e.g. 'Rue de Rivoli, Paris, c.1905'",
  "description": "2–3 sentences describing the scene, historical context, and notable details.",
  "latitude": <decimal number>,
  "longitude": <decimal number>,
  "confidence": "low | medium | high"
}
For coordinates: identify location from visual clues. If uncertain, give best estimate with confidence "low".`;

      let result: { title: string; description: string; latitude: number; longitude: number };

      // ── Stage 3: Call AI directly from browser ──
      if (provider === "gemini") {
        // Fetch image → base64 for Gemini inline_data
        const imgRes = await fetch(imgUrl);
        if (!imgRes.ok) throw new Error("Could not fetch the uploaded image for analysis.");
        const imgBuffer = await imgRes.arrayBuffer();
        // Convert to base64 in chunks — spread (...) on large arrays causes stack overflow
        const bytes = new Uint8Array(imgBuffer);
        let binary = "";
        const chunkSize = 8192;
        for (let i = 0; i < bytes.byteLength; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        const base64 = btoa(binary);
        const mimeType = imgRes.headers.get("content-type") || imageFile.type || "image/jpeg";

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inline_data: { mime_type: mimeType, data: base64 } },
                  { text: VISION_PROMPT },
                ],
              }],
              generationConfig: { maxOutputTokens: 600, temperature: 0.2 },
            }),
          }
        );
        if (!geminiRes.ok) {
          const err = await geminiRes.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Gemini API error ${geminiRes.status}. Check your API key in Settings.`);
        }
        const geminiData = await geminiRes.json();
        let raw = geminiData.candidates[0].content.parts[0].text.trim();
        if (raw.startsWith("```")) raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        result = JSON.parse(raw);

      } else {
        // OpenAI GPT-4o Vision — supports public URLs directly
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o",
            max_tokens: 600,
            messages: [{
              role: "user",
              content: [
                { type: "image_url", image_url: { url: imgUrl, detail: "high" } },
                { type: "text", text: VISION_PROMPT },
              ],
            }],
          }),
        });
        if (!openaiRes.ok) {
          const err = await openaiRes.json().catch(() => ({}));
          throw new Error(err?.error?.message || `OpenAI API error ${openaiRes.status}. Check your API key in Settings.`);
        }
        const openaiData = await openaiRes.json();
        let raw = openaiData.choices[0].message.content.trim();
        if (raw.startsWith("```")) raw = raw.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
        result = JSON.parse(raw);
      }

      setVisionResults(result);
      setFields({
        title: result.title || "",
        description: result.description || "",
        latitude: String(result.latitude || ""),
        longitude: String(result.longitude || ""),
      });
      toast({ title: "AI analysis complete ✓", description: "Fields auto-filled. Review and adjust as needed." });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Could not analyse the image.";
      toast({
        title: "Analysis failed",
        description: errorMsg,
        variant: "destructive",
        action: (
          <div className="flex gap-2">
            <ToastAction altText="Copy error" onClick={() => navigator.clipboard.writeText(errorMsg)}>
              Copy Error
            </ToastAction>
            {errorMsg.includes("not be deployed yet") && (
              <ToastAction altText="Copy deploy command" onClick={() => {
                const url = getSupabaseConfig().url;
                const projectRef = url.split('.')[0].split('//')[1];
                navigator.clipboard.writeText(`npx supabase functions deploy analyse-postcard-image --project-ref ${projectRef} --no-verify-jwt`);
              }}>
                Copy Deploy Cmd
              </ToastAction>
            )}
          </div>
        ),
      });
    } finally {
      setAnalysing(false);
      setUploading(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!imageFile && !uploadedUrl) {
      const desc = "Please select an image first.";
      toast({
        title: "No image",
        description: desc,
        variant: "destructive",
        action: (
          <ToastAction altText="Copy error" onClick={() => navigator.clipboard.writeText(desc)}>
            Copy
          </ToastAction>
        ),
      });
      return;
    }
    if (!fields.title.trim()) {
      const desc = "Please add a title for this postcard.";
      toast({
        title: "Title required",
        description: desc,
        variant: "destructive",
        action: (
          <ToastAction altText="Copy error" onClick={() => navigator.clipboard.writeText(desc)}>
            Copy
          </ToastAction>
        ),
      });
      return;
    }
    setUploading(true);
    try {
      let imgUrl = uploadedUrl;
      if (!imgUrl && imageFile) {
        imgUrl = await uploadToSupabase(imageFile);
        setUploadedUrl(imgUrl);
      }

      // Upload secondary images
      const secondaryUrls: string[] = [];
      for (const item of secondaryImages) {
        if (item.url) {
          secondaryUrls.push(item.url);
        } else {
          const url = await uploadToSupabase(item.file);
          secondaryUrls.push(url);
        }
      }

      const postcard: Postcard = {
        ...(editingCard || {}),
        id: editingCard?.id || crypto.randomUUID(),
        title: fields.title.trim(),
        description: fields.description.trim(),
        imageUrl: imgUrl,
        secondaryImages: secondaryUrls.length > 0 ? secondaryUrls : editingCard?.secondaryImages,
        aiVisionResults: visionResults || editingCard?.aiVisionResults,
        latitude: parseFloat(fields.latitude) || 0,
        longitude: parseFloat(fields.longitude) || 0,
      };
      
      if (editingCard) {
        // Find and replace in parent state (passed via onImport)
        onImport([postcard]);
      } else {
        onImport([postcard]);
      }
      setOpen(false);
      resetAll();
      toast({ title: "Postcard added!", description: `"${postcard.title}" is now on the map.` });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Please check your Supabase configuration in Settings.";
      toast({
        title: "Upload failed",
        description: errorMsg,
        variant: "destructive",
        action: (
          <ToastAction altText="Copy error" onClick={() => navigator.clipboard.writeText(errorMsg)}>
            Copy
          </ToastAction>
        ),
      });
    } finally {
      setUploading(false);
    }
  };

  // ────────────────────────────────────────────
  // JSON TAB
  // ────────────────────────────────────────────
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(JSON_FORMAT_PROMPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleJsonImport = async () => {
    if (!jsonInput.trim()) {
      const desc = "Please paste some JSON data to import.";
      toast({
        title: "Empty input",
        description: desc,
        variant: "destructive",
        action: (
          <ToastAction altText="Copy error" onClick={() => navigator.clipboard.writeText(desc)}>
            Copy
          </ToastAction>
        ),
      });
      return;
    }
    setIsProcessing(true);
    try {
      const { url, anonKey } = getSupabaseConfig();
      let postcards: any[] = [];
      try {
        const response = await fetch(`${url}/functions/v1/format-postcard-json`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
          body: JSON.stringify({ json: jsonInput }),
        });
        if (!response.ok) {
          throw new Error("Failed to format JSON via edge function");
        }
        const { formatted } = await response.json();
        postcards = Array.isArray(formatted) ? formatted : [formatted];
      } catch (err) {
        // Fallback: Try native client-side parsing
        const parsed = JSON.parse(jsonInput);
        postcards = Array.isArray(parsed) ? parsed : [parsed];
      }
      onImport(postcards);
      setOpen(false);
      resetAll();
      toast({ title: "Import successful!", description: `Imported ${postcards.length} postcard${postcards.length > 1 ? "s" : ""}.` });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Please check your JSON format.";
      toast({
        title: "Import failed",
        description: errorMsg,
        variant: "destructive",
        action: (
          <ToastAction altText="Copy error" onClick={() => navigator.clipboard.writeText(errorMsg)}>
            Copy
          </ToastAction>
        ),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) checkBucket(); if (!v) resetAll(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="eop-btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Upload style={{ width: 14, height: 14 }} />
            Add Story
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto" style={{ zIndex: 300 }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 400 }}>
            Add a Geostory
          </DialogTitle>
        </DialogHeader>

        {/* ── Tabs ── */}
        <div className="import-tabs">
          <button
            className={`import-tab ${tab === "upload" ? "active" : ""}`}
            onClick={() => { setTab("upload"); if (bucketStatus === "unknown") checkBucket(); }}
          >
            <ImagePlus style={{ width: 14, height: 14 }} /> Upload Image
          </button>
          <button
            className={`import-tab ${tab === "json" ? "active" : ""}`}
            onClick={() => setTab("json")}
          >
            <FileJson style={{ width: 14, height: 14 }} /> Import JSON
          </button>
        </div>

        {/* ══════════════════════════════════════
            UPLOAD TAB
        ══════════════════════════════════════ */}
        {tab === "upload" && (
          <div className="import-upload-panel">

            {/* Bucket warning */}
            {(bucketStatus === "missing" || bucketStatus === "no-config") && (
              <div className="import-bucket-warning">
                <div className="import-bucket-warning-icon">
                  <AlertTriangle style={{ width: 16, height: 16 }} />
                </div>
                <div className="import-bucket-warning-text">
                  <p className="import-bucket-warning-title">
                    {bucketStatus === "no-config"
                      ? "Supabase not configured"
                      : "Storage bucket missing"}
                  </p>
                  <p className="import-bucket-warning-sub">
                    {bucketStatus === "no-config"
                      ? <>Add your Supabase URL and key in <a href="/settings" style={{textDecoration:"underline"}}>Settings</a> first.</>  
                      : <>The <code style={{fontFamily:"monospace",fontSize:"0.8em"}}>postcards</code> bucket doesn't exist yet in your Supabase project.</>}
                  </p>
                </div>
                {bucketStatus === "missing" && (
                  <button className="import-copy-bucket-btn" onClick={handleCopyBucketGuide}>
                    {copiedBucketGuide
                      ? <><Check style={{ width: 12, height: 12 }} /> Copied!</>
                      : <><ClipboardCopy style={{ width: 12, height: 12 }} /> Copy setup guide</>}
                  </button>
                )}
              </div>
            )}

            {/* Drop zone */}
            <div
              className={`import-dropzone ${isDragging ? "dragging" : ""} ${imagePreview ? "has-image" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => !imagePreview && !isCropping && fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="import-preview-wrap" style={{ position: "relative" }}>
                  {isCropping ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
                        <img ref={imgRef} src={imagePreview} alt="Preview" className="import-preview-img" style={{ maxHeight: "300px", objectFit: "contain" }} />
                      </ReactCrop>
                    </div>
                  ) : (
                    <img src={imagePreview} alt="Preview" className="import-preview-img" style={{ maxHeight: "300px", objectFit: "contain" }} />
                  )}
                  
                  {!isCropping && (
                    <>
                      <button
                        className="import-preview-remove"
                        style={{ position: "absolute", top: 8, right: 8 }}
                        onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(""); setUploadedUrl(""); }}
                      >
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                      <button
                        style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: 4, padding: "6px 10px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                        onClick={(e) => { e.stopPropagation(); setIsCropping(true); }}
                      >
                        <CropIcon style={{ width: 14, height: 14 }} /> Crop
                      </button>
                    </>
                  )}

                  {isCropping && (
                    <div style={{ position: "absolute", bottom: -40, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 8 }}>
                      <button 
                        style={{ background: "white", color: "var(--grey-1)", border: "1px solid var(--grey-5)", borderRadius: 6, padding: "6px 12px", fontSize: "0.85rem", cursor: "pointer", fontWeight: 500 }}
                        onClick={(e) => { e.stopPropagation(); setIsCropping(false); }}
                      >
                        Cancel
                      </button>
                      <button 
                        style={{ background: "var(--grey-1)", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: "0.85rem", cursor: "pointer", fontWeight: 500 }}
                        onClick={(e) => { e.stopPropagation(); handleCropComplete(); }}
                      >
                        Apply Crop
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="import-dropzone-inner">
                  <ImagePlus style={{ width: 32, height: 32, color: "var(--grey-4)" }} />
                  <p className="import-drop-label">Drag & drop a postcard image</p>
                  <p className="import-drop-hint">or click to browse — JPG, PNG, WebP up to 50 MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => { 
                const f = e.target.files?.[0]; 
                if (f) handleFileSelect(f); 
                e.target.value = ""; // Reset for re-selection
              }}
            />

            {/* Secondary Images List */}
            {imagePreview && (
              <div className="import-secondary-section" style={{ marginTop: 12 }}>
                <p className="import-field-label" style={{ marginBottom: 8 }}>Secondary Images (Back, details, etc.)</p>
                <div className="import-secondary-grid" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {secondaryImages.map((img, idx) => (
                    <div key={idx} style={{ position: "relative", width: 80, height: 80, border: "1px solid var(--grey-5)", borderRadius: 8, overflow: "hidden" }}>
                      <img src={img.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button 
                        style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.5)", color: "white", borderRadius: "50%", padding: 2 }}
                        onClick={() => setSecondaryImages(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <X style={{ width: 10, height: 10 }} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => {
                        const f = (e.target as HTMLInputElement).files?.[0];
                        if (f) handleFileSelect(f, true);
                      };
                      input.click();
                    }}
                    style={{ width: 80, height: 80, border: "1px dashed var(--grey-4)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--grey-6)" }}
                  >
                    <ImagePlus style={{ width: 20, height: 20, color: "var(--grey-4)" }} />
                  </button>
                </div>
              </div>
            )}

            {/* AI Analyse button */}
            {imageFile && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="import-ai-btn"
                  onClick={analyseWithAI}
                  style={{ flex: 1 }}
                  disabled={analysing || uploading}
                >
                  {analysing || uploading ? (
                    <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                    {uploading ? "Uploading…" : "Analysing with AI…"}</>
                  ) : (
                    <><Sparkles style={{ width: 14, height: 14 }} />
                    Analyse with AI Vision</>
                  )}
                </button>
                
                {visionResults && (
                  <button
                    className="import-ai-btn"
                    style={{ background: "white", color: "var(--grey-2)", border: "1px solid var(--grey-5)", padding: "0 12px" }}
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(visionResults, null, 2));
                      toast({ title: "Copied!", description: "AI Vision JSON copied to clipboard." });
                    }}
                    title="Copy AI Vision Results"
                  >
                    <FileJson style={{ width: 14, height: 14 }} />
                  </button>
                )}
              </div>
            )}

            {/* Form fields */}
            <div className="import-fields">
              <div className="import-field">
                <label className="import-field-label">Title *</label>
                <input
                  type="text"
                  className="eop-input"
                  placeholder="e.g. Aerial view of Place de l'Étoile, Paris, c.1900"
                  value={fields.title}
                  onChange={(e) => setFields(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="import-field">
                <label className="import-field-label">Description</label>
                <textarea
                  className="eop-input import-textarea"
                  placeholder="Historical context, what is shown, notable details…"
                  rows={3}
                  value={fields.description}
                  onChange={(e) => setFields(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="import-field-row">
                <div className="import-field">
                  <label className="import-field-label">
                    <MapPin style={{ width: 11, height: 11, display: "inline" }} /> Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="eop-input"
                    placeholder="48.8738"
                    value={fields.latitude}
                    onChange={(e) => setFields(f => ({ ...f, latitude: e.target.value }))}
                  />
                </div>
                <div className="import-field">
                  <label className="import-field-label">
                    <MapPin style={{ width: 11, height: 11, display: "inline" }} /> Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="eop-input"
                    placeholder="2.2950"
                    value={fields.longitude}
                    onChange={(e) => setFields(f => ({ ...f, longitude: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="import-actions">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <button
                className="eop-btn-primary"
                onClick={handleUploadSubmit}
                disabled={uploading || (!imageFile && !uploadedUrl)}
              >
                {uploading
                  ? <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> Uploading…</>
                  : "Add to Map"}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            JSON TAB
        ══════════════════════════════════════ */}
        {tab === "json" && (
          <div className="import-json-panel">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Paste your JSON here:</label>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-2.5 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    {copied ? (
                      <><Check style={{ width: 12, height: 12, color: "green" }} /><span style={{ color: "green" }}>Copied!</span></>
                    ) : (
                      <><ClipboardCopy style={{ width: 12, height: 12 }} />Copy format guide for AI</>
                    )}
                  </button>
                </div>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`[\n  {\n    "id": "pc-001",\n    "title": "Historic Location",\n    "description": "A beautiful scene...",\n    "imageUrl": "https://...",\n    "latitude": 48.8584,\n    "longitude": 2.2945\n  }\n]`}
                  className="min-h-[240px] font-mono text-sm"
                />
              </div>

              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p className="font-medium mb-1">💡 Two ways to import</p>
                <p className="text-muted-foreground text-xs">
                  <strong>Option A</strong> — paste any JSON and click Import; the AI edge function reformats it automatically.<br />
                  <strong>Option B</strong> — click <em>"Copy format guide for AI"</em> above, paste into ChatGPT or Claude with your data, then paste the cleaned JSON back here.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleJsonImport} disabled={isProcessing} className="gap-2">
                  {isProcessing ? (
                    <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />Processing with AI…</>
                  ) : (
                    <><Sparkles style={{ width: 14, height: 14 }} />Import</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;
