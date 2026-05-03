import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, ClipboardCopy, Check, KeyRound, Database, FileJson, Bot, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Copy-to-clipboard hook ──────────────────────────────────────────────────
function useCopy(timeout = 2000) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), timeout);
    });
  };
  return { copied, copy };
}

// ─── Reusable section card ───────────────────────────────────────────────────
function SettingsSection({
  icon,
  title,
  description,
  copyKey,
  copyText,
  copied,
  onCopy,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  copyKey: string;
  copyText: string;
  copied: string | null;
  onCopy: (key: string, text: string) => void;
  children?: React.ReactNode;
}) {
  const isCopied = copied === copyKey;
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-accent">{icon}</span>
          <h3 className="font-heading font-semibold text-sm text-primary">{title}</h3>
        </div>
        <button
          onClick={() => onCopy(copyKey, copyText)}
          className="flex items-center gap-1.5 shrink-0 text-xs border border-border rounded-lg px-2.5 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          {isCopied ? (
            <><Check className="w-3 h-3 text-green-500" /><span className="text-green-600">Copied!</span></>
          ) : (
            <><ClipboardCopy className="w-3 h-3" />Copy for AI</>
          )}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

// ─── Instructions strings ────────────────────────────────────────────────────
const MAPS_INSTRUCTIONS = `
You are a setup assistant for GeoStories.

Help the user configure their Google Maps API key:

1. Go to https://console.cloud.google.com/
2. Create or select a project.
3. Go to "APIs & Services" → "Library" and enable:
   - Maps JavaScript API
4. Go to "APIs & Services" → "Credentials" → "Create Credentials" → "API Key".
5. (Recommended) Restrict the key to HTTP referrers: localhost:8080 for local dev, or your production domain.
6. Important: Advanced Markers require a Map ID. For testing, "DEMO_MAP_ID" works automatically.
   For production, go to Google Maps Platform → Map IDs → Create a Map ID and enter it in the app.
7. Paste the API key into the GeoStories API key prompt.

Please guide me step by step.
`.trim();

const SUPABASE_INSTRUCTIONS = `
You are a setup assistant for GeoStories.

Help the user configure their Supabase project:

1. Go to https://supabase.com/ and create a free account.
2. Create a new project. Choose a strong password and a region close to your users.
3. Once created, go to Settings → API.
4. Copy:
   - Project URL  →  use as VITE_SUPABASE_URL
   - anon / public key  →  use as VITE_SUPABASE_PUBLISHABLE_KEY
5. Create a .env file in the project root:

   VITE_SUPABASE_URL=https://<your-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>

6. For the Edge Functions (AI story generation):
   - Go to your Supabase dashboard → Edge Functions → Secrets
   - Add: OPENAI_API_KEY = sk-...
   - Deploy the functions: supabase functions deploy generate-story && supabase functions deploy format-postcard-json

Please guide me step by step.
`.trim();

const JSON_FORMAT_INSTRUCTIONS = `
You are a data formatting assistant for GeoStories, a historical postcard mapping app.

Convert my data into an array of postcard objects with this exact structure:

[
  {
    "id": "unique-string-id",
    "title": "Descriptive title of the postcard",
    "description": "One or more sentences describing the historical scene or location",
    "image_url": "https://direct-link-to-image.jpg",
    "latitude": 48.8584,
    "longitude": 2.2945
  }
]

Rules:
- "id" must be unique per entry (use a UUID or slug)
- "latitude" and "longitude" must be numbers (not strings)
- "image_url" must be a publicly accessible direct image URL
- Return ONLY the JSON array, no prose or code fences

Here is my data to convert:
[PASTE YOUR DATA HERE]
`.trim();

const OPENAI_INSTRUCTIONS = `
You are a setup assistant for GeoStories.

Help the user configure the OpenAI API key used by the edge functions:

1. Go to https://platform.openai.com/api-keys
2. Sign in and click "Create new secret key". Give it a name like "geostories".
3. Copy the key immediately — it won't be shown again.
4. In your Supabase dashboard, go to Edge Functions → Secrets.
5. Add a secret named: OPENAI_API_KEY  with the value: sk-...
6. The following edge functions use this key:
   - generate-story: creates historical narratives for postcards (model: gpt-4o-mini)
   - format-postcard-json: normalises arbitrary JSON into the postcard schema (model: gpt-4o-mini)
7. Make sure both functions are deployed:
   supabase functions deploy generate-story
   supabase functions deploy format-postcard-json

Please guide me step by step.
`.trim();

// ─── Main component ──────────────────────────────────────────────────────────
const SettingsPanel = () => {
  const { copied, copy } = useCopy();
  const { toast } = useToast();
  const [mapsKey, setMapsKey] = useState(() => localStorage.getItem("google_maps_api_key") ?? "");
  const [editingKey, setEditingKey] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");

  const handleSaveMapsKey = () => {
    const trimmed = keyDraft.trim();
    if (!trimmed) return;
    localStorage.setItem("google_maps_api_key", trimmed);
    setMapsKey(trimmed);
    setEditingKey(false);
    toast({ title: "API key saved", description: "Reload the page for changes to take effect." });
  };

  const handleClearMapsKey = () => {
    localStorage.removeItem("google_maps_api_key");
    setMapsKey("");
    setEditingKey(false);
    toast({ title: "API key removed", description: "The map will prompt for a new key on next load." });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          id="settings-trigger"
          aria-label="Open settings"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border shadow-md text-primary hover:text-accent hover:border-accent transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 font-heading text-xl">
            <Settings className="w-5 h-5 text-accent" />
            App Settings
          </SheetTitle>
          <SheetDescription>
            Configure GeoStories. Each section has a button to copy setup instructions for an AI assistant.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">

          {/* ── Google Maps ── */}
          <SettingsSection
            icon={<KeyRound className="w-4 h-4" />}
            title="Google Maps API Key"
            description="Required to display the interactive map. The key is stored in your browser's localStorage."
            copyKey="maps"
            copyText={MAPS_INSTRUCTIONS}
            copied={copied}
            onCopy={copy}
          >
            <div className="space-y-2">
              {!editingKey ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate text-muted-foreground">
                    {mapsKey ? `${mapsKey.slice(0, 8)}${"•".repeat(20)}` : "Not set"}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => { setKeyDraft(mapsKey); setEditingKey(true); }}>
                    {mapsKey ? "Change" : "Set Key"}
                  </Button>
                  {mapsKey && (
                    <button onClick={handleClearMapsKey} className="text-destructive hover:opacity-80 transition-opacity" title="Remove key">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={keyDraft}
                    onChange={e => setKeyDraft(e.target.value)}
                    placeholder="AIza..."
                    autoFocus
                    className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:ring-2 focus:ring-accent outline-none"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveMapsKey}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingKey(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </SettingsSection>

          {/* ── Supabase ── */}
          <SettingsSection
            icon={<Database className="w-4 h-4" />}
            title="Supabase Configuration"
            description="Used for backend edge functions (AI story generation & JSON import). Set via .env file — values are read-only at runtime."
            copyKey="supabase"
            copyText={SUPABASE_INSTRUCTIONS}
            copied={copied}
            onCopy={copy}
          >
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
                <span className="text-muted-foreground shrink-0">VITE_SUPABASE_URL</span>
                <span className="truncate text-foreground">
                  {import.meta.env.VITE_SUPABASE_URL || <em className="text-muted-foreground">not set</em>}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
                <span className="text-muted-foreground shrink-0">PUBLISHABLE_KEY</span>
                <span className="truncate text-foreground">
                  {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
                    ? `${(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string).slice(0, 12)}•••`
                    : <em className="text-muted-foreground">not set</em>}
                </span>
              </div>
            </div>
          </SettingsSection>

          {/* ── JSON Format ── */}
          <SettingsSection
            icon={<FileJson className="w-4 h-4" />}
            title="Postcard JSON Format"
            description='Copy the instructions below and paste into any LLM along with your raw data. The AI will convert it to the correct postcard structure before you import.'
            copyKey="json"
            copyText={JSON_FORMAT_INSTRUCTIONS}
            copied={copied}
            onCopy={copy}
          >
            <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto text-muted-foreground leading-relaxed">
{`[{
  "id": "unique-string",
  "title": "Postcard title",
  "description": "Historical description",
  "image_url": "https://...",
  "latitude": 48.8584,
  "longitude": 2.2945
}]`}
            </pre>
          </SettingsSection>

          {/* ── OpenAI ── */}
          <SettingsSection
            icon={<Bot className="w-4 h-4" />}
            title="OpenAI API Key (Edge Functions)"
            description="Used by the Supabase edge functions to generate historical narratives and reformat JSON. Set as a Supabase secret — never in the frontend."
            copyKey="openai"
            copyText={OPENAI_INSTRUCTIONS}
            copied={copied}
            onCopy={copy}
          >
            <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
              Set via Supabase dashboard → Edge Functions → Secrets → <code>OPENAI_API_KEY</code>
            </p>
          </SettingsSection>

        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsPanel;
