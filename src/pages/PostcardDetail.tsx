import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Loader2, Download, Save, Volume2, ImageIcon, FileText, Pencil, BookOpen, Mail, Clapperboard, Check, FileJson, Sparkles, ScanText, HeartPulse, Lightbulb, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, Play, Pause, Wand2, Layers } from "lucide-react";
import mockData from "@/data/mock-data.json";
import { Postcard } from "@/types/postcard";
import { getAIConfig } from "@/lib/supabase-config";
import { TEXT_MODELS, IMAGE_MODELS, VIDEO_MODELS, AIModel } from "@/lib/ai-models";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { generateText, generateImage, generateAudio, generateVideo, pollVideoOperation } from "@/lib/ai-service";
import { loadAllPostcards } from "@/lib/data-loader";

// ── Preset definitions ────────────────────────────────────────
type AssetType = "text" | "image" | "audio" | "video";

interface Preset {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: AssetType;
  badge: string;
  buildPrompt: (card: Postcard) => string;
}

const PRESETS: Preset[] = [
  {
    id: "historical_narrative",
    label: "Historical Narrative",
    icon: <BookOpen style={{ width: 18, height: 18 }} />,
    type: "text",
    badge: "Text",
    buildPrompt: (c) =>
      `You are a historical storyteller. Write a vivid, immersive 3–4 paragraph narrative about this postcard titled "${c.title}". Context: ${c.description}. Transport the reader to this specific time and place. Use sensory details, historical facts, and a warm, evocative tone.`,
  },
  {
    id: "architectural_render",
    label: "Architectural Render",
    icon: <ImageIcon style={{ width: 18, height: 18 }} />,
    type: "image",
    badge: "Image",
    buildPrompt: (c) =>
      `Isometric architectural technical illustration of the main building or landmark in "${c.title}". Style: precise CAD-style technical render, cream and warm beige stone, grey-slate roof, pure white background, 45-degree isometric perspective, clean ink line work with subtle flat shading, no people, no vegetation, professional architectural drawing, highly detailed facade and ornamental elements, similar to a BIM model render or historical architectural engraving.`,
  },
  {
    id: "audio_tour",
    label: "Audio Tour",
    icon: <Volume2 style={{ width: 18, height: 18 }} />,
    type: "audio",
    badge: "Audio",
    buildPrompt: (c) =>
      `Write a 2–3 paragraph audio tour narration for "${c.title}". ${c.description}. Write in second person, as if speaking directly to a visitor standing at this location. Be descriptive, historically informative, and engaging. Keep a measured, documentary pace suitable for text-to-speech.`,
  },
  {
    id: "time_capsule",
    label: "Time Capsule Letter",
    icon: <Mail style={{ width: 18, height: 18 }} />,
    type: "text",
    badge: "Text",
    buildPrompt: (c) =>
      `Write a fictional personal letter from someone living during the era of this postcard: "${c.title}". ${c.description}. Make the letter feel authentic to the period — include period-appropriate language, daily life observations, references to the location and its architecture, and a sense of the social and historical context of the time.`,
  },
  {
    id: "video_prompt",
    label: "Cinematic Video",
    icon: <Clapperboard style={{ width: 18, height: 18 }} />,
    type: "video",
    badge: "Video",
    buildPrompt: (c) =>
      `A cinematic, vintage-colored documentary video scene depicting "${c.title}". Context: ${c.description}. Smooth camera panning/zoom, warm historical atmosphere, highly detailed historical setting.`,
  },
  {
    id: "reimagining",
    label: "Historical Reimagining",
    icon: <Sparkles style={{ width: 18, height: 18 }} />,
    type: "image",
    badge: "Image",
    buildPrompt: (c) =>
      `Photorealistic colorized reconstruction of this vintage postcard: "${c.title}". ${c.description}. Style: historical color photography restoration, vibrant but natural and authentic period-accurate colors, sharp details, 8k resolution, cinematic lighting, grain-free. Recreate the scene as it would have looked to a photographer standing there at the time.`,
  },
  {
    id: "ocr_transcription",
    label: "OCR Transcription",
    icon: <ScanText style={{ width: 18, height: 18 }} />,
    type: "text",
    badge: "Text",
    buildPrompt: (c) =>
      `Act as an expert paleographer and archivist. Transcribe any visible handwritten text, cursive, or stamped marks on this postcard: "${c.title}". ${c.description}. Provide a faithful transcription, noting any illegible words with [illegible]. If applicable, translate the text into English and provide a brief analysis of the handwriting style and format.`,
  },
  {
    id: "sentiment_analysis",
    label: "Sentiment Analysis",
    icon: <HeartPulse style={{ width: 18, height: 18 }} />,
    type: "text",
    badge: "Text",
    buildPrompt: (c) =>
      `Perform a historical sentiment analysis on the correspondence or visual mood of this postcard: "${c.title}". ${c.description}. Identify the primary emotional tone (e.g., hope, anxiety, joy, longing). Discuss how the imagery and any implied message reflect the socio-cultural climate of the era, providing context for the emotions expressed.`,
  },
  {
    id: "museum_labels",
    label: "Museum Labels & Tags",
    icon: <Lightbulb style={{ width: 18, height: 18 }} />,
    type: "text",
    badge: "Text",
    buildPrompt: (c) =>
      `Act as a museum curator. For this historical artifact ("${c.title}") with context: "${c.description}", generate the following: 1) A concise, engaging 50-word exhibition label suitable for a physical display. 2) Three distinct lesson ideas or interactive prompts for a youth education workshop. 3) A comma-separated list of 10 searchable database tags (including architectural styles, eras, and thematic keywords).`,
  },
  {
    id: "custom",
    label: "Write your own…",
    icon: <Pencil style={{ width: 18, height: 18 }} />,
    type: "text",
    badge: "Custom",
    buildPrompt: () => "",
  },
];


// ── Asset key helpers ─────────────────────────────────────────
const assetKey = (cardId: string, presetId: string) => `eop-asset-${cardId}-${presetId}`;


// ── Component ─────────────────────────────────────────────────
const PostcardDetail = () => {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [postcard, setPostcard] = useState<Postcard | undefined>();
  const [selectedPreset, setSelectedPreset] = useState("historical_narrative");
  const [selectedModel, setSelectedModel] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customType, setCustomType] = useState<AssetType>("text");
  const [injectVision, setInjectVision] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageSource, setImageSource] = useState<"text" | "vision" | "actual">("text");

  // currentOutput: what was just generated (not yet saved)
  const [currentOutput, setCurrentOutput] = useState<{ type: AssetType; content: string; audioBlob?: Blob } | null>(null);
  // savedAssets: keyed by presetId, loaded from localStorage
  const [savedAssets, setSavedAssets] = useState<Record<string, { type: AssetType; content: string }>>({});
  const [collapsedAssets, setCollapsedAssets] = useState<Record<string, boolean>>({});
  const [justSaved, setJustSaved] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [generationStatus, setGenerationStatus] = useState("");

  // Stepped Wizard & Visual Features States
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedMedium, setSelectedMedium] = useState<AssetType | "custom">("text");
  const [isPolishing, setIsPolishing] = useState(false);
  const [loaderStep, setLoaderStep] = useState<number>(1);

  // Audio Custom Waveform Visualizer States
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);

  const activePreset = PRESETS.find(p => p.id === selectedPreset) || PRESETS[0];
  const activeType = activePreset.id === "custom" ? customType : activePreset.type;
  const { provider } = getAIConfig();

  const hasSaved = !!savedAssets[selectedPreset];

  const img = postcard?.imageUrl || postcard?.image_url || "";
  const images = [img, ...(postcard?.secondaryImages || [])].filter(Boolean) as string[];

  const handleDownload = (content: string, type: AssetType, blob?: Blob) => {
    if (type === "audio" && blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eop-audio-${id}.mp3`;
      a.click();
      return;
    }
    const ext = type === "image" ? "png" : type === "video" ? "mp4" : "txt";
    const a = document.createElement("a");
    a.href = content;
    a.download = `eop-${type}-${id}.${ext}`;
    a.click();
  };

  // Update text area when preset changes
  useEffect(() => {
    if (selectedPreset !== "custom" && postcard) {
      const preset = PRESETS.find((p) => p.id === selectedPreset);
      if (preset) setCustomPrompt(preset.buildPrompt(postcard));
    } else if (selectedPreset === "custom") {
      setCustomPrompt("");
    }
  }, [selectedPreset, postcard]);

  // Load postcard + saved assets
  useEffect(() => {
    const load = async () => {
      const allPostcards = await loadAllPostcards();
      const found = allPostcards.find((p) => String(p.id) === String(id));
      setPostcard(found);

      // Load saved assets
      const assets: Record<string, { type: AssetType; content: string }> = {};
      PRESETS.forEach((p) => {
        const raw = localStorage.getItem(assetKey(id!, p.id));
        if (raw) { try { assets[p.id] = JSON.parse(raw); } catch { /* skip */ } }
      });
      setSavedAssets(assets);
    };
    load();
  }, [id]);

  // checklist loader step progression
  useEffect(() => {
    let loaderInterval: any;
    if (isGenerating) {
      setLoaderStep(1);
      loaderInterval = setInterval(() => {
        setLoaderStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 3500);
    }
    return () => {
      if (loaderInterval) clearInterval(loaderInterval);
    };
  }, [isGenerating]);

  // Stop and clean up audio when preset or output changes
  useEffect(() => {
    if (audioInstance) {
      audioInstance.pause();
      setAudioInstance(null);
      setIsPlaying(false);
      setAudioCurrentTime(0);
      setAudioDuration(0);
    }
  }, [selectedPreset, currentOutput]);

  // Cleanup audio element on component unmount
  useEffect(() => {
    return () => {
      if (audioInstance) {
        audioInstance.pause();
      }
    };
  }, [audioInstance]);

  const togglePlayAudio = (contentUrl: string) => {
    if (audioInstance) {
      if (isPlaying) {
        audioInstance.pause();
        setIsPlaying(false);
      } else {
        audioInstance.play().catch((e) => console.error("Audio playback failed", e));
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(contentUrl);
      audio.addEventListener("loadedmetadata", () => {
        setAudioDuration(audio.duration);
      });
      audio.addEventListener("timeupdate", () => {
        setAudioCurrentTime(audio.currentTime);
      });
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setAudioCurrentTime(0);
      });
      audio.play().catch((e) => console.error("Audio playback failed", e));
      setAudioInstance(audio);
      setIsPlaying(true);
    }
  };

  const handlePolishPrompt = async () => {
    if (!customPrompt.trim()) return;
    setIsPolishing(true);
    try {
      const { provider } = getAIConfig();
      const textCompatible = TEXT_MODELS;
      const textModelId = textCompatible.find((m) => m.provider === provider)?.id || textCompatible[0].id;

      const polishPromptText = `You are an expert prompt engineer for generative AI. Enhance and expand the following draft prompt for maximum historical accuracy, vivid sensory detail, and aesthetic quality. Keep the output concise (under 80 words) and directly usable as a prompt. Do not write any introductory or concluding text, only return the polished prompt. Draft prompt: "${customPrompt}"`;

      const polished = await generateText(polishPromptText, textModelId);
      setCustomPrompt(polished.trim());
      toast({ title: "Prompt Polished! ✨", description: "Enriched your draft for better results." });
    } catch (err) {
      toast({
        title: "Failed to polish prompt",
        description: err instanceof Error ? err.message : "Error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsPolishing(false);
    }
  };

  const injectVariable = (varName: string) => {
    if (!postcard) return;
    let val = "";
    if (varName === "title") val = postcard.title;
    else if (varName === "description") val = postcard.description || "";
    else if (varName === "latitude") val = postcard.latitude.toFixed(4) + "°N";
    else if (varName === "longitude") val = postcard.longitude.toFixed(4) + "°E";

    setCustomPrompt((prev) => (prev ? `${prev} ${val}` : val));
    toast({ title: `Injected {${varName}}`, description: `Added "${val}" to your prompt.` });
  };

  const getLoadingSteps = (type: AssetType) => {
    switch (type) {
      case "text":
        return [
          "Reading postcard coordinates & historical details...",
          "Synthesizing regional architectural context...",
          "Composing immersive period-accurate narrative...",
        ];
      case "image":
        return [
          "Analyzing visual prompt metadata and style details...",
          "Constructing layout and architectural framework...",
          "Generating high-fidelity reimagined pixels...",
        ];
      case "audio":
        return [
          "Reading source narrative script...",
          "Generating natural text-to-speech voice synthesis...",
          "Mastering audio file track...",
        ];
      case "video":
        return [
          "Sending visual blueprint to rendering engine...",
          "Synthesizing cinematic motion path and panning...",
          "Compiling and rendering final video frames...",
        ];
      default:
        return [
          "Initializing creative AI studio models...",
          "Processing input sources and settings...",
          "Generating finished output asset...",
        ];
    }
  };

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, images.length]);

  const handleGenerate = async () => {
    if (!postcard) return;
    const preset = PRESETS.find((p) => p.id === selectedPreset)!;
    const { provider } = getAIConfig();
    
    // Auto-select first compatible model if none selected
    let modelId = selectedModel;
    if (!modelId) {
      const compatible = preset.type === "image" ? IMAGE_MODELS : (preset.type === "video" ? VIDEO_MODELS : TEXT_MODELS);
      modelId = compatible.find(m => m.provider === provider)?.id || compatible[0].id;
    }

    setIsGenerating(true);
    setGenerationStatus("");
    setCurrentOutput(null);

    try {
      let promptText = customPrompt.trim();
      const activeType = preset.id === "custom" ? customType : preset.type;

      if (injectVision && postcard.aiVisionResults && activeType !== "image") {
        promptText += `\n\n[CONTEXT FROM AI VISION ANALYSIS]: ${JSON.stringify(postcard.aiVisionResults)}`;
      }

      if (!promptText) throw new Error("Please write a prompt before generating.");

      // Fetch the image as base64 for multimodal text tasks OR if imageSource is "actual"
      let base64Image = undefined;
      let mimeType = "image/jpeg";
      const imgUrl = postcard.imageUrl || postcard.image_url;
      
      const needsImage = (imgUrl && activeType !== "image") || (imgUrl && activeType === "image" && imageSource === "actual");
      if (needsImage) {
        try {
          const imgRes = await fetch(imgUrl);
          if (imgRes.ok) {
            const imgBuffer = await imgRes.arrayBuffer();
            const bytes = new Uint8Array(imgBuffer);
            let binary = "";
            const chunkSize = 8192;
            for (let i = 0; i < bytes.byteLength; i += chunkSize) {
              binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
            }
            base64Image = btoa(binary);
            mimeType = imgRes.headers.get("content-type") || mimeType;
          }
        } catch (e) {
          console.error("Failed to fetch image for multimodal AI", e);
        }
      }

      if (activeType === "image") {
        let finalImagePrompt = promptText;

        if (imageSource === "vision" && postcard.aiVisionResults) {
          const visionDesc = postcard.aiVisionResults.visual_description || "";
          if (selectedPreset === "reimagining") {
            finalImagePrompt = `Photorealistic colorized reconstruction of this scene: "${visionDesc}". Style: historical color photography restoration, vibrant but natural and authentic period-accurate colors, sharp details, 8k resolution, cinematic lighting, grain-free. Recreate the scene as it would have looked to a photographer standing there at the time.`;
          } else if (selectedPreset === "architectural_render") {
            finalImagePrompt = `Isometric architectural technical illustration of this building/landmark: "${visionDesc}". Style: precise CAD-style technical render, cream and warm beige stone, grey-slate roof, pure white background, 45-degree isometric perspective, clean ink line work with subtle flat shading, no people, no vegetation, professional architectural drawing.`;
          } else {
            finalImagePrompt = `${promptText}\n\nBased on description: ${visionDesc}`;
          }
        } else if (imageSource === "actual" && base64Image) {
          toast({ 
            title: "Analyzing Image...", 
            description: "Generating highly detailed prompt from the original postcard image." 
          });

          // Use the best text model of the current provider for vision analysis
          const textCompatible = TEXT_MODELS;
          const textModelId = textCompatible.find(m => m.provider === provider)?.id || textCompatible[0].id;
          
          const visionDescribePrompt = `Analyze this vintage postcard image in detail. Generate a highly descriptive prompt for an image generator (like DALL-E 3 or Google Imagen) to recreate this exact scene. Describe the main subject, architecture, perspective, color elements, composition, and objects. Do not write introductory text, output only the descriptive prompt.`;
          
          const detailedDescription = await generateText(visionDescribePrompt, textModelId, base64Image, mimeType);
          
          if (selectedPreset === "reimagining") {
            finalImagePrompt = `Photorealistic colorized reconstruction of this scene: "${detailedDescription}". Style: historical color photography restoration, vibrant but natural and authentic period-accurate colors, sharp details, 8k resolution, cinematic lighting, grain-free. Recreate the scene as it would have looked to a photographer standing there at the time.`;
          } else if (selectedPreset === "architectural_render") {
            finalImagePrompt = `Isometric architectural technical illustration of this building/landmark: "${detailedDescription}". Style: precise CAD-style technical render, cream and warm beige stone, grey-slate roof, pure white background, 45-degree isometric perspective, clean ink line work with subtle flat shading, no people, no vegetation, professional architectural drawing.`;
          } else {
            finalImagePrompt = `${promptText}\n\nBased on original image description: ${detailedDescription}`;
          }
        }

        toast({ title: "Generating Image...", description: `Using ${modelId}. This may take a moment.` });
        const url = await generateImage(finalImagePrompt, modelId);
        setCurrentOutput({ type: "image", content: url });

      } else if (activeType === "audio") {
        // First generate the script as text, then convert to audio
        const script = await generateText(promptText, modelId, base64Image, mimeType);
        const blob = await generateAudio(script);
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          setCurrentOutput({ type: "audio", content: base64data as string, audioBlob: blob });
        };
      } else if (activeType === "video") {
        const geminiKey = localStorage.getItem("gemini_api_key");
        if (!geminiKey) throw new Error("Video generation requires a Gemini API key. Add it in Settings under AI Provider.");

        toast({ title: "Initiating Video...", description: `Using ${modelId}. Starting generation.` });
        const opName = await generateVideo(promptText, modelId, base64Image, mimeType);

        setGenerationStatus("Video generating... (poll #1)");
        const videoUrl = await pollVideoOperation(opName, (status) => {
          setGenerationStatus(status);
        });
        setCurrentOutput({ type: "video", content: videoUrl });

      } else {
        // text
        const text = await generateText(promptText, modelId, base64Image, mimeType);
        setCurrentOutput({ type: activeType, content: text });
      }

      toast({ title: "Generated ✓", description: `Using ${modelId}. Hit Save to keep it.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed.";
      toast({
        title: "Generation failed",
        description: msg,
        variant: "destructive",
        action: <ToastAction altText="Copy" onClick={() => navigator.clipboard.writeText(msg)}>Copy Error</ToastAction>,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!currentOutput || !id) return;
    const data = { type: currentOutput.type, content: currentOutput.content };
    localStorage.setItem(assetKey(id, selectedPreset), JSON.stringify(data));
    setSavedAssets((prev) => ({ ...prev, [selectedPreset]: data }));
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleExport = () => {
    if (!postcard) return;
    const exportData = {
      ...postcard,
      assets: savedAssets,
      exportedAt: new Date().toISOString(),
      license: "CC BY-NC 4.0 (Open Educational Resource)"
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eop-${postcard.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    toast({ title: "Exported ✓", description: "All assets and metadata bundled into JSON." });
  };

  if (!postcard) {
    return (
      <div className="eop-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p className="eop-label">404</p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 400, marginBottom: 16 }}>Story Not Found</h1>
          <button onClick={() => navigate("/")} className="eop-btn-primary">Return to Archive</button>
        </div>
      </div>
    );
  }

  return (
    <div className="eop-root">
      {/* NAV */}
      <header className="eop-nav">
        <button onClick={() => navigate("/")} className="eop-logo" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <span className="eop-logo-dot" />
          <span>Echoes of the Past</span>
        </button>
        <nav className="eop-nav-links">
          <LanguageSwitcher />
          <Link to="/learn" className="eop-nav-link">{t("nav_learn")}</Link>
          <button onClick={() => navigate("/")} className="eop-nav-link" style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> {t("nav_archive")}
          </button>
        </nav>
      </header>

      <div className="pd-layout">
        {/* ── LEFT: Postcard ── */}
        <div className="pd-left">
          {img && (
            <img 
              src={img} 
              alt={postcard.title} 
              className="pd-hero-img" 
              style={{ cursor: "pointer" }}
              onClick={() => setLightboxIndex(0)} 
            />
          )}
          
          {postcard.secondaryImages && postcard.secondaryImages.length > 0 && (
            <div className="pd-secondary-gallery" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 12, marginBottom: 32 }}>
              {postcard.secondaryImages.map((url, idx) => (
                <img 
                  key={idx} 
                  src={url} 
                  alt={`${postcard.title} view ${idx + 2}`} 
                  style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--grey-5)", cursor: "pointer" }}
                  onClick={() => setLightboxIndex(idx + 1)}
                />
              ))}
            </div>
          )}

          <div className="pd-info">
            <p className="eop-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin style={{ width: 11, height: 11 }} />
              {postcard.latitude.toFixed(4)}°N, {postcard.longitude.toFixed(4)}°E
            </p>
            <h1 className="pd-title">{postcard.title}</h1>
            {postcard.description && (
              <p className="pd-description">{postcard.description}</p>
            )}
            <button 
              onClick={handleExport}
              className="pd-action-btn" 
              style={{ marginTop: 20, width: "100%", justifyContent: "center", padding: 12 }}
            >
              <Download style={{ width: 14, height: 14 }} /> Export This Story (JSON Bundle)
            </button>

            {postcard.aiVisionResults && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(postcard.aiVisionResults?.transcribed_text || "No text found.");
                    toast({ title: "Copied OCR!", description: "Original text from the postcard copied." });
                  }}
                  className="pd-action-btn" 
                  style={{ flex: 1, justifyContent: "center", padding: 12, background: "white" }}
                  title="Copy Original Text"
                >
                  <FileText style={{ width: 14, height: 14 }} /> OCR
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(postcard.aiVisionResults?.visual_description || "No description found.");
                    toast({ title: "Copied Description!", description: "AI visual analysis copied." });
                  }}
                  className="pd-action-btn" 
                  style={{ flex: 1, justifyContent: "center", padding: 12, background: "white" }}
                  title="Copy Image Description"
                >
                  <ImageIcon style={{ width: 14, height: 14 }} /> Desc
                </button>
              </div>
            )}
          </div>

          {/* ── Creative Space ── */}
          {Object.keys(savedAssets).length > 0 && (
            <div className="pd-creative-space" style={{ marginTop: 40 }}>
              <h2 className="pd-studio-title" style={{ borderBottom: "1px solid var(--grey-5)", paddingBottom: 12, marginBottom: 20 }}>Creative Space</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {Object.entries(savedAssets).map(([presetId, asset]) => {
                  const preset = PRESETS.find(p => p.id === presetId) || PRESETS.find(p => p.id === "custom");
                  const isCollapsed = collapsedAssets[presetId];

                  return (
                    <div key={presetId} className="pd-saved-asset" style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid var(--grey-5)" }}>
                      <div 
                        className="pd-output-header" 
                        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCollapsed ? 0 : 12 }}
                        onClick={() => setCollapsedAssets(prev => ({ ...prev, [presetId]: !prev[presetId] }))}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {isCollapsed ? <ChevronDown style={{ width: 16, height: 16, color: "var(--grey-3)" }} /> : <ChevronUp style={{ width: 16, height: 16, color: "var(--grey-3)" }} />}
                          <span className="pd-output-label" style={{ fontWeight: 600, color: "var(--grey-1)" }}>{preset?.label || "Custom Generation"}</span>
                        </div>
                        <button
                          className="pd-action-btn"
                          onClick={(e) => { e.stopPropagation(); handleDownload(asset.content, asset.type); }}
                        >
                          <Download style={{ width: 12, height: 12 }} /> Download
                        </button>
                      </div>
                      
                      {!isCollapsed && (
                        <div className="pd-output-content" style={{ marginTop: 12 }}>
                          {asset.type === "image" ? (
                            <div className="pd-output-image">
                              <img src={asset.content} alt="Saved render" style={{ width: "100%", borderRadius: 8 }} />
                            </div>
                          ) : asset.type === "audio" ? (
                            <div className="pd-output-audio">
                              <audio controls src={asset.content} style={{ width: "100%" }} />
                            </div>
                          ) : asset.type === "video" ? (
                            <div className="pd-output-video">
                              <video controls loop src={asset.content} style={{ width: "100%", borderRadius: 8 }} />
                            </div>
                          ) : (
                            <div className="pd-output-text">
                              <p style={{ whiteSpace: "pre-wrap", fontSize: "0.95rem", lineHeight: 1.6, color: "var(--grey-2)" }}>{asset.content}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: AI Studio ── */}
        <div className="pd-right">
          <div className="pd-studio">
            <p className="eop-label">AI Studio</p>
            <h2 className="pd-studio-title">Generate Content</h2>

            {/* Stepped Wizard Navigation */}
            <div className="pd-wizard-nav">
              <button 
                className={`pd-wizard-step-btn ${currentStep === 1 ? "active" : ""} ${currentStep > 1 ? "completed" : ""}`}
                onClick={() => setCurrentStep(1)}
              >
                <div className="pd-wizard-number">{currentStep > 1 ? <Check style={{ width: 10, height: 10 }} /> : "1"}</div>
                <span>1. Medium</span>
              </button>
              <button 
                className={`pd-wizard-step-btn ${currentStep === 2 ? "active" : ""} ${currentStep > 2 ? "completed" : ""}`}
                onClick={() => setCurrentStep(2)}
                disabled={!selectedMedium}
              >
                <div className="pd-wizard-number">{currentStep > 2 ? <Check style={{ width: 10, height: 10 }} /> : "2"}</div>
                <span>2. Template</span>
              </button>
              <button 
                className={`pd-wizard-step-btn ${currentStep === 3 ? "active" : ""}`}
                onClick={() => setCurrentStep(3)}
                disabled={!selectedPreset}
              >
                <div className="pd-wizard-number">3</div>
                <span>3. Refine</span>
              </button>
            </div>

            {/* Step Content Switcher */}
            <div className="pd-wizard-content">
              {/* STEP 1: CHOOSE MEDIUM */}
              {currentStep === 1 && (
                <div>
                  <p className="eop-label" style={{ marginBottom: 12 }}>Step 1: Select Output Medium</p>
                  <div className="pd-medium-tabs">
                    {[
                      { id: "text", label: "Text", icon: <FileText className="pd-medium-tab-icon" /> },
                      { id: "image", label: "Image", icon: <ImageIcon className="pd-medium-tab-icon" /> },
                      { id: "audio", label: "Audio", icon: <Volume2 className="pd-medium-tab-icon" /> },
                      { id: "video", label: "Video", icon: <Clapperboard className="pd-medium-tab-icon" /> },
                      { id: "custom", label: "Custom", icon: <Layers className="pd-medium-tab-icon" /> }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setSelectedMedium(tab.id as any);
                          // Auto select the first preset of this medium
                          const firstPreset = PRESETS.find(p => p.type === tab.id || (tab.id === "custom" && p.id === "custom"));
                          if (firstPreset) {
                            setSelectedPreset(firstPreset.id);
                            setSelectedModel("");
                            setCurrentOutput(null);
                          }
                          setCurrentStep(2);
                        }}
                        className={`pd-medium-tab ${selectedMedium === tab.id ? `active-${tab.id}` : ""}`}
                      >
                        {tab.icon}
                        <span className="pd-medium-tab-label">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT TEMPLATE */}
              {currentStep === 2 && (
                <div>
                  <div style={{ display: "flex", justifyContext: "space-between", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <p className="eop-label">Step 2: Choose Creative Template</p>
                    <button 
                      onClick={() => setCurrentStep(1)} 
                      style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4, color: "var(--grey-3)", background: "none", border: "none" }}
                    >
                      <ArrowLeft style={{ width: 12, height: 12 }} /> Back to Medium
                    </button>
                  </div>
                  <div className="pd-preset-grid">
                    {PRESETS.filter(p => {
                      if (selectedMedium === "custom") return p.id === "custom";
                      return p.type === selectedMedium && p.id !== "custom";
                    }).map((p) => (
                      <button
                        key={p.id}
                        className={`pd-preset-card ${selectedPreset === p.id ? "active" : ""}`}
                        style={{
                          borderColor: selectedPreset === p.id ? `var(--${selectedMedium === 'custom' ? 'black' : selectedMedium === 'text' ? 'primary' : selectedMedium})` : undefined
                        }}
                        onClick={() => {
                          setSelectedPreset(p.id);
                          setSelectedModel(""); 
                          setCurrentOutput(null);
                          setCurrentStep(3);
                        }}
                      >
                        {savedAssets[p.id] && <div className="pd-preset-saved-dot" />}
                        <span className={`pd-preset-badge pd-badge-${p.type}`}>{p.badge}</span>
                        <div className="pd-preset-icon">{p.icon}</div>
                        <span className="pd-preset-label">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: REFINE & GENERATE */}
              {currentStep === 3 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <p className="eop-label">Step 3: Refine & Run Creative AI</p>
                    <button 
                      onClick={() => setCurrentStep(2)} 
                      style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4, color: "var(--grey-3)", background: "none", border: "none" }}
                    >
                      <ArrowLeft style={{ width: 12, height: 12 }} /> Back to Templates
                    </button>
                  </div>

                  {/* Split Workspace Layout for direct feedback */}
                  <div className={`pd-split-workspace ${savedAssets[selectedPreset] ? "has-saved" : ""}`}>
                    
                    {/* Saved Asset Panel (Direct comparison) */}
                    {savedAssets[selectedPreset] && (
                      <div className="pd-saved-preview-column">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="pd-saved-preview-badge">Creations Vault (Saved)</span>
                          <button
                            className="pd-action-btn"
                            style={{ padding: "4px 8px" }}
                            onClick={() => handleDownload(savedAssets[selectedPreset].content, savedAssets[selectedPreset].type)}
                          >
                            <Download style={{ width: 10, height: 10 }} />
                          </button>
                        </div>
                        
                        <div className="pd-saved-preview-content">
                          {savedAssets[selectedPreset].type === "image" ? (
                            <img src={savedAssets[selectedPreset].content} alt="Previously generated" style={{ width: "100%", display: "block" }} />
                          ) : savedAssets[selectedPreset].type === "audio" ? (
                            <div style={{ padding: 12 }}>
                              <p style={{ fontSize: "0.72rem", color: "var(--grey-3)", marginBottom: 8 }}>Saved audio narration</p>
                              {/* Custom Waveform Player for Saved Audio */}
                              <div className={`pd-waveform-player ${isPlaying ? 'playing' : ''}`} style={{ marginTop: 0, padding: 12 }}>
                                <div className="pd-waveform-container" style={{ height: 32 }}>
                                  {Array.from({ length: 35 }).map((_, idx) => {
                                    const h = [20,30,45,60,80,70,50,40,65,85,95,75,55,60,80,90,70,50,65,85,75,55,45,30,20,40,60,75,90,80,60,45,30,20,10][idx];
                                    const progressPercent = audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0;
                                    const isBarActive = (idx / 35) * 100 <= progressPercent;
                                    return (
                                      <div 
                                        key={idx}
                                        className={`pd-wave-bar ${isBarActive ? 'active' : ''}`}
                                        style={{ height: `${h}%` }}
                                      />
                                    );
                                  })}
                                </div>
                                <div className="pd-waveform-controls">
                                  <button 
                                    className="pd-audio-play-btn" 
                                    style={{ width: 28, height: 28 }}
                                    onClick={() => togglePlayAudio(savedAssets[selectedPreset].content)}
                                  >
                                    {isPlaying ? <Pause style={{ width: 12, height: 12 }} /> : <Play style={{ width: 12, height: 12 }} />}
                                  </button>
                                  <span className="pd-audio-time-label" style={{ fontSize: "0.65rem" }}>
                                    {audioDuration > 0 ? `${Math.floor(audioCurrentTime)}s / ${Math.floor(audioDuration)}s` : "0:00"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : savedAssets[selectedPreset].type === "video" ? (
                            <video controls loop src={savedAssets[selectedPreset].content} style={{ width: "100%", display: "block" }} />
                          ) : (
                            <div style={{ padding: 16, maxHeight: 180, overflowY: "auto", fontSize: "0.82rem", color: "var(--grey-2)", whiteSpace: "pre-wrap", background: "white" }}>
                              {savedAssets[selectedPreset].content}
                            </div>
                          )}
                        </div>
                        <p style={{ fontSize: "0.68rem", color: "var(--grey-3)", fontStyle: "italic", textAlign: "center" }}>
                          Showing your previously saved output for this template.
                        </p>
                      </div>
                    )}

                    {/* Configuration & Input Column */}
                    <div>
                      {/* Model Selector */}
                      <div className="pd-model-selector" style={{ padding: 16, background: "var(--grey-6)", borderRadius: 12, border: "1px solid var(--grey-5)", marginBottom: 16 }}>
                        <div style={{ marginBottom: 12 }}>
                          <label className="eop-field-label" style={{ marginBottom: 6, display: "block", fontSize: "0.7rem" }}>AI Model</label>
                          <select 
                            className="eop-input" 
                            value={selectedModel} 
                            onChange={(e) => setSelectedModel(e.target.value)}
                            style={{ background: "white", width: "100%", marginBottom: 4 }}
                          >
                            <option value="">Recommended for {activePreset.badge}</option>
                            {(activePreset.id === "custom" ? [...TEXT_MODELS, ...IMAGE_MODELS, ...VIDEO_MODELS] : (activePreset.type === "image" ? IMAGE_MODELS : (activePreset.type === "video" ? VIDEO_MODELS : TEXT_MODELS))).map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                          <p style={{ fontSize: "0.68rem", color: "var(--grey-3)", lineHeight: 1.3 }}>
                            {selectedModel 
                              ? [...TEXT_MODELS, ...IMAGE_MODELS, ...VIDEO_MODELS].find(m => m.id === selectedModel)?.description
                              : `We'll pick the best ${activePreset.type === "image" ? "image" : (activePreset.type === "video" ? "video" : "text")} model for your selected provider.`}
                          </p>
                        </div>

                        {selectedPreset === "custom" && (
                          <div style={{ marginBottom: 12 }}>
                            <label className="eop-field-label" style={{ marginBottom: 6, display: "block", fontSize: "0.7rem" }}>Output Format</label>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {(["text", "image", "audio", "video"] as AssetType[]).map(t => (
                                <button 
                                  key={t}
                                  onClick={() => setCustomType(t)}
                                  className="pd-action-btn"
                                  style={{ flex: "1 1 calc(50% - 6px)", justifyContent: "center", background: customType === t ? "var(--grey-5)" : "white", padding: "4px 8px", fontSize: "0.7rem" }}
                                >
                                  {t === "video" ? "Video" : t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeType === "image" && (
                          <div style={{ marginBottom: 12 }}>
                            <label className="eop-field-label" style={{ marginBottom: 6, display: "block", fontSize: "0.7rem" }}>
                              Image Input Source
                            </label>
                            <div style={{ display: "flex", gap: 6, flexDirection: "column" }}>
                              <button 
                                onClick={() => setImageSource("text")}
                                className="pd-action-btn"
                                style={{ 
                                  justifyContent: "flex-start", 
                                  padding: "8px 10px", 
                                  background: imageSource === "text" ? "var(--grey-5)" : "white",
                                  border: "1px solid var(--grey-4)",
                                  fontSize: "0.75rem",
                                  width: "100%"
                                }}
                              >
                                <FileText style={{ width: 12, height: 12, marginRight: 6 }} />
                                <span>Use Text Description</span>
                              </button>
                              {postcard.aiVisionResults && (
                                <button 
                                  onClick={() => setImageSource("vision")}
                                  className="pd-action-btn"
                                  style={{ 
                                    justifyContent: "flex-start", 
                                    padding: "8px 10px", 
                                    background: imageSource === "vision" ? "var(--grey-5)" : "white",
                                    border: "1px solid var(--grey-4)",
                                    fontSize: "0.75rem",
                                    width: "100%"
                                  }}
                                >
                                  <ScanText style={{ width: 12, height: 12, marginRight: 6 }} />
                                  <span>Use AI Vision Results</span>
                                </button>
                              )}
                              <button 
                                onClick={() => setImageSource("actual")}
                                className="pd-action-btn"
                                style={{ 
                                  justifyContent: "flex-start", 
                                  padding: "8px 10px", 
                                  background: imageSource === "actual" ? "var(--grey-5)" : "white",
                                  border: "1px solid var(--grey-4)",
                                  fontSize: "0.75rem",
                                  width: "100%"
                                }}
                              >
                                <ImageIcon style={{ width: 12, height: 12, marginRight: 6 }} />
                                <span>Use Actual Image</span>
                              </button>
                            </div>

                            {/* Scanner animation feedback when active */}
                            {imageSource === "actual" && img && (
                              <div className="pd-scanner-container">
                                <div className="pd-scanner-line" />
                                <div className="pd-scanner-overlay">
                                  <span className="pd-scanner-dot" />
                                  <span>Multimodal Scanner Active</span>
                                </div>
                                <img src={img} alt="Postcard to analyze" />
                              </div>
                            )}

                            <p style={{ fontSize: "0.68rem", color: "var(--grey-3)", marginTop: 6, lineHeight: 1.3 }}>
                              {imageSource === "text" && "Generates purely from metadata strings."}
                              {imageSource === "vision" && "Generates from stored visual analysis description."}
                              {imageSource === "actual" && "Feeds the original image to a Vision model to write an enriched prompt before rendering."}
                            </p>
                          </div>
                        )}

                        {activeType !== "image" && postcard.aiVisionResults && (
                          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                            <input 
                              type="checkbox" 
                              id="inject-vision" 
                              checked={injectVision} 
                              onChange={(e) => setInjectVision(e.target.checked)}
                              style={{ width: 14, height: 14 }}
                            />
                            <label htmlFor="inject-vision" style={{ fontSize: "0.75rem", color: "var(--grey-2)", cursor: "pointer" }}>
                              Inject AI Vision metadata for accuracy
                            </label>
                          </div>
                        )}

                        {/* Variables Injector List */}
                        <div style={{ marginTop: 12 }}>
                          <p className="pd-variables-title">Variables Helper</p>
                          <div className="pd-variables-list">
                            <button className="pd-var-chip" onClick={() => injectVariable("title")}>&#123;title&#125;</button>
                            {postcard.description && <button className="pd-var-chip" onClick={() => injectVariable("description")}>&#123;desc&#125;</button>}
                            <button className="pd-var-chip" onClick={() => injectVariable("latitude")}>&#123;lat&#125;</button>
                            <button className="pd-var-chip" onClick={() => injectVariable("longitude")}>&#123;lng&#125;</button>
                          </div>
                        </div>

                        {/* Prompt Area */}
                        <div style={{ marginBottom: 12, marginTop: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <label className="eop-field-label" style={{ fontSize: "0.7rem", margin: 0 }}>Prompt Blueprint</label>
                            <button 
                              className="pd-polish-btn" 
                              disabled={isPolishing || !customPrompt.trim()}
                              onClick={handlePolishPrompt}
                              title="Rewrite draft prompt using AI for premium results"
                            >
                              {isPolishing ? (
                                <><Loader2 style={{ width: 10, height: 10 }} className="animate-spin" /> Polishing...</>
                              ) : (
                                <><Wand2 style={{ width: 10, height: 10 }} /> Polish Prompt</>
                              )}
                            </button>
                          </div>
                          <textarea
                            className="eop-input"
                            placeholder="Draft your design directives or description here..."
                            style={{ minHeight: 100, width: "100%", background: "white", resize: "vertical" }}
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                          />
                        </div>

                        <button
                          className="eop-btn-primary pd-generate-btn"
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          style={{ width: "100%" }}
                        >
                          {isGenerating ? (
                            <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Processing...</>
                          ) : (
                            <><Sparkles style={{ width: 16, height: 16 }} /> Generate {selectedPreset === "custom" ? (customType === "video" ? "Video" : customType) : activePreset.label}</>
                          )}
                        </button>
                      </div>

                      {/* Step-by-Step Loader Checklist */}
                      {isGenerating && (
                        <div className="pd-loading-checklist">
                          {getLoadingSteps(activeType).map((textStep, index) => {
                            const stepNumber = index + 1;
                            const isActive = loaderStep === stepNumber;
                            const isCompleted = loaderStep > stepNumber;
                            return (
                              <div 
                                key={index} 
                                className={`pd-loading-checklist-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                              >
                                <div className="pd-loading-icon-wrap">
                                  {isCompleted ? (
                                    <Check style={{ width: 14, height: 14, color: "#2E7D32" }} />
                                  ) : isActive ? (
                                    <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                                  ) : (
                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--grey-4)" }} />
                                  )}
                                </div>
                                <span>{textStep}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* ── Output area ── */}
            {currentOutput && (
              <div className="pd-output">
                <div className="pd-output-header">
                  <span className="pd-output-label">Live Output Workspace</span>
                  <div className="pd-output-actions">
                    <button className="pd-action-btn" onClick={handleSave}>
                      {justSaved ? <><Check style={{ width: 12, height: 12 }} /> Saved to Creations</> : <><Save style={{ width: 12, height: 12 }} /> Save to Creations</>}
                    </button>
                    <button className="pd-action-btn" onClick={() => handleDownload(currentOutput.content, currentOutput.type, currentOutput.audioBlob)}>
                      <Download style={{ width: 12, height: 12 }} /> Download File
                    </button>
                  </div>
                </div>

                {currentOutput.type === "text" ? (
                  <div className="pd-output-text">
                    <p>{currentOutput.content}</p>
                    <button
                      className="pd-copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(currentOutput.content);
                        toast({ title: "Copied to clipboard!", description: "Narrative text ready to paste." });
                      }}
                    >
                      Copy text
                    </button>
                  </div>
                ) : currentOutput.type === "image" ? (
                  <div className="pd-output-image">
                    <img src={currentOutput.content} alt="AI generated render" />
                    <p className="pd-output-note">⚠ Temporary URL. Click 'Save' or download to preserve this render.</p>
                  </div>
                ) : currentOutput.type === "audio" ? (
                  <div className="pd-waveform-player playing">
                    <div className="pd-waveform-container">
                      {Array.from({ length: 35 }).map((_, idx) => {
                        const h = [20,30,45,60,80,70,50,40,65,85,95,75,55,60,80,90,70,50,65,85,75,55,45,30,20,40,60,75,90,80,60,45,30,20,10][idx];
                        const progressPercent = audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0;
                        const isBarActive = (idx / 35) * 100 <= progressPercent;
                        return (
                          <div 
                            key={idx}
                            className={`pd-wave-bar ${isBarActive ? 'active' : ''}`}
                            style={{ height: `${h}%` }}
                          />
                        );
                      })}
                    </div>
                    <div className="pd-waveform-controls">
                      <button 
                        className="pd-audio-play-btn" 
                        onClick={() => togglePlayAudio(currentOutput.content)}
                      >
                        {isPlaying ? <Pause style={{ width: 16, height: 16 }} /> : <Play style={{ width: 16, height: 16 }} />}
                      </button>
                      <span className="pd-audio-time-label">
                        {audioDuration > 0 ? `${Math.floor(audioCurrentTime)}s / ${Math.floor(audioDuration)}s` : "0:00"}
                      </span>
                    </div>
                  </div>
                ) : currentOutput.type === "video" ? (
                  <div className="pd-output-video">
                    <video controls autoPlay loop src={currentOutput.content} style={{ width: "100%", borderRadius: 12 }} />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox Overlay ── */}
      {lightboxIndex !== null && (
        <div className="eop-lightbox-overlay" onClick={() => setLightboxIndex(null)}>
          <button 
            className="lightbox-close-btn" 
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
          >
            <X style={{ width: 24, height: 24 }} />
          </button>

          {images.length > 1 && (
            <button 
              className="lightbox-nav-btn prev" 
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
              }}
            >
              <ChevronLeft style={{ width: 32, height: 32 }} />
            </button>
          )}

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={images[lightboxIndex]} alt={postcard.title} className="lightbox-image" />
            <div className="lightbox-caption">
              {postcard.title} {images.length > 1 && `(${lightboxIndex + 1}/${images.length})`}
            </div>
          </div>

          {images.length > 1 && (
            <button 
              className="lightbox-nav-btn next" 
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
              }}
            >
              <ChevronRight style={{ width: 32, height: 32 }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};


export default PostcardDetail;
