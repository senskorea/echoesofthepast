# GeoStories implementation plan

Status: central gateway, anonymous sessions, quota ledger, controlled media storage, friendly errors, and visitor Settings changes are implemented locally. Live activation remains pending project creation, credentials, approved limits and hosted verification. See [launch readiness](PUBLIC-LAUNCH-READINESS.md) and [deployment guide](DEPLOYMENT.md).

## Outcome and scope

Visitors can browse, learn and use the existing creation tools online without entering API keys or setting up cloud accounts. The organisation configures and pays for shared services once. Preserve existing features; do not add a new dashboard, login flow, analytics service or publishing workflow as part of this work.

GitHub remains the public source repository and GitHub Pages remains the website host. Supabase is the approved backend. The organisation open in Brave has no projects yet; a project must be provisioned before live configuration.

## Baseline findings before implementation

- `.env` and `README.md` already exist. Preserve existing local values rather than overwriting them.
- `.env` contains Supabase configuration but no Maps key. The configured Supabase hostname does not resolve as of 22 September 2026.
- The README has outdated Node/Vite information, a placeholder repository URL, a machine-specific link, and setup guidance that does not distinguish the existing implementation from the desired central service setup.
- AI text, images, narration and import analysis use visitor credentials. Video and JSON formatting also pass visitor keys to backend functions. Adding a Gemini key to `.env` alone will not centralise these paths.
- The catalogue combines bundled files with browser-local changes. Uploading image files does not publish a postcard to everyone's catalogue. Learning progress and generated assets are also browser-local; preserve and explain this behaviour unless shared publishing is separately requested.
- Several UI paths expose raw provider errors or tell visitors to configure Supabase/API keys. The tutor also reproduces raw errors in its chat response.

## 1. Confirm deployment inputs

Required for live activation:

- Provision an organisation-owned Supabase project in the selected organisation and record its reference and region.
- Supply backend access and provider secrets through the selected hosting service's secret settings, not through chat or Git.
- Confirm which existing generation types the funded provider account supports. Narration currently uses OpenAI; preserve it with a central OpenAI key or migrate its implementation if Gemini-only operation is selected.
- Set operator-approved usage limits, including video. No unlimited public paid endpoint.
- Confirm the domain for launch. Keep the current GitHub Pages address working; activate `geostories.eu` only with verified domain/DNS access.

No visitor account requirement is introduced by this plan. Use a server-issued anonymous session if needed to associate work and enforce quotas; its abuse limitations must be accounted for by global limits as well.

## 2. Correct environment setup

- Update the existing ignored `.env` without destroying existing values. Keep `.env.example` free of credentials, with supported variable names and clear comments.
- Frontend configuration contains only public service endpoints, the Supabase publishable key if retained, and the domain-restricted Google Maps browser key. Never add a `VITE_GEMINI_API_KEY`, `VITE_OPENAI_API_KEY` or service-role secret.
- Store AI secrets in the backend environment. Provide a separate backend example file only after selecting the runtime, and wire every documented variable to real code.
- Distinguish local startup from online deployment: a local `.env` is not uploaded to GitHub Pages. Configure the existing Actions workflow with the public build settings, and configure server secrets separately.
- Make deployment-owned configuration authoritative for the public site; old browser settings must not silently route requests to a different backend.
- Missing configuration should produce an unavailable-service state, not crash the gallery or lessons or solicit a key from a visitor.

Acceptance: a new checkout can run the catalogue and learning hub from documented commands; a fresh production browser receives the operator-configured services without local setup.

## 3. Centralise the existing service calls

- Move provider requests out of the browser, covering text, images, audio, video generation/polling, postcard analysis, JSON formatting, prompt polishing and the tutor.
- Update both `src/lib/ai-service.ts` and the separate direct requests in `src/components/ImportDialog.tsx`. Remove local key gates in `src/pages/PostcardDetail.tsx` and credential dependence in `src/lib/supabase-config.ts`.
- Select/allow models on the server and validate request types, prompts, file sizes and image formats. Reject unexpected upstream URLs and unrecognised operations.
- Implement durable per-session and global quotas, concurrency limits and an operator-controlled shutdown switch. Reject paid work if quota enforcement is unavailable. Origin checks and public client keys are not authorisation.
- Make generation initiation idempotent so retrying an uncertain request does not create duplicate paid work. Associate video jobs with the initiating session and return stored public media URLs without credentials.
- If moving away from Supabase, replace its storage and function dependencies together. Configure public image reading and controlled writes; do not enable unrestricted anonymous uploads as a shortcut.

Acceptance: all existing service flows work with an empty browser profile. Provider keys appear in neither frontend bundles, browser requests/responses, saved assets, exports nor diagnostic messages. Quota and ownership checks are exercised against the backend.

## 4. Remove visitor infrastructure setup

- Remove provider key fields, connection tests, personal-provider setup guides and Supabase configuration from public Settings. Preserve existing local archive import/export and relevant user preferences.
- Configure Maps once with domain/API restrictions; replace its key-entry prompt with a friendly availability message and a Gallery action.
- Update the tutor's default instructions so it helps people use the platform rather than set up API providers.
- Explain local saving where it matters. Do not label a locally saved postcard as published for everyone.
- Keep loading indicators and button states clear during uploads and generation; prevent duplicate submissions and restore controls after failure.

Acceptance: no visitor flow directs people to obtain credentials or create cloud accounts. Existing content stays usable when AI, storage or Maps is unavailable.

## 5. Friendly, consistent errors

Implement a shared error mapping used by import, generation, tutor, Maps, saves, restore/export and page loading. Backend errors return a stable code, retryability and an optional safe request reference. The UI translates those codes into a short explanation and a useful next action rather than displaying raw exception strings.

| Situation | Example visitor message | Recovery |
| --- | --- | --- |
| Network request fails | “We couldn't connect. Check your connection and try again.” | Keep the draft; offer Retry where safe. |
| AI service unavailable or operator credentials invalid | “Story creation is temporarily unavailable. Please try again later. You can still browse the archive.” | Preserve input; keep browsing available. |
| Rate limit | “You've made several requests in a short time. Please wait a moment before trying again.” | Respect the server's retry delay; show a countdown only when known. |
| Global usage limit | “Creation is paused for now because the platform has reached its usage limit. You can still explore the archive and lessons.” | No repeated retry loop; do not invent a reset time. |
| Upload fails | “We couldn't upload this image. Please try again.” | Retain the selected file while the dialog remains open. |
| Unsupported/oversized file | “This image couldn't be uploaded. Choose a supported image within the size limit.” | Show the actual supported formats and limit beside the field. |
| Invalid archive | “This file isn't a supported GeoStories backup. Please choose an exported JSON backup.” | Show the relevant field/record issue in plain language; leave existing data intact. |
| Video still processing after timeout | “Your video is taking longer than expected. Check its progress again shortly.” | Resume status checks for the same job, not a new paid generation. |
| Generation refused by provider | “We couldn't create this result from that request. Try changing the description or image.” | Keep the request editable; don't retry automatically. |
| Browser storage full/unavailable | “We couldn't save this in your browser. Export your work before closing this page.” | Offer export when the work is still available in memory. |
| Map cannot load | “The map is unavailable right now. You can still explore the postcards in Gallery.” | Open Gallery. |
| Unexpected page failure | “This page couldn't be displayed. Try reloading it or return to the archive.” | Error boundary with Reload and Return to archive actions. |

Rules:

- Say what happened and what the user can do. Do not blame visitors for operator configuration problems.
- Never claim a draft is saved, a job has failed, or the team has been notified unless the application knows that is true.
- Use inline field messages for validation, persistent messages for blocked work, and accessible announcements. Do not rely only on short-lived toasts or colour.
- Preserve entered text and selected files where possible. Make retries explicit; automatically retry only safe transient reads/status checks with bounded backoff.
- Keep technical diagnostics in redacted server logs, with a safe request reference for investigation. Do not log credentials, full prompts, private uploads or raw provider responses by default.
- Translate shared messages into the existing English, Romanian and French interface. Verify keyboard operation, screen-reader announcements and mobile layout.

Acceptance: simulate offline use, 400/401/403/413/429/5xx responses, malformed provider output, blocked local storage and timeouts. Each produces the correct explanation and recovery without losing work or duplicating generation charges.

## 6. Rewrite the README as the Getting Started guide

Use `README.md` for operator setup. The visitor quick guide is already deployed in the Learning Hub in English, Romanian and French; update its service availability text after successful cutover.

Include:

- What GeoStories does, its live site and real repository URL.
- Supported Node version based on the installed Vite release and CI configuration, `npm ci`, safe `.env` setup and `npm run dev`.
- A feature/configuration table separating what works without services from what needs the centrally configured backend.
- Public frontend environment variables versus private backend secrets, with examples containing no credentials.
- Exact deployment instructions for the selected backend and existing GitHub Pages workflow, including the production base path and custom-domain prerequisites.
- Basic visitor steps: browse, search, view a postcard, use lessons, create/save/export; explain browser-local persistence and backups.
- Troubleshooting using the friendly errors, plus separate operator diagnostics for unreachable services and configuration problems.
- Tests, lint, type check, production build, limitations and verified deployment status. Use repository-relative links, not local machine paths.

Acceptance: follow the instructions in a clean setup and verify every documented command and setting. Do not claim central services work until the live smoke test passes.

## 7. Verify and release

1. Add focused tests for configuration precedence, the server adapter, error mapping, quotas, video ownership and idempotency.
2. Run existing tests, strict lint, type checking and the production build.
3. Deploy/configure the chosen backend first. Check connectivity, storage access and secrets without printing secret values.
4. Run bounded live tests for upload, analysis, text, image, narration, video and tutor within the approved usage limits. Provider-mocked tests alone are insufficient for a full functionality claim.
5. Verify the frontend on a clean browser profile, mobile layout and all supported languages. Check deep links, local save/reload and backup/restore as well as normal browsing.
6. Scan the production output and network responses for provider credential leakage.
7. Publish the frontend only after the backend works. Verify GitHub Actions, the live URL, and the recovery paths. Retain the previous release for rollback and document any untested or blocked integrations.

## Work order

Start with the README corrections, environment inventory and shared error handling. Resolve backend selection in parallel with that work. Then implement the central adapters and storage, remove visitor configuration, complete integration tests, and publish. Do not switch the public frontend to an unconfigured backend.

Completion means the public app works without visitor API keys, existing flows have been exercised, errors are understandable and recoverable, and the README accurately reproduces the setup. An `.env` file or a successful static build alone is not completion.
