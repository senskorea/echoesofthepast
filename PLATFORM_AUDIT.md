# Echoes of the Past — platform audit

Audit date: 12 September 2026. Scope: this local checkout, source inspection, local browser smoke checks, production build, TypeScript, lint, and isolated reproductions. No production settings were changed and no paid AI generation was invoked. Deployed Supabase policies, secrets, function configuration, and live provider access were not inspected.

> **Remediation update — 12 September 2026:** The source findings below have been addressed in this checkout: video retrieval now keeps Gemini credentials in request headers and returns a credential-free stored URL; Edge Functions require the caller's provider key; current model adapters are configured; subpath resources and SPA fallback are fixed; catalogue deletions, validation, backup coverage, storage errors, published learning scope, tutor context, quiz persistence, type checking, lint, tests, and vulnerable dependencies have been repaired. The original findings remain below as the evidence that motivated the changes. Deployed Supabase policies still need to match the restricted-upload guidance, and live paid-provider calls were not made during remediation.

## What the platform does

Echoes of the Past / GeoStories is a cultural heritage education and creation platform. Its central object is a historical postcard: an image, title, description, location, optional reverse-side images, and optional AI-extracted information. A learner or archivist can browse a map or gallery, add a postcard, use AI to interpret it, and create educational or imaginative material around it.

The intended audience includes educators, heritage practitioners, and learners developing digital skills. The tutor instructions explicitly mention youth, NEETs, and refugees within an Erasmus+ digital inclusion mission.

The user journey is:

1. **Explore:** search the gallery by title, description, coordinates, or extracted text; switch to a Google map with clustered markers; open a postcard.
2. **Contribute:** upload and crop a front image, add secondary images, enter metadata manually, or request AI transcription, description, and approximate geolocation. JSON import is another entry path.
3. **Create:** select an output medium, a template, and a model; refine the prompt; generate and optionally save or download the output. Presets cover historical narratives, architectural illustrations, audio tours, fictional time-capsule letters, cinematic videos, historical reimaginings, OCR, sentiment analysis, museum labels, and custom work.
4. **Learn:** access lessons, embedded videos, transcripts, interactive quiz feedback, and manually tracked completion. A floating AI tutor provides conversational assistance.
5. **Configure and transfer:** supply Maps, OpenAI, Gemini, and Supabase settings; customize tutor instructions; export/import archives and saved assets.

The supplied catalogue contains **9 distinct postcards**: 4 bundled sample records and 5 public JSON records. All nine have valid coordinates; all referenced local images exist. This is a small starter collection, mainly Romanian and French locations plus Los Angeles.

## Architecture and actual persistence

| Layer | Implementation | Consequence |
|---|---|---|
| Interface | React 18, TypeScript, Vite, Tailwind, shadcn/ui | Static browser application |
| Routes | `/`, `/postcards/:id`, `/learn`, `/settings` | No sign-in or role-gated contributor workflow found |
| Catalogue | Bundled JSON + public JSON + browser overrides | Imports and edits are private to that browser; they do not update a shared catalogue |
| Images | Public files and Supabase Storage uploads | Uploaded image files can be remote while their postcard metadata remains local |
| Generated assets | Separate localStorage keys per postcard/template | No server archive, version history, or cross-device synchronization in this flow |
| AI | Mostly direct browser requests to OpenAI/Gemini; video through a Supabase function | User-supplied credentials are integral to the experience |
| Learning | Static curriculum, local completion, in-memory quiz answers | No durable learner account or assessed credential system |
| Legacy ingestion | Two CommonJS scripts using absolute paths to another local EOP archive | Dataset refresh depends on Paul's filesystem and is outside the normal build |

Supabase is used for storage and functions, but the active catalogue flow does not read/write postcard database rows. React Query is installed and mounted, but the main archive loader uses an effect and manual merging.

## Priority findings

### 1. High — video responses expose an API credential

`supabase/functions/generate-video/index.ts:94` appends the resolved Gemini key to the video URL and returns it to the caller. The key can be supplied by the browser or fall back to `GEMINI_API_KEY` on the server (`:25`). Saving/exporting that video retains the credential-bearing URL through `PostcardDetail.tsx:495` and `:504`.

**Verified:** executed the actual handler with a fake secret and mocked upstream response; the returned URL contained the fake secret. No real secret was read or transmitted. Server-secret exposure in production depends on that fallback being configured and the endpoint being reachable; the normal UI currently insists on a client Gemini key.

**Action:** retrieve video bytes on the server and persist them to controlled storage; return a credential-free asset URL. Review any existing shared video exports for keys.

### 2. High — paid backend operations have no application-level user authorization or quotas

The supplied generation/formatting handlers can use server AI secrets but contain no signed-in-user verification, ownership checks, or per-user rate limits. Browser function calls send the project key, not a user session. Settings instructions also recommend anonymous storage uploads using a permissive policy (`src/pages/Settings.tsx:32`).

**Impact:** if deployed with the supplied public-access pattern and server secrets, callers can potentially consume project AI/storage resources. This is a deployment risk established from source, not a confirmed exploit against the live project. Gateway JWT validation is not equivalent to user authorization when a public legacy anon JWT is accepted. Supabase documents separate user-session and publishable-key authentication patterns in its [function security guidance](https://supabase.com/docs/guides/functions/auth).

**Action:** define the intended public/contributor access model, enforce it in functions and storage policies, and add usage limits before public operation.

### 3. High — configured Google models have passed their shutdown dates

`src/lib/ai-models.ts:29` makes `gemini-2.0-flash` the first Gemini text option; the tutor automatically chooses the first matching model. The image option at `:50` is `imagen-4.0-generate-001`. Google's current [deprecation schedule](https://ai.google.dev/gemini-api/docs/deprecations) lists shutdown dates of 1 June 2026 and 17 August 2026 respectively.

**Impact:** valid credentials alone will not restore these selected generation paths. This was verified against provider documentation, not a paid live call.

**Action:** update the model catalogue and provider-specific request/response adapters together; switching from Imagen to Gemini image generation needs an API-format change, not just a renamed ID.

### 4. High for subpath hosting — production asset paths conflict

`vite.config.ts:6` builds for `/echoesofthepast/`, but `src/lib/data-loader.ts:9` requests `/eop-postcards.json`. Public postcard image paths likewise start with `/eop-images/`.

**Impact:** on a deployment confined to the configured subdirectory, requests go to the domain root. The public catalogue can disappear into the sample-data fallback and images can break. There is also no supplied GitHub Pages SPA fallback despite the `gh-pages` deployment script, so direct nested-route navigation needs hosting support.

**Action:** resolve public resources against `import.meta.env.BASE_URL` and align router/hosting fallback configuration with the actual deployment target. This is source-confirmed; live hosting behavior was not tested.

### 5. Medium — deleted bundled postcards reappear

`src/pages/EOPHome.tsx:64` saves the filtered array. `src/lib/data-loader.ts` reconstructs the bundled catalogue on every load and then applies local records as additions/overrides. Absence from the local array does not mean deletion.

**Verified:** ran the actual loader with a simulated deletion; the deleted record returned.

**Action:** persist deleted IDs or adopt a single authoritative catalogue with explicit deletion semantics.

### 6. Medium — bulk backup can miss saved work

`src/pages/Settings.tsx:315` exports only records already present in `geostories-postcards`, whereas saving a generated asset in `src/pages/PostcardDetail.tsx:495` writes only an asset key. A user can generate and save work against a bundled postcard without ever creating the catalogue storage key. Bulk export then says “Nothing to export yet,” or skips that postcard if it is absent from the stored array.

Assets also use mixed persistence: text/data URLs in localStorage versus remote image/video URLs. The latter are references rather than a self-contained media backup. Uncaught storage-quota failures are possible when saving large base64 media.

**Action:** export the merged catalogue and all associated assets, and use durable media storage with explicit save-failure handling.

### 7. Medium — imports lack schema validation

`src/components/ImportDialog.tsx:509` accepts the formatter output or arbitrary parsed JSON without validating postcard fields. Settings restoration has a similar gap. The loader also assumes parsed localStorage is an array.

**Verified:** the actual loader throws `userPostcards.forEach is not a function` for valid JSON `{}` in the catalogue key. Wrong field types can subsequently break search or map rendering.

**Action:** validate array shape, IDs, strings, coordinate ranges, and image URLs before committing data; preserve existing valid data on failure. Zod is already a dependency.

### 8. Medium — learning scope is overstated and tutor context is disconnected

The fifth module, Case Studies, has empty lessons and quizzes (`src/data/learning-content.ts:595`). Completion is a manual toggle independent of quiz performance. No certificate issuance implementation was found despite the README claim. Quiz answers are not persisted.

`src/App.tsx:33` mounts `<SmartTutor />` without the `currentModule` prop its implementation expects, so its prompt reports “Main Dashboard” even while a learner is inside a module.

**Action:** complete module five, connect selected-module context, and align completion/certificate claims with the intended educational requirements.

## Product and maintainability observations

- The concept is coherent: the archive supplies material for both creative production and practical AI education.
- The image “actual source” option first describes the postcard with a vision model and then performs text-to-image generation. It does not pass the original image to an image-editing model; fidelity should be presented accordingly.
- Historical prompts encourage factual detail without source retrieval or citation tracking. Preserve source provenance and distinguish verified metadata from inferred history and imaginative reconstruction.
- The postcard type has no dedicated provenance, rights-owner, confidence, or review-status fields. Export currently attaches the same license string to every card; preserve item-specific rights metadata rather than treating one export label as provenance.
- English/Romanian/French navigation exists, but substantial studio/settings/learning text is hardcoded English.
- Learners must navigate several provider credentials and configuration concepts. That setup burden is substantial for the stated digital-inclusion audience.
- The README describes localStorage key handling as “secure.” The implementation is readable browser storage, not an encrypted credential vault.
- Older pages/components and multiple Supabase client modules coexist with the active routes, increasing the chance of documentation and integration drift.

## Verification results

| Check | Result |
|---|---|
| `npm run build` | Pass; production bundle generated |
| `npm run typecheck` | Pass |
| `npm run lint -- --max-warnings=0` | Pass |
| `npm test` | Pass: 10 tests |
| `npm audit` | Pass: 0 known vulnerabilities |
| Local browser homepage | Pass: 9 catalogue entries |
| Local browser search | Pass: “Ateneul” returns 1 of 9 |
| Postcard studio and Learn navigation | Pass: pages and main controls load |
| Bundled data integrity | 9 distinct IDs; valid coordinates; no missing referenced local image files |
| Deletion reproduction | Fail: bundled item returns on next load |
| Malformed storage reproduction | Fail: non-array JSON crashes loader |
| Video handler with mocks | Fail: fake server key included in response URL |

The build script now runs TypeScript checking, and focused regression tests cover data validation, catalogue deletion, archive assets, provider request handling, and video URL credential safety. Map rendering with credentials, uploads, paid generation, external lesson playback, and live infrastructure access controls remain unverified.

Recommended sequence: fix credential-bearing video URLs and backend access controls; refresh model integrations and hosting paths; repair deletion, import validation, and backups; then complete the learning experience and establish passing type/lint checks plus focused workflow tests. Decide whether this remains a browser-local teaching tool or becomes a shared archive before adding account and database infrastructure.
