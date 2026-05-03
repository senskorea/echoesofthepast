# GeoStories — Mapping History, One Story at a Time

An immersive, map-based storytelling experience that brings historical postcards to life. Drop a pin, read the story.

## Tech Stack

- **Vite + React + TypeScript** — fast, modern frontend
- **Tailwind CSS + shadcn/ui** — design system
- **Google Maps API** — interactive map with marker clustering
- **Supabase Edge Functions** — AI story generation & JSON formatting
- **OpenAI API** — historical narrative generation

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A Google Maps API key (with Maps JavaScript API + Marker library enabled)
- An OpenAI API key (for AI story generation)
- A Supabase project

### Install & Run

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:8080**.

On first load you'll be prompted to enter your Google Maps API key — it is stored in `localStorage` for convenience.

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

For the Supabase Edge Functions, set `OPENAI_API_KEY` as a secret in your Supabase project dashboard.

## Project Structure

```
src/
├── components/
│   ├── MapView.tsx          # Google Maps integration with marker clustering
│   └── ImportDialog.tsx     # AI-powered JSON import dialog
├── pages/
│   ├── Index.tsx            # Main map view
│   ├── PostcardDetail.tsx   # Individual postcard & AI story page
│   └── NotFound.tsx
├── data/
│   └── mock-data.json       # Sample European historical postcards
└── types/
    └── postcard.ts          # Postcard type definition

supabase/functions/
├── generate-story/          # Generates AI historical narratives
└── format-postcard-json/    # Normalises arbitrary JSON into Postcard schema
```

## Importing Postcards

Click **Import Postcards** on the map view and paste any JSON containing postcard data. The AI will automatically extract and normalise the fields (title, description, image URL, coordinates) into the required format.

## Building for Production

```sh
npm run build
```

Output is placed in the `dist/` directory.
