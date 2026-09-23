import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    goatcounter?: {
      no_onload?: boolean;
      count?: (data: { path: string; title?: string }) => void;
    };
  }
}

const endpoint = import.meta.env.VITE_GOATCOUNTER_ENDPOINT?.trim();
const scriptId = "goatcounter-script";

/** Tracks public page views only when the organisation has configured GoatCounter. */
export default function GoatCounterAnalytics() {
  const { pathname, search } = useLocation();
  const [ready, setReady] = useState(() => Boolean(window.goatcounter?.count));
  const trackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!endpoint) return;

    window.goatcounter = { ...window.goatcounter, no_onload: true };
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => setReady(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = "https://gc.zgo.at/count.js";
    script.dataset.goatcounter = endpoint;
    script.addEventListener("load", () => setReady(true), { once: true });
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!ready || !endpoint) return;
    const path = `${pathname}${search}`;
    if (trackedPath.current === path) return;
    window.goatcounter?.count?.({ path, title: document.title });
    trackedPath.current = path;
  }, [pathname, ready, search]);

  return null;
}
