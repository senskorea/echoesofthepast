import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { generateText, uploadImage } from "@/lib/ai-service";
import { TEXT_MODELS } from "@/lib/ai-models";
import { friendlyError, ServiceError } from "@/lib/service-errors";
import { useLanguage } from "@/lib/i18n";
import { parsePostcards } from "@/lib/postcard-data";

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

const ImportDialog = ({ onImport, editingCard, trigger }: ImportDialogProps) => {
  const [tab, setTab] = useState<Tab>("upload");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { lang } = useLanguage();

  // ── Bucket health check ──
  const [bucketStatus, setBucketStatus] = useState<"unknown" | "ok" | "missing" | "no-config">("unknown");

  const checkBucket = async () => {
    const { url, anonKey } = getSupabaseConfig();
    setBucketStatus(url && anonKey && import.meta.env.VITE_CENTRAL_SERVICES_ENABLED === "true" ? "ok" : "no-config");
  };

  // ── Upload tab state ──
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [secondaryImages, setSecondaryImages] = useState<{file: File, preview: string, url?: string}[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [visionResults, setVisionResults] = useState<Postcard["aiVisionResults"]>();
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
  const handleFileSelect = useCallback((file: File, isSecondary = false) => {
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
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

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
    const file = fileParam || imageFile;
    if (!file) throw new ServiceError("invalid");
    return uploadImage(file);
  };

  const analyseWithAI = async () => {
    if (!imageFile) return;
    setAnalysing(true);

    try {
      const { provider } = getAIConfig();
      // ── Stage 2: Upload image to Supabase Storage (or skip if already done) ──
      let imgUrl = uploadedUrl;
      if (!imgUrl) {
        setUploading(true);
        try {
          imgUrl = await uploadToSupabase();
          setUploadedUrl(imgUrl);
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

      const bytes = new Uint8Array(await imageFile.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      const model = TEXT_MODELS.find(m => m.provider === provider)!;
      const raw = await generateText(VISION_PROMPT, model.id, btoa(binary), imageFile.type);
      let result: { title: string; description: string; latitude: number; longitude: number };
      try {
        const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, ""));
        result = parsePostcards({ ...parsed, id: "analysis" })[0];
      } catch { throw new ServiceError("refused"); }

      setVisionResults(result);
      setFields({
        title: result.title || "",
        description: result.description || "",
        latitude: String(result.latitude ?? ""),
        longitude: String(result.longitude ?? ""),
      });
      toast({ title: "AI analysis complete ✓", description: "Fields auto-filled. Review and adjust as needed." });

    } catch (err) {
      const errorMsg = friendlyError(err, lang);
      toast({
        title: "Analysis failed",
        description: errorMsg,
        variant: "destructive",
        action: (
          <div className="flex gap-2">
            <ToastAction altText="Copy error" onClick={() => navigator.clipboard.writeText(errorMsg)}>
              Copy Error
            </ToastAction>

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

      const postcard = parsePostcards({
        ...(editingCard || {}),
        id: editingCard?.id || crypto.randomUUID(),
        title: fields.title.trim(),
        description: fields.description.trim(),
        imageUrl: imgUrl,
        secondaryImages: secondaryUrls.length > 0 ? secondaryUrls : editingCard?.secondaryImages,
        aiVisionResults: visionResults || editingCard?.aiVisionResults,
        latitude: fields.latitude,
        longitude: fields.longitude,
      })[0];
      
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
      const errorMsg = friendlyError(err, lang);
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
      // An exported archive never needs a paid AI request to restore it.
      let postcards: Postcard[];
      try { postcards = parsePostcards(JSON.parse(jsonInput)); }
      catch {
        const { provider } = getAIConfig();
        const model = TEXT_MODELS.find(m => m.provider === provider)!;
        const formatted = await generateText(JSON_FORMAT_PROMPT.replace('[PASTE YOUR DATA HERE]', jsonInput), model.id);
        try { postcards = parsePostcards(JSON.parse(formatted.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, ''))); }
        catch { throw new ServiceError('invalid'); }
      }
      onImport(postcards);
      setOpen(false);
      resetAll();
      toast({ title: "Import successful!", description: `Imported ${postcards.length} postcard${postcards.length > 1 ? "s" : ""}.` });
    } catch (error) {
      const errorMsg = error instanceof SyntaxError ? "This is not a supported GeoStories backup. Choose an exported JSON archive." : friendlyError(error, lang);
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

            {bucketStatus === "no-config" && (
              <p role="status" className="import-bucket-warning">{friendlyError(new ServiceError("unavailable"), lang)}</p>
            )}
            <p className="text-sm text-muted-foreground mb-3">Upload only images you have permission to share. Uploaded media can be viewed by anyone with its link; your postcard is not automatically added to the public archive.</p>

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
