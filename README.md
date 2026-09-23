# GeoStories — Echoes of the Past

Explore historical postcards, learn about AI and cultural heritage, and create stories and media from archival material.

- [Public website](https://senskorea.github.io/echoesofthepast/)
- [Learning Hub and quick guide](https://senskorea.github.io/echoesofthepast/learn)
- [Source repository](https://github.com/senskorea/echoesofthepast)

## Status

The central backend is deployed to Echoes and access checks pass. **Central text, tutor and uploads are enabled in this release. Image/video are unavailable pending Google quota resolution; narration needs the OpenAI key.** GitHub Pages hosts the website; organisation-managed Supabase handles visitor sessions, AI requests and media storage. Visitors do not supply API keys. The service permits five AI requests per browser visitor per UTC day, with a shared EUR 50 daily reservation allowance. See [deployment instructions](DEPLOYMENT.md) and [readiness evidence](PUBLIC-LAUNCH-READINESS.md).

## Run locally

Use Node.js 22.12 or newer in the Node 22 release line and npm.

```sh
git clone https://github.com/senskorea/echoesofthepast.git
cd echoesofthepast
npm ci
# Preserve existing configuration.
test -f .env || cp .env.example .env
npm run dev
```

Open the address printed by Vite, normally `http://localhost:8080`. The bundled gallery, search, lessons and quizzes work without cloud credentials. External lesson videos need internet access.

## Configuration

Set these in the ignored root `.env`, then restart Vite:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Organisation's Supabase endpoint. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public project key. |
| `VITE_CENTRAL_SERVICES_ENABLED` | `false` until hosted service checks pass. |
| `VITE_IMAGE_ENABLED`, `VITE_VIDEO_ENABLED`, `VITE_NARRATION_ENABLED`, `VITE_OPENAI_ENABLED` | Enable only verified, funded media/providers; default false. |
| `VITE_AI_PROVIDER` | `gemini` by default, or `openai`. |
| `VITE_GOATCOUNTER_ENDPOINT` | Optional public GoatCounter endpoint, such as `https://echoes-of-the-past.goatcounter.com/count`. |


**Every `VITE_` value is public in the website bundle.** Gemini, OpenAI and service-role secrets belong only in the backend. Old browser API settings are ignored. Narration uses OpenAI; video uses Gemini, regardless of the selected default provider.

### Optional privacy-friendly analytics

The public website can use [GoatCounter](https://www.goatcounter.com/), a lightweight privacy-friendly analytics service. Create the organisation's GoatCounter site, then add its public `/count` endpoint as the GitHub repository variable `VITE_GOATCOUNTER_ENDPOINT`. The application tracks page views across its single-page routes, including postcards and lessons. No analytics code loads when this value is blank; never add a GoatCounter API token to the frontend or repository variables.

## Your work

Edits, saved creations and lesson progress stay in this browser. They do not automatically appear in everyone's catalogue or sync between devices. Select **Save to Creations** to retain a result and **Download File** for a device copy. Use **Settings → Your work & backups** to download or restore an archive before clearing browser data. Learning progress is not included in that archive.

Uploaded and generated media are stored in a public-by-link bucket. Only upload material you may share. An archive contains media links, so download important media separately for an independent backup. A private-media or shared-publication workflow is outside this migration.

## Verify

```sh
npm test
npm run lint -- --max-warnings=0
npm run typecheck:server
npm run build
npm run preview
```

Tests cover frontend failures, request reuse, provider adapters, handler access checks and a PostgreSQL quota ledger using PGlite. They do not replace deployed Supabase policy checks or paid-provider smoke tests. Production preview uses `/echoesofthepast/` and includes a static SPA fallback.

## Troubleshooting

- **Creation temporarily unavailable:** the operator must configure or restore the shared service; visitors do not need API keys.
- **Daily allowance reached:** wait for the next UTC day. Failed requests can consume allowance because a provider may have processed them.
- **Video takes too long:** use **Check video progress** to check the existing job. Do not repeatedly start new jobs.
- **Browser cannot save:** download your work before freeing browser storage. Import validates the full archive before applying changes.
- **Map images unavailable:** check your internet connection. The map uses Leaflet with OpenStreetMap tiles and needs no API key. Markers and the gallery remain available if tile loading fails.
- **Local changes missing elsewhere:** work is browser-local. Export and import to transfer it.

## Deployment

Pushes to `main` deploy the frontend using [GitHub Actions](.github/workflows/pages.yml). Supabase deployment is separate. Follow [DEPLOYMENT.md](DEPLOYMENT.md) before enabling services. Local `.env` files are never uploaded by Git. The Pages base path comes from the workflow; use `VITE_BASE_PATH=/ npm run build` for a separate root-domain build.

See [LICENSE](LICENSE).
