import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Copy, Check, Download, GraduationCap, ChevronDown, ChevronUp, Eye, EyeOff, Trash2, Upload, AlertTriangle } from "lucide-react";
import { DEFAULT_SMART_TUTOR_CONTEXT } from "../data/learning-content";
import { useLanguage } from "../lib/i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

const SETUP_GUIDE = `
You are a setup assistant for Echoes of the Past. Your goal is to help me configure the platform based on these latest (2026) standards.

IMPORTANT INSTRUCTION: DO NOT give me all the steps at once. That is too overwhelming. Instead, guide me interactively, step-by-step. Give me one instruction, wait for me to say "done", and then give me the next instruction.

Here are the configuration requirements:
1. Zero-Docker AI: This works directly in the browser via API keys.
2. AI Models: Gemini 2.0 Flash / 1.5 Pro / Imagen 4, or OpenAI GPT-4o / DALL·E 3.
3. Supabase: Requires Project URL and Anon key, and specifically a bucket named "postcards".
4. Google Maps: Requires a Maps JavaScript API key restricted to localhost:8080.

Start by asking me which of these 4 things I need help setting up right now, and then guide me step-by-step through that specific process.
`.trim();


const STORAGE_SETUP_GUIDE = `
You are a setup assistant helping me configure Supabase Storage for postcard uploads.

IMPORTANT INSTRUCTION: DO NOT dump all these instructions at once. Guide me interactively, step-by-step. Give me ONE step to do, wait for me to confirm I have done it, and only then provide the next step.

Here is what needs to be done:
Step 1: Create a bucket named exactly "postcards".
Step 2: Toggle ON "Public bucket".
Step 3: Go to Storage -> Policies and create an INSERT policy for the postcards bucket allowing public/anon uploads with formula 'true'.
Step 4: Create a SELECT policy for the postcards bucket allowing public/anon reads with formula 'true'.

Please begin by giving me just Step 1.
`.trim();

const DEPLOYMENT_GUIDE = `
You are a deployment assistant for the Echoes of the Past platform (a Vite + React application). Your goal is to help me run the platform locally or deploy it to the web.

IMPORTANT INSTRUCTION: DO NOT dump all these instructions at once. That is overwhelming. Ask me first if I want to "Run Locally" or "Deploy to Vercel". Then, guide me interactively, step-by-step through that specific process. Give me ONE step to do, wait for me to confirm I have done it, and only then provide the next step.

Process A: Run Locally
Step 1: Make sure Node.js is installed.
Step 2: Open terminal in the project folder and run 'npm install'.
Step 3: Run 'npm run dev'.
Step 4: Open the provided localhost URL in the browser.

Process B: Deploy to Vercel via GitHub
Step 1: Push the project code to a new public or private GitHub repository.
Step 2: Create a free account at Vercel.com and connect it to GitHub.
Step 3: Click "Add New Project" and import the repository.
Step 4: Vercel will automatically detect Vite. Click "Deploy".
Step 5: Wait for the build to finish and visit the live URL.

Please begin by asking me which process I want to follow.
`.trim();

const extractGeminiKeyFromCurl = (curlText: string): string | null => {
  if (!curlText) return null;
  // 1. Search for X-goog-api-key header:
  const headerRegex = /x-goog-api-key\s*:\s*['"]?([A-Za-z0-9_-]+)['"]?/i;
  const matchHeader = curlText.match(headerRegex);
  if (matchHeader && matchHeader[1]) {
    return matchHeader[1];
  }
  // 2. Search for query parameter key:
  const queryRegex = /[?&]key\s*=\s*['"]?([A-Za-z0-9_-]+)['"]?/i;
  const matchQuery = curlText.match(queryRegex);
  if (matchQuery && matchQuery[1]) {
    return matchQuery[1];
  }
  return null;
};

const extractOpenAIKeyFromCurl = (curlText: string): string | null => {
  if (!curlText) return null;
  const authRegex = /authorization\s*:\s*['"]?Bearer\s+([A-Za-z0-9_-]+)['"]?/i;
  const match = curlText.match(authRegex);
  if (match && match[1]) {
    return match[1];
  }
  return null;
};

const Settings = () => {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"api" | "deployment">("api");
  const [mapsKey, setMapsKey] = useState(
    localStorage.getItem("google_maps_api_key") || ""
  );
  const [openaiKey, setOpenaiKey] = useState(
    localStorage.getItem("openai_api_key") || ""
  );
  
  // Differentiate defaults: load purely from localStorage initially
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem("supabase_url") || ""
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem("supabase_anon_key") || ""
  );
  const [geminiKey, setGeminiKey] = useState(
    localStorage.getItem("gemini_api_key") || ""
  );
  const [aiProvider, setAiProvider] = useState<"openai" | "gemini">(
    (localStorage.getItem("ai_provider") as "openai" | "gemini") || "openai"
  );
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedStorage, setCopiedStorage] = useState(false);
  const [copiedDeploy, setCopiedDeploy] = useState(false);
  const [tutorContext, setTutorContext] = useState(
    localStorage.getItem("eop-smart-tutor-context") || DEFAULT_SMART_TUTOR_CONTEXT
  );
  const [geminiCurlError, setGeminiCurlError] = useState("");
  const [openaiCurlError, setOpenaiCurlError] = useState("");
  const [geminiExtracted, setGeminiExtracted] = useState(false);
  const [openaiExtracted, setOpenaiExtracted] = useState(false);

  // New Visibility Toggles
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  // New Connection Tester states
  const [supabaseTesting, setSupabaseTesting] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [openaiTesting, setOpenaiTesting] = useState(false);
  const [openaiTestResult, setOpenaiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // New Reset Database State
  const [resetDbState, setResetDbState] = useState<"idle" | "confirm" | "critical">("idle");

  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    supabase: true,
    googleMaps: false,
    aiProvider: false,
    dataManagement: false,
    smartTutor: false
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Status computations taking system defaults into consideration
  const isSupabaseCustomized = supabaseUrl.trim() !== "" || supabaseKey.trim() !== "";
  const hasSupabaseUrl = supabaseUrl.trim() !== "" || !!import.meta.env.VITE_SUPABASE_URL;
  const hasSupabaseKey = supabaseKey.trim() !== "" || !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const isSupabaseConfigured = hasSupabaseUrl && hasSupabaseKey;

  const isMapsConfigured = mapsKey.trim() !== "";
  
  // AI Configured computation:
  const isAiConfigured = aiProvider === "openai" ? openaiKey.trim() !== "" : geminiKey.trim() !== "";
  const hasData = !!localStorage.getItem("geostories-postcards");
  const isSmartTutorCustomized = tutorContext.trim() !== DEFAULT_SMART_TUTOR_CONTEXT.trim();

  const handleCopyGuide = () => {
    navigator.clipboard.writeText(SETUP_GUIDE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleCopyStorageGuide = () => {
    navigator.clipboard.writeText(STORAGE_SETUP_GUIDE).then(() => {
      setCopiedStorage(true);
      setTimeout(() => setCopiedStorage(false), 2500);
    });
  };

  const handleCopyDeployGuide = () => {
    navigator.clipboard.writeText(DEPLOYMENT_GUIDE).then(() => {
      setCopiedDeploy(true);
      setTimeout(() => setCopiedDeploy(false), 2500);
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapsKey.trim()) localStorage.setItem("google_maps_api_key", mapsKey.trim());
    else localStorage.removeItem("google_maps_api_key");

    if (openaiKey.trim()) localStorage.setItem("openai_api_key", openaiKey.trim());
    else localStorage.removeItem("openai_api_key");

    if (supabaseUrl.trim()) localStorage.setItem("supabase_url", supabaseUrl.trim());
    else localStorage.removeItem("supabase_url");

    if (supabaseKey.trim()) localStorage.setItem("supabase_anon_key", supabaseKey.trim());
    else localStorage.removeItem("supabase_anon_key");

    if (geminiKey.trim()) localStorage.setItem("gemini_api_key", geminiKey.trim());
    else localStorage.removeItem("gemini_api_key");

    localStorage.setItem("eop-smart-tutor-context", tutorContext.trim());
    localStorage.setItem("ai_provider", aiProvider);

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Connection Tester functions
  const testSupabase = async () => {
    const activeUrl = supabaseUrl.trim() || import.meta.env.VITE_SUPABASE_URL || "";
    const activeKey = supabaseKey.trim() || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

    if (!activeUrl || !activeKey) {
      setSupabaseTestResult({ success: false, message: "URL and Key are required." });
      return;
    }

    setSupabaseTesting(true);
    setSupabaseTestResult(null);

    try {
      const response = await fetch(`${activeUrl.trim().replace(/\/$/, '')}/rest/v1/?apikey=${activeKey.trim()}`, {
        headers: {
          'apikey': activeKey.trim(),
          'Authorization': `Bearer ${activeKey.trim()}`
        }
      });
      if (response.ok) {
        setSupabaseTestResult({ success: true, message: "Supabase connection active!" });
      } else {
        const text = await response.text();
        let errMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.message) errMsg = parsed.message;
        } catch (_) {}
        setSupabaseTestResult({ success: false, message: errMsg });
      }
    } catch (err: any) {
      setSupabaseTestResult({ success: false, message: err.message || "Failed to fetch. Check CORS or network status." });
    } finally {
      setSupabaseTesting(false);
    }
  };

  const testOpenAI = async () => {
    const activeKey = openaiKey.trim();
    if (!activeKey) {
      setOpenaiTestResult({ success: false, message: "API key is required." });
      return;
    }

    setOpenaiTesting(true);
    setOpenaiTestResult(null);

    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          "Authorization": `Bearer ${activeKey.trim()}`
        }
      });
      if (response.ok) {
        setOpenaiTestResult({ success: true, message: "OpenAI connection active!" });
      } else {
        const text = await response.text();
        let errMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.error?.message) errMsg = parsed.error.message;
        } catch (_) {}
        setOpenaiTestResult({ success: false, message: errMsg });
      }
    } catch (err: any) {
      setOpenaiTestResult({ success: false, message: err.message || "Failed to connect to OpenAI." });
    } finally {
      setOpenaiTesting(false);
    }
  };

  const testGemini = async () => {
    const activeKey = geminiKey.trim();
    if (!activeKey) {
      setGeminiTestResult({ success: false, message: "API key is required." });
      return;
    }

    setGeminiTesting(true);
    setGeminiTestResult(null);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${activeKey.trim()}`);
      if (response.ok) {
        setGeminiTestResult({ success: true, message: "Gemini connection active!" });
      } else {
        const text = await response.text();
        let errMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.error?.message) errMsg = parsed.error.message;
        } catch (_) {}
        setGeminiTestResult({ success: false, message: errMsg });
      }
    } catch (err: any) {
      setGeminiTestResult({ success: false, message: err.message || "Failed to connect to Gemini." });
    } finally {
      setGeminiTesting(false);
    }
  };

  const handleBulkExport = () => {
    const stored = localStorage.getItem("geostories-postcards");
    if (!stored) {
      alert("Nothing to export yet.");
      return;
    }

    try {
      const postcards = JSON.parse(stored);
      const fullArchive = postcards.map((card: any) => {
        const assets: any = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(`eop-asset-${card.id}-`)) {
            const presetId = key.split('-').pop()!;
            assets[presetId] = JSON.parse(localStorage.getItem(key)!);
          }
        }
        return { 
          ...card, 
          assets, 
          exportedAt: new Date().toISOString(),
          license: "CC BY-NC 4.0 (Open Educational Resource)" 
        };
      });

      const blob = new Blob([JSON.stringify(fullArchive, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eop-full-archive-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (err) {
      alert("Export failed.");
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const resultText = event.target?.result as string;
        const data = JSON.parse(resultText);
        let importedPostcards: any[] = [];
        
        if (Array.isArray(data)) {
          importedPostcards = data;
        } else if (data && typeof data === "object") {
          if (data.id && data.title) {
            importedPostcards = [data];
          } else {
            throw new Error("Invalid postcard format: Object must contain 'id' and 'title'.");
          }
        } else {
          throw new Error("Invalid format: Expected JSON array or postcard object.");
        }

        const stored = localStorage.getItem("geostories-postcards");
        let currentPostcards: any[] = [];
        if (stored) {
          currentPostcards = JSON.parse(stored);
        }

        importedPostcards.forEach((card: any) => {
          if (card.assets && typeof card.assets === "object") {
            Object.entries(card.assets).forEach(([presetId, assetVal]) => {
              localStorage.setItem(`eop-asset-${card.id}-${presetId}`, JSON.stringify(assetVal));
            });
          }

          const { assets, exportedAt, license, ...cleanCard } = card;
          const idx = currentPostcards.findIndex((c) => c.id === cleanCard.id);
          if (idx > -1) {
            currentPostcards[idx] = cleanCard;
          } else {
            currentPostcards.push(cleanCard);
          }
        });

        localStorage.setItem("geostories-postcards", JSON.stringify(currentPostcards));
        alert(`Successfully imported ${importedPostcards.length} postcards and restored their AI assets!`);
        window.location.reload();
      } catch (err: any) {
        alert(`Failed to import JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDatabase = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key === "geostories-postcards" || key.startsWith("eop-asset-"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    alert("Database and generated AI assets successfully reset to defaults.");
    window.location.reload();
  };

  return (
    <div className="eop-root">
      {/* NAV */}
      <header className="eop-nav">
        <Link to="/" className="eop-logo">
          <span className="eop-logo-dot" />
          <span>Echoes of the Past</span>
        </Link>
        <nav className="eop-nav-links">
          <LanguageSwitcher />
          <Link to="/learn" className="eop-nav-link">{t("nav_learn")}</Link>
          <Link to="/" className="eop-nav-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> {t("nav_archive")}
          </Link>
        </nav>
      </header>

      <section className="eop-settings-page">
        <div className="eop-settings-inner">
          <p className="eop-label">Configuration</p>
          <h1 className="eop-settings-title">Platform Settings</h1>
          
          {/* Tabs */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: "1px solid var(--grey-5)", paddingBottom: 16 }}>
            <button 
              type="button"
              className={`pd-action-btn ${tab === "api" ? "active" : ""}`}
              style={{ background: tab === "api" ? "var(--grey-6)" : "transparent", fontWeight: tab === "api" ? 600 : 400 }}
              onClick={() => setTab("api")}
            >
              API Configuration
            </button>
            <button 
              type="button"
              className={`pd-action-btn ${tab === "deployment" ? "active" : ""}`}
              style={{ background: tab === "deployment" ? "var(--grey-6)" : "transparent", fontWeight: tab === "deployment" ? 600 : 400 }}
              onClick={() => setTab("deployment")}
            >
              Deployment & Hosting
            </button>
          </div>

          {tab === "api" && (
            <>
              <p style={{ fontSize: "0.85rem", color: "var(--grey-3)", marginBottom: "28px", lineHeight: 1.6 }}>
                All keys are stored locally in your browser. They are never sent anywhere except directly to the respective service. Leave a field blank to use the server default from <code style={{ fontFamily: "monospace", fontSize: "0.8rem", background: "var(--grey-5)", padding: "1px 5px", borderRadius: "3px" }}>.env</code>.
              </p>

              {/* Copy setup guide */}
              <div className="eop-setup-guide-banner">
                <div>
                  <p className="eop-setup-guide-title">Not sure where to start?</p>
                  <p className="eop-setup-guide-sub">Copy the setup guide below and paste it into any AI assistant (ChatGPT, Claude, Gemini…).</p>
                </div>
                <button type="button" onClick={handleCopyGuide} className="eop-copy-guide-btn">
                  {copied ? "✓ Copied!" : "Copy setup guide"}
                </button>
              </div>

              <form onSubmit={handleSave} className="eop-settings-form">

                {/* ── Supabase ── */}
                <div className="accordion-panel">
                  <button
                    type="button"
                    className="accordion-header"
                    onClick={() => toggleSection("supabase")}
                    aria-expanded={openSections.supabase}
                  >
                    <div className="accordion-header-left">
                      <span className="accordion-title">Supabase</span>
                    </div>
                    <div className="accordion-header-right">
                      <span className={`status-badge ${isSupabaseConfigured ? "badge-configured" : "badge-missing"}`}>
                        {isSupabaseConfigured ? "Configured" : "Key Missing"}
                      </span>
                      {openSections.supabase ? <ChevronUp style={{ width: 18, height: 18 }} /> : <ChevronDown style={{ width: 18, height: 18 }} />}
                    </div>
                  </button>
                  <div className={`accordion-content ${openSections.supabase ? "is-open" : ""}`}>
                    <div className="accordion-content-inner">
                      <div className="eop-field" style={{ marginBottom: 20 }}>
                        <div className="eop-field-title-row">
                          <label htmlFor="supabase-url" className="eop-field-label">Project URL</label>
                          <div className="eop-badge-row">
                            {supabaseUrl ? (
                              <>
                                <span className="status-badge badge-custom-override">Custom Override Active</span>
                                <button type="button" className="eop-reset-btn" onClick={() => setSupabaseUrl("")}>Reset to Default</button>
                              </>
                            ) : import.meta.env.VITE_SUPABASE_URL ? (
                              <span className="status-badge badge-env-default">Using System Default</span>
                            ) : (
                              <span className="status-badge badge-missing">Not Configured</span>
                            )}
                          </div>
                        </div>
                        <p className="eop-field-hint">
                          Found in your Supabase dashboard under{" "}
                          <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
                            Settings → API
                          </a>.
                        </p>
                        <input
                          id="supabase-url"
                          type="text"
                          className="eop-input"
                          placeholder={import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co"}
                          value={supabaseUrl}
                          onChange={(e) => setSupabaseUrl(e.target.value)}
                        />
                      </div>

                      <div className="eop-field" style={{ marginBottom: 20 }}>
                        <div className="eop-field-title-row">
                          <label htmlFor="supabase-key" className="eop-field-label">Anon / Public Key</label>
                          <div className="eop-badge-row">
                            {supabaseKey ? (
                              <>
                                <span className="status-badge badge-custom-override">Custom Override Active</span>
                                <button type="button" className="eop-reset-btn" onClick={() => setSupabaseKey("")}>Reset to Default</button>
                              </>
                            ) : import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? (
                              <span className="status-badge badge-env-default">Using System Default</span>
                            ) : (
                              <span className="status-badge badge-missing">Not Configured</span>
                            )}
                          </div>
                        </div>
                        <p className="eop-field-hint">
                          The <code style={{ fontFamily: "monospace", fontSize: "0.78rem", background: "var(--grey-5)", padding: "1px 5px", borderRadius: "3px" }}>anon</code> key from your Supabase project. Safe to use client-side.
                        </p>
                        <div className="eop-input-wrapper">
                          <input
                            id="supabase-key"
                            type={showSupabaseKey ? "text" : "password"}
                            className="eop-input"
                            placeholder={import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? `${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY.slice(0, 8)}•••` : "eyJhbGci…"}
                            value={supabaseKey}
                            onChange={(e) => setSupabaseKey(e.target.value)}
                          />
                          <button
                            type="button"
                            className="eop-input-toggle-btn"
                            onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                            aria-label={showSupabaseKey ? "Hide key" : "Show key"}
                          >
                            {showSupabaseKey ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                          </button>
                        </div>
                      </div>

                      <div className="eop-field" style={{ marginBottom: 8 }}>
                        <label className="eop-field-label">Storage Bucket</label>
                        <p className="eop-field-hint">
                          Image uploads require a public <code style={{ fontFamily: "monospace", fontSize: "0.78rem", background: "var(--grey-5)", padding: "1px 5px", borderRadius: "3px" }}>postcards</code> bucket in your Supabase project. Copy the setup guide below and paste it into any AI assistant.
                        </p>
                        <button
                          type="button"
                          onClick={handleCopyStorageGuide}
                          className="eop-copy-guide-btn"
                          style={{ alignSelf: "flex-start", marginTop: 8 }}
                        >
                          {copiedStorage ? "✓ Copied!" : "Copy storage setup guide"}
                        </button>
                      </div>

                      <div className="eop-test-row">
                        <button
                          type="button"
                          className="eop-test-conn-btn"
                          onClick={testSupabase}
                          disabled={supabaseTesting}
                        >
                          {supabaseTesting && <span className="eop-spinner" />}
                          {supabaseTesting ? "Testing..." : "Test Connection"}
                        </button>
                        {supabaseTestResult && (
                          <span className={`eop-conn-test-result ${supabaseTestResult.success ? "success" : "error"}`}>
                            {supabaseTestResult.success ? "✓" : "⚠️"} {supabaseTestResult.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Google Maps ── */}
                <div className="accordion-panel">
                  <button
                    type="button"
                    className="accordion-header"
                    onClick={() => toggleSection("googleMaps")}
                    aria-expanded={openSections.googleMaps}
                  >
                    <div className="accordion-header-left">
                      <span className="accordion-title">Google Maps</span>
                    </div>
                    <div className="accordion-header-right">
                      <span className={`status-badge ${isMapsConfigured ? "badge-configured" : "badge-missing"}`}>
                        {isMapsConfigured ? "Configured" : "Key Missing"}
                      </span>
                      {openSections.googleMaps ? <ChevronUp style={{ width: 18, height: 18 }} /> : <ChevronDown style={{ width: 18, height: 18 }} />}
                    </div>
                  </button>
                  <div className={`accordion-content ${openSections.googleMaps ? "is-open" : ""}`}>
                    <div className="accordion-content-inner">
                      <div className="eop-field" style={{ marginBottom: 8 }}>
                        <div className="eop-field-title-row">
                          <label htmlFor="maps-key" className="eop-field-label">API Key</label>
                          {mapsKey && (
                            <div className="eop-badge-row">
                              <span className="status-badge badge-custom-override">Custom Override Active</span>
                              <button type="button" className="eop-reset-btn" onClick={() => setMapsKey("")}>Clear Key</button>
                            </div>
                          )}
                        </div>
                        <p className="eop-field-hint">
                          Required for the interactive Map View. Get one at{" "}
                          <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer">
                            Google Cloud Console
                          </a>. Enable the Maps JavaScript API.
                        </p>
                        <input
                          id="maps-key"
                          type="text"
                          className="eop-input"
                          placeholder="AIza…"
                          value={mapsKey}
                          onChange={(e) => setMapsKey(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── AI Provider ── */}
                <div className="accordion-panel">
                  <button
                    type="button"
                    className="accordion-header"
                    onClick={() => toggleSection("aiProvider")}
                    aria-expanded={openSections.aiProvider}
                  >
                    <div className="accordion-header-left">
                      <span className="accordion-title">AI Provider</span>
                    </div>
                    <div className="accordion-header-right">
                      <span className={`status-badge ${isAiConfigured ? "badge-configured" : "badge-missing"}`}>
                        {isAiConfigured ? "Configured" : "Key Missing"}
                      </span>
                      {openSections.aiProvider ? <ChevronUp style={{ width: 18, height: 18 }} /> : <ChevronDown style={{ width: 18, height: 18 }} />}
                    </div>
                  </button>
                  <div className={`accordion-content ${openSections.aiProvider ? "is-open" : ""}`}>
                    <div className="accordion-content-inner">
                      <div className="eop-field" style={{ marginBottom: 24 }}>
                        <label className="eop-field-label">Preferred Provider</label>
                        <p className="eop-field-hint">Choose which AI powers story generation and image analysis.</p>
                        <div className="eop-provider-toggle" style={{ marginTop: 8 }}>
                          <button
                            type="button"
                            className={`eop-provider-btn ${aiProvider === "openai" ? "active" : ""}`}
                            onClick={() => setAiProvider("openai")}
                          >
                            OpenAI (GPT-4o)
                          </button>
                          <button
                            type="button"
                            className={`eop-provider-btn ${aiProvider === "gemini" ? "active" : ""}`}
                            onClick={() => setAiProvider("gemini")}
                          >
                            Google Gemini
                          </button>
                        </div>
                      </div>

                      {/* OpenAI Key Input Wrapper */}
                      <div className={`eop-provider-fields-container ${aiProvider !== "openai" ? "inactive" : ""}`} style={{ borderTop: aiProvider === "openai" ? "1px dashed var(--grey-5)" : "none", paddingTop: aiProvider === "openai" ? 20 : 0, marginBottom: aiProvider === "openai" ? 24 : 0 }}>
                        <div className="eop-field">
                          <div className="eop-field-title-row">
                            <label htmlFor="openai-key" className="eop-field-label">
                              OpenAI API Key {aiProvider === "openai" && <span style={{ fontSize: "0.7rem", color: "var(--red)", marginLeft: 6 }}>(Preferred)</span>}
                            </label>
                            {openaiKey && (
                              <div className="eop-badge-row">
                                <span className="status-badge badge-custom-override">Custom Override Active</span>
                                <button type="button" className="eop-reset-btn" onClick={() => setOpenaiKey("")}>Clear Key</button>
                              </div>
                            )}
                          </div>
                          <p className="eop-field-hint">
                            Get one at{" "}
                            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
                              platform.openai.com
                            </a>.
                          </p>
                          <div className="eop-input-wrapper">
                            <input
                              id="openai-key"
                              type={showOpenaiKey ? "text" : "password"}
                              className="eop-input"
                              placeholder="sk-…"
                              value={openaiKey}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val.trim().startsWith("curl")) {
                                  const parsed = extractOpenAIKeyFromCurl(val);
                                  if (parsed) {
                                    setOpenaiKey(parsed);
                                    setOpenaiExtracted(true);
                                    setOpenaiCurlError("");
                                    setTimeout(() => setOpenaiExtracted(false), 3000);
                                    return;
                                  }
                                }
                                setOpenaiKey(val);
                              }}
                            />
                            <button
                              type="button"
                              className="eop-input-toggle-btn"
                              onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                              aria-label={showOpenaiKey ? "Hide key" : "Show key"}
                            >
                              {showOpenaiKey ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                            </button>
                          </div>
                        </div>

                        <div className="eop-test-row" style={{ marginBottom: 16 }}>
                          <button
                            type="button"
                            className="eop-test-conn-btn"
                            onClick={testOpenAI}
                            disabled={openaiTesting}
                          >
                            {openaiTesting && <span className="eop-spinner" />}
                            {openaiTesting ? "Testing..." : "Test Connection"}
                          </button>
                          {openaiTestResult && (
                            <span className={`eop-conn-test-result ${openaiTestResult.success ? "success" : "error"}`}>
                              {openaiTestResult.success ? "✓" : "⚠️"} {openaiTestResult.message}
                            </span>
                          )}
                        </div>

                        <div className="eop-field" style={{ marginTop: 12 }}>
                          <label htmlFor="openai-curl-textarea" className="eop-field-label" style={{ fontSize: "0.72rem", color: "var(--grey-3)" }}>
                            Or paste an OpenAI cURL command
                          </label>
                          <textarea
                            id="openai-curl-textarea"
                            className="eop-input"
                            style={{ minHeight: 70, fontSize: "0.8rem", fontFamily: "var(--font-mono)", opacity: 0.85 }}
                            placeholder={`curl https://api.openai.com/v1/chat/completions \\\n  -H "Authorization: Bearer YOUR_API_KEY"`}
                            onChange={(e) => {
                              const parsed = extractOpenAIKeyFromCurl(e.target.value);
                              if (parsed) {
                                setOpenaiKey(parsed);
                                setOpenaiExtracted(true);
                                setOpenaiCurlError("");
                                setTimeout(() => setOpenaiExtracted(false), 3000);
                              } else if (e.target.value.trim().startsWith("curl")) {
                                setOpenaiCurlError("Could not find a Bearer token in the pasted cURL command.");
                                setOpenaiExtracted(false);
                              } else {
                                setOpenaiCurlError("");
                                setOpenaiExtracted(false);
                              }
                            }}
                          />
                          {openaiExtracted && <span style={{ fontSize: "0.8rem", color: "#2a7a2a", fontWeight: 500, marginTop: 4, display: "block" }}>✓ API Key extracted successfully!</span>}
                          {openaiCurlError && <span style={{ fontSize: "0.8rem", color: "#c8102e", fontWeight: 500, marginTop: 4, display: "block" }}>⚠️ {openaiCurlError}</span>}
                        </div>
                      </div>

                      {/* Gemini Key Input Wrapper */}
                      <div className={`eop-provider-fields-container ${aiProvider !== "gemini" ? "inactive" : ""}`} style={{ borderTop: aiProvider === "gemini" ? "1px dashed var(--grey-5)" : "none", paddingTop: aiProvider === "gemini" ? 20 : 0, marginBottom: aiProvider === "gemini" ? 8 : 0 }}>
                        <div className="eop-field">
                          <div className="eop-field-title-row">
                            <label htmlFor="gemini-key" className="eop-field-label">
                              Gemini API Key {aiProvider === "gemini" && <span style={{ fontSize: "0.7rem", color: "var(--red)", marginLeft: 6 }}>(Preferred)</span>}
                            </label>
                            {geminiKey && (
                              <div className="eop-badge-row">
                                <span className="status-badge badge-custom-override">Custom Override Active</span>
                                <button type="button" className="eop-reset-btn" onClick={() => setGeminiKey("")}>Clear Key</button>
                              </div>
                            )}
                          </div>
                          <p className="eop-field-hint">
                            Get one at{" "}
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
                              Google AI Studio
                            </a>. A Gemini API key is required to generate Cinematic Videos (Veo).
                          </p>
                          <div className="eop-input-wrapper">
                            <input
                              id="gemini-key"
                              type={showGeminiKey ? "text" : "password"}
                              className="eop-input"
                              placeholder="AIza…"
                              value={geminiKey}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val.trim().startsWith("curl")) {
                                  const parsed = extractGeminiKeyFromCurl(val);
                                  if (parsed) {
                                    setGeminiKey(parsed);
                                    setGeminiExtracted(true);
                                    setGeminiCurlError("");
                                    setTimeout(() => setGeminiExtracted(false), 3000);
                                    return;
                                  }
                                }
                                setGeminiKey(val);
                              }}
                            />
                            <button
                              type="button"
                              className="eop-input-toggle-btn"
                              onClick={() => setShowGeminiKey(!showGeminiKey)}
                              aria-label={showGeminiKey ? "Hide key" : "Show key"}
                            >
                              {showGeminiKey ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                            </button>
                          </div>
                        </div>

                        <div className="eop-test-row" style={{ marginBottom: 16 }}>
                          <button
                            type="button"
                            className="eop-test-conn-btn"
                            onClick={testGemini}
                            disabled={geminiTesting}
                          >
                            {geminiTesting && <span className="eop-spinner" />}
                            {geminiTesting ? "Testing..." : "Test Connection"}
                          </button>
                          {geminiTestResult && (
                            <span className={`eop-conn-test-result ${geminiTestResult.success ? "success" : "error"}`}>
                              {geminiTestResult.success ? "✓" : "⚠️"} {geminiTestResult.message}
                            </span>
                          )}
                        </div>

                        <div className="eop-field" style={{ marginTop: 12 }}>
                          <label htmlFor="gemini-curl-textarea" className="eop-field-label" style={{ fontSize: "0.72rem", color: "var(--grey-3)" }}>
                            Or paste a Google API cURL command
                          </label>
                          <textarea
                            id="gemini-curl-textarea"
                            className="eop-input"
                            style={{ minHeight: 70, fontSize: "0.8rem", fontFamily: "var(--font-mono)", opacity: 0.85 }}
                            placeholder={`curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent" \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-goog-api-key: YOUR_API_KEY'`}
                            onChange={(e) => {
                              const parsed = extractGeminiKeyFromCurl(e.target.value);
                              if (parsed) {
                                setGeminiKey(parsed);
                                setGeminiExtracted(true);
                                setGeminiCurlError("");
                                setTimeout(() => setGeminiExtracted(false), 3000);
                              } else if (e.target.value.trim().startsWith("curl")) {
                                setGeminiCurlError("Could not find a valid API key (X-goog-api-key or ?key=) in the pasted cURL command.");
                                setGeminiExtracted(false);
                              } else {
                                setGeminiCurlError("");
                                setGeminiExtracted(false);
                              }
                            }}
                          />
                          {geminiExtracted && <span style={{ fontSize: "0.8rem", color: "#2a7a2a", fontWeight: 500, marginTop: 4, display: "block" }}>✓ API Key extracted successfully!</span>}
                          {geminiCurlError && <span style={{ fontSize: "0.8rem", color: "#c8102e", fontWeight: 500, marginTop: 4, display: "block" }}>⚠️ {geminiCurlError}</span>}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* ── Data Management ── */}
                <div className="accordion-panel">
                  <button
                    type="button"
                    className="accordion-header"
                    onClick={() => toggleSection("dataManagement")}
                    aria-expanded={openSections.dataManagement}
                  >
                    <div className="accordion-header-left">
                      <span className="accordion-title">Data Management</span>
                    </div>
                    <div className="accordion-header-right">
                      <span className={`status-badge ${hasData ? "badge-configured" : "badge-default"}`}>
                        {hasData ? "Has Data" : "No Data"}
                      </span>
                      {openSections.dataManagement ? <ChevronUp style={{ width: 18, height: 18 }} /> : <ChevronDown style={{ width: 18, height: 18 }} />}
                    </div>
                  </button>
                  <div className={`accordion-content ${openSections.dataManagement ? "is-open" : ""}`}>
                    <div className="accordion-content-inner">
                      <div className="eop-field" style={{ marginBottom: 8 }}>
                        <label className="eop-field-label">Export Full Archive</label>
                        <p className="eop-field-hint">Download all postcards you've added, including every AI-generated story, render, and asset you've saved.</p>
                        <button
                          type="button"
                          onClick={handleBulkExport}
                          className="eop-btn-primary"
                          style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, background: "white", color: "var(--grey-1)", border: "1px solid var(--grey-5)" }}
                        >
                          <Download style={{ width: 16, height: 16 }} />
                          Download Complete Archive (JSON)
                        </button>
                      </div>

                      <div className="eop-field" style={{ marginTop: 24, marginBottom: 8 }}>
                        <label className="eop-field-label">Import / Restore Backup</label>
                        <p className="eop-field-hint">Upload a previously exported GeoStories JSON file to restore postcards and their AI assets.</p>
                        <div className="eop-import-zone">
                          <Upload className="eop-import-zone-icon" />
                          <span className="eop-import-zone-text">Click or drag files here to upload backup JSON</span>
                          <span className="eop-import-zone-hint">Supports JSON files containing postcards and assets</span>
                          <input 
                            type="file" 
                            accept=".json" 
                            className="eop-import-file-input" 
                            onChange={handleImportJson}
                          />
                        </div>
                      </div>

                      <div className="eop-reset-db-container">
                        <label className="eop-field-label" style={{ color: "#C62828" }}>Danger Zone</label>
                        <p className="eop-field-hint">Permanently delete all locally stored postcards and AI assets.</p>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                          {resetDbState === "idle" && (
                            <button
                              type="button"
                              className="eop-reset-db-btn idle"
                              onClick={() => setResetDbState("confirm")}
                            >
                              <Trash2 style={{ width: 14, height: 14 }} />
                              Reset Database
                            </button>
                          )}
                          {resetDbState === "confirm" && (
                            <>
                              <button
                                type="button"
                                className="eop-reset-db-btn confirm"
                                onClick={() => setResetDbState("critical")}
                              >
                                <AlertTriangle style={{ width: 14, height: 14 }} />
                                Confirm Reset?
                              </button>
                              <button
                                type="button"
                                className="eop-reset-db-cancel"
                                onClick={() => setResetDbState("idle")}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {resetDbState === "critical" && (
                            <>
                              <button
                                type="button"
                                className="eop-reset-db-btn critical"
                                onClick={handleResetDatabase}
                              >
                                <AlertTriangle style={{ width: 14, height: 14 }} />
                                Confirm Permanent Deletion?
                              </button>
                              <button
                                type="button"
                                className="eop-reset-db-cancel"
                                onClick={() => setResetDbState("idle")}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Smart Tutor Context ── */}
                <div className="accordion-panel">
                  <button
                    type="button"
                    className="accordion-header"
                    onClick={() => toggleSection("smartTutor")}
                    aria-expanded={openSections.smartTutor}
                  >
                    <div className="accordion-header-left">
                      <span className="accordion-title">Smart Tutor Context</span>
                    </div>
                    <div className="accordion-header-right">
                      <span className={`status-badge ${isSmartTutorCustomized ? "badge-customized" : "badge-default"}`}>
                        {isSmartTutorCustomized ? "Customized" : "Default"}
                      </span>
                      {openSections.smartTutor ? <ChevronUp style={{ width: 18, height: 18 }} /> : <ChevronDown style={{ width: 18, height: 18 }} />}
                    </div>
                  </button>
                  <div className={`accordion-content ${openSections.smartTutor ? "is-open" : ""}`}>
                    <div className="accordion-content-inner">
                      <div className="eop-field" style={{ marginBottom: 8 }}>
                        <label htmlFor="tutor-context" className="eop-field-label">Pedagogical Instructions</label>
                        <p className="eop-field-hint">
                          The system prompt used by the Smart Tutor. You can refine this to improve the AI's cultural relevance and pedagogical behavior.
                        </p>
                        <textarea
                          id="tutor-context"
                          className="eop-input"
                          style={{ minHeight: 200, fontFamily: "monospace", fontSize: "0.85rem", lineHeight: 1.5 }}
                          value={tutorContext}
                          onChange={(e) => setTutorContext(e.target.value)}
                          placeholder="Enter custom instructions for the AI Tutor..."
                        />
                        <button 
                          type="button" 
                          onClick={() => setTutorContext(DEFAULT_SMART_TUTOR_CONTEXT)}
                          style={{ marginTop: 8, fontSize: "0.75rem", color: "var(--grey-3)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", alignSelf: "flex-start" }}
                        >
                          Reset to default context
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="eop-settings-actions">
                  <button type="submit" className="eop-btn-primary">
                    Save Settings
                  </button>
                  {saved && (
                    <span className="eop-save-confirm">✓ Saved to browser</span>
                  )}
                </div>
              </form>
            </>
          )}

          {tab === "deployment" && (
            <div className="eop-settings-form">
              <p style={{ fontSize: "0.85rem", color: "var(--grey-3)", marginBottom: "28px", lineHeight: 1.6 }}>
                The platform is designed to be fully client-side (Zero-Deploy Architecture). It can be run locally or hosted on free static hosting providers like Vercel or GitHub Pages.
              </p>

              <div className="eop-setup-guide-banner" style={{ background: "var(--grey-6)", border: "1px solid var(--grey-5)" }}>
                <div>
                  <p className="eop-setup-guide-title">Deployment Assistant</p>
                  <p className="eop-setup-guide-sub">Copy this prompt into an AI assistant to get step-by-step help with local development or deploying to Vercel via GitHub.</p>
                </div>
                <button type="button" onClick={handleCopyDeployGuide} className="eop-btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                  {copiedDeploy ? "✓ Copied!" : "Copy instructions"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="eop-footer">
        <div className="eop-footer-inner">
          <span>© {new Date().getFullYear()} Small Academy — Erasmus+ Programme</span>
        </div>
      </footer>
    </div>
  );
};

export default Settings;

