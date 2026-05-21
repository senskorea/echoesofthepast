import { useEffect, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { useNavigate } from "react-router-dom";
import { Postcard } from "@/types/postcard";
import { Loader2, MapPin, ClipboardCopy, Check, Home } from "lucide-react";

interface MapViewProps {
  postcards: Postcard[];
}

const MapView = ({ postcards }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string>("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const SETUP_INSTRUCTIONS = `
You are a setup assistant for GeoStories, an open-source interactive historical postcard mapping app.
Help the user complete the following configuration steps:

---

## 1. Google Maps API Key

- Go to https://console.cloud.google.com/
- Create or select a project.
- Navigate to "APIs & Services" → "Library".
- Enable the following APIs:
  - Maps JavaScript API
  - (Optional) Places API for address lookups
- Go to "APIs & Services" → "Credentials" → "Create Credentials" → "API key".
- Copy the key and restrict it to "HTTP referrers" pointing to your domain (e.g. localhost:8080 for local dev).
- Paste the key into the GeoStories API key prompt.

## 2. Supabase Project

- Go to https://supabase.com/ and create a free account.
- Create a new project and note your Project URL and anon/public API key (found under Settings → API).
- Create a .env file in the project root with:

  VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>

## 3. OpenAI API Key (for AI story generation & JSON import)

- Go to https://platform.openai.com/api-keys and create an API key.
- In your Supabase project, go to Edge Functions → Secrets and add:

  OPENAI_API_KEY = sk-...

- The edge functions (generate-story and format-postcard-json) will use this key to call gpt-4o-mini.

## 4. Running locally

  npm install
  npm run dev

  App starts at http://localhost:8080

---

Please guide me step by step through whichever part I need help with.
`.trim();

  const handleCopyInstructions = () => {
    navigator.clipboard.writeText(SETUP_INSTRUCTIONS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    // Check for API key - in production this would come from environment
    const storedKey = localStorage.getItem("google_maps_api_key");
    if (storedKey) {
      setApiKey(storedKey);
      initializeMap(storedKey);
    } else {
      setShowKeyInput(true);
      setIsLoading(false);
    }
  }, []);

  // Update markers when postcards change
  useEffect(() => {
    if (mapInstanceRef.current && window.google?.maps) {
      updateMarkers();
    }
  }, [postcards]);

  const updateMarkers = async () => {
    if (!mapInstanceRef.current) return;

    try {
      const { AdvancedMarkerElement } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

      // Clear existing markers
      markersRef.current.forEach(marker => {
        marker.map = null;
      });
      markersRef.current = [];

      // Clear existing clusterer
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }

      // Create new markers
      const markers = postcards.map((postcard) => {
        const markerContent = document.createElement("div");
        markerContent.className = "custom-marker";
        markerContent.innerHTML = `
          <div class="w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform duration-300 border-2 border-primary/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `;

        const marker = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: { lat: postcard.latitude, lng: postcard.longitude },
          content: markerContent,
          title: postcard.title,
        });

        marker.addListener("click", () => {
          navigate(`/postcards/${postcard.id}`);
        });

        return marker;
      });

      markersRef.current = markers;

      // Add marker clustering
      clustererRef.current = new MarkerClusterer({
        markers,
        map: mapInstanceRef.current,
      });
    } catch (error) {
      console.error("Error updating markers:", error);
    }
  };

  const initializeMap = async (key: string) => {
    if (!mapRef.current) return;

    try {
      // Use Google's Dynamic Library Import bootstrap loader (current recommended approach).
      // This replaces the old script-tag approach and avoids the v=beta deprecation.
      if (!window.google?.maps?.importLibrary) {
        await new Promise<void>((resolve, reject) => {
          const MARKER_ATTR = 'data-geostories-maps';

          // Don't inject twice — if the loader is already in the DOM, just wait
          if (document.querySelector(`script[${MARKER_ATTR}]`)) {
            const timer = setInterval(() => {
              if (window.google?.maps?.importLibrary) { clearInterval(timer); resolve(); }
            }, 100);
            setTimeout(() => { clearInterval(timer); reject(new Error('Google Maps load timeout')); }, 10000);
            return;
          }

          // Inject Google's official inline bootstrap loader (v=weekly = stable channel)
          const script = document.createElement('script');
          script.setAttribute(MARKER_ATTR, '1');
          /* eslint-disable */
          script.textContent = `(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src="https://maps."+c+"apis.com/maps/api/js?"+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({key:"${key}",v:"weekly"});`;
          /* eslint-enable */
          document.head.appendChild(script);

          const timer = setInterval(() => {
            if (window.google?.maps?.importLibrary) { clearInterval(timer); resolve(); }
          }, 100);
          // 10-second guard so the spinner can never hang indefinitely
          setTimeout(() => {
            clearInterval(timer);
            reject(new Error('Google Maps failed to load. Check your API key and that billing is enabled.'));
          }, 10000);
        });
      }

      const { Map } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;

      // DEMO_MAP_ID is Google's official placeholder — it enables Advanced Markers
      // without requiring a Cloud-registered Map ID. For production, create your own
      // at console.cloud.google.com → Google Maps Platform → Map IDs.
      const map = new Map(mapRef.current, {
        center: { lat: 48.8584, lng: 2.2945 },
        zoom: 5,
        mapId: "DEMO_MAP_ID",
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;

      // Reveal the map immediately — marker failures won't block the UI
      setIsLoading(false);
      await updateMarkers();
    } catch (error) {
      console.error("Error loading Google Maps:", error);
      setIsLoading(false);
      setShowKeyInput(true);
    }
  };
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 48.8584, lng: 2.2945 });
      mapInstanceRef.current.setZoom(5);
    }
  };


  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).elements.namedItem(
      "apiKey"
    ) as HTMLInputElement;
    const key = input.value.trim();
    if (key) {
      localStorage.setItem("google_maps_api_key", key);
      setApiKey(key);
      setShowKeyInput(false);
      setIsLoading(true);
      initializeMap(key);
    }
  };

  if (showKeyInput) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="vintage-card p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-6">
            <MapPin className="w-12 h-12 text-accent" />
          </div>
          <h2 className="font-heading text-2xl font-semibold text-center mb-4">
            Google Maps API Key Required
          </h2>
          <p className="text-muted-foreground text-center mb-6">
            To display the interactive map, please enter your Google Maps API key.
            Get one at{" "}
            <a
              href="https://console.cloud.google.com/google/maps-apis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Google Cloud Console
            </a>
          </p>
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <input
              type="text"
              name="apiKey"
              placeholder="Enter your API key"
              className="w-full px-4 py-3 rounded-lg border border-border bg-card focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
              required
            />
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Continue to Map
            </button>
          </form>

          {/* Copy setup guide */}
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Not sure how to get an API key? Copy the full setup guide below
              and paste it into any AI assistant (ChatGPT, Claude, etc.).
            </p>
            <button
              type="button"
              onClick={handleCopyInstructions}
              className="w-full flex items-center justify-center gap-2 border border-border rounded-lg px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Copied to clipboard!</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-4 h-4 text-accent" />
                  Copy setup guide for AI assistant
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground font-body">Loading historical map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Reset View Button */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
        <button
          onClick={handleResetView}
          title="Reset View"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-card border border-border shadow-lg text-primary hover:text-accent hover:border-accent transition-all active:scale-95"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>

      {/* Elegant overlay header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <div className="vintage-card px-8 py-4 backdrop-blur-sm bg-card/95">
          <h1 className="font-heading text-3xl font-bold text-primary">
            GeoStories
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Mapping History, One Story at a Time
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapView;
