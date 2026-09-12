import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE_PATH || (mode === "production" ? "/echoesofthepast/" : "/"),
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@tanstack/react-query")) return "vendor-query";
          if (id.includes("@googlemaps/markerclusterer")) return "vendor-maps";
          if (/node_modules\/(react|react-dom|react-router|react-helmet-async)\//.test(id)) return "vendor-react";
          if (/(lucide-react|clsx|tailwind-merge)/.test(id)) return "vendor-ui";
          return undefined;
        },
      },
    },
  },
}));
