# GeoStories — Echoes of the Past

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Enabled-3ECF8E?logo=supabase)](https://supabase.com)

**GeoStories — Echoes of the Past** is an immersive, map-based historical storytelling platform and AI learning ecosystem. It transforms static archives—such as historical postcards—into dynamic narratives, visual renders, time-capsule letters, and interactive educational content.

---

## 🌟 Core Pillars & Platform Features

### 1. 🗺️ GeoStories Interactive Mapping Platform
- **Map-Based Storytelling:** Interactive Google Maps view with custom pin clustering, geographic metadata inferencing, and search filters.
- **Historical Postcard Detail View:** Browse rich historical postcards with synchronized narrative storytelling, visual renders, time capsule letters, and audio narration.
- **Dynamic Story Generation:** Generates multi-perspective historical context using multimodal LLMs.

### 2. 🎓 Interactive AI Learning Hub (MOOC & Smart Tutor)
- **Comprehensive MOOC Platform (`/learn`):** Structured educational modules covering digital archiving, no-code AI tools, prompt engineering, and ethical AI in heritage preservation.
- **Interactive Quizzes & Progress:** Module knowledge checks with instant grading and browser-based progress tracking.
- **Persistent AI Smart Tutor Chatbot:** Floating AI assistant integrated across the platform to answer learner queries and explain historical archiving concepts interactively.

### 3. 🛠️ Heritage Preservation No-Code AI Archiving Tools
- **AI Vision Auto-Extraction:** Instantly extracts transcription, visual descriptions, historical contexts, and coordinate estimates directly from uploaded postcard images.
- **No-Code Asset Generation:** Generate architectural renders, fictional time-capsule letters, and video assets without writing a single line of code.
- **Smart JSON Import/Export:** Import and export structured postcard archives with automated prompt format guides for external LLMs (ChatGPT, Claude, Gemini).

---

## 🚀 Tech Stack

- **Frontend Core:** React 18, TypeScript, Vite
- **UI & Styling:** Tailwind CSS, shadcn/ui, Lucide Icons
- **Mapping & Geolocation:** Google Maps JavaScript API with `@googlemaps/markerclusterer`
- **AI Services & Integrations:** OpenAI and Gemini APIs, Supabase Edge Functions (Edge Deno runtime), Web Speech API
- **State Management & Data:** `@tanstack/react-query`, `react-router-dom`, `react-helmet-async`

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js:** $\ge$ 18.0
- **Google Maps JavaScript API Key:** (with Maps JavaScript API enabled)
- **OpenAI / Gemini API Key:** (for AI vision and text generation)
- **Supabase Project:** (URL & Anon key with a public `postcards` bucket)

### Installation & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/geo-stories-eu.git
cd geo-stories-eu

# 2. Install dependencies
npm install

# 3. Create .env file from template
cp .env.example .env

# 4. Start local development server
npm run dev
```

The application will launch locally at **`http://localhost:8080`**.

---

## 🔑 Environment Variables & Security

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_GOOGLE_MAPS_API_KEY=<optional-default-maps-key>
```

> **Note:** Platform settings can also be configured interactively at runtime via the **Settings (`/settings`)** dashboard. Keys stored in browser `localStorage` are readable by scripts running on the same origin; use a dedicated browser profile and restricted API keys.

---

## ⚡ Supabase Edge Functions Deployment

The project includes Supabase Edge Functions in [`supabase/functions/`](file:///Users/paul/Documents/Shared/m1shared/agents/Echoes%20of%20the%20Past/geo-stories-eu-main/supabase/functions):

- `generate-story`: Generates multi-perspective AI historical narratives.
- `format-postcard-json`: Normalizes arbitrary JSON inputs into the platform's postcard schema.
- `generate-video`: Triggers AI video rendering operations.

To deploy Edge Functions to your Supabase project:

```bash
# Link to your Supabase project
npx supabase link --project-ref <your-project-ref>

# Deploy functions
npx supabase functions deploy generate-story
npx supabase functions deploy format-postcard-json
npx supabase functions deploy generate-video
```

---

## 📦 Project Structure

```
geo-stories-eu/
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/
│   │   ├── MapView.tsx          # Google Maps integration with clustering
│   │   ├── ImportDialog.tsx     # AI Vision & JSON import modal
│   │   ├── SmartTutor.tsx       # Floating AI Learning Assistant chatbot
│   │   └── SEO.tsx             # Dynamic meta tags & SEO management
│   ├── data/
│   │   ├── mock-data.json       # Historical postcard dataset
│   │   └── learning-content.ts  # MOOC modules, lessons, & quizzes
│   ├── pages/
│   │   ├── EOPHome.tsx          # Main interactive map & postcard gallery
│   │   ├── PostcardDetail.tsx   # Item details, AI stories & render generator
│   │   ├── LearnHub.tsx         # MOOC educational platform
│   │   ├── Settings.tsx         # API key & platform setup dashboard
│   │   └── NotFound.tsx         # 404 handler
│   ├── lib/
│   │   ├── ai-service.ts        # Unified AI text, image, audio, video handler
│   │   └── supabase-config.ts   # Supabase client & settings persistence
│   └── App.tsx                  # Main router & HelmetProvider wrapper
└── supabase/
    └── functions/               # Deno Edge Functions
```

---

## 🛠️ Building for Production

To build the static application bundle for production deployment:

```bash
npm run build
```

Production output will be compiled into the `dist/` directory, ready for hosting on static providers (GitHub Pages, Vercel, Firebase Hosting, Netlify).

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
