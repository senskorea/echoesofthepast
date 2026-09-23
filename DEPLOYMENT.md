# Central service deployment

This runbook is for the operator, not visitors. Keep both service flags disabled until the hosted checks below pass. The migration targets a **fresh project**; an existing `postcards` bucket deliberately causes a conflict so its old policies cannot be silently inherited.

## 1. Create and connect the project

Complete the prepared Echoes project form in the selected Supabase organisation. Save its database password securely; never put it in Git or chat. Record the project reference. Enable anonymous sign-ins in Auth. Anonymous visitors need no email/password, but resetting browser data can create a new identity: global limits are essential. Review Auth rate limits. CAPTCHA is not integrated in this frontend; if required, integrate its token flow before enabling it in Auth.

Use the official CLI from the repository directory. Replace PROJECT_REF with the actual reference and complete authentication/password prompts privately:

```sh
supabase login
supabase link --project-ref PROJECT_REF
supabase db push --linked --dry-run
supabase db push --linked
```

Review the dry run before applying. Verify RLS and revoked grants on `generation_jobs` and `generation_limits`, service-role-only execution of `reserve_generation`, and no client write/list policies for the `postcards` bucket. Run the project's security advisors. Media retrieval by URL is public by design; prompts/results in the ledger are not client-readable.

## 2. Server secrets and functions

In Edge Function secrets set `GEMINI_API_KEY` and `OPENAI_API_KEY` as needed, `GENERATION_ENABLED=false`, and `ALLOWED_ORIGINS=https://senskorea.github.io`. Origins contain no route path. Add localhost only during testing. Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; never copy those private values into frontend configuration. See `supabase/functions/.env.example` for local function development.

```sh
supabase functions deploy ai-gateway generate-story generate-video analyse-postcard-image format-postcard-json --project-ref PROJECT_REF --use-api --import-map supabase/functions/deno.json
```

The gateway config disables legacy JWT verification at the platform layer because the function verifies every caller with `auth.getUser`. Do not remove that handler check. All four legacy endpoints are tombstones and must also be deployed to prevent old clients using the previous implementations.

## 3. Limits and hosted checks

All five action rows start disabled with zero allowance. After the operator chooses a budget, set `enabled`, `global_daily`, `visitor_daily` and `max_concurrent` for each desired action in `public.generation_limits`. Actions are text, image, audio, video and upload. Use separate low video limits. Do not enable a row without positive reviewed limits. Daily windows reset at UTC midnight. Failures count toward allowances, and concurrency leases expire after bounded intervals.

Limits count requests, not money. Provider model access/prices, anonymous account creation, storage and function invocation costs require monitoring too. Configure provider-side budgets where available. Establish a media/ledger retention policy before broad launch; no automatic deletion is configured, and deleting media breaks saved links. Do not delete active reservations or daily ledger rows to recover failed work: doing so can reopen allowances or duplicate paid jobs.

For a bounded smoke test, enable only the necessary action limits and set the server flag true. Set the local frontend flag true with the new public URL/key. Verify every existing generation type against funded accounts and supported models. Check unauthenticated and cross-session requests, duplicate IDs, quota exhaustion, invalid/oversized uploads, friendly failures, pending-video recovery, media playback and archive restoration. Confirm provider secrets never appear in browser responses, media URLs or the bundle. Turn the server flag off again if checks fail.

## 4. GitHub Pages cutover

Set repository Actions secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. These values are public in the built site, even though GitHub stores them as secrets.

For optional visitor analytics, create the organisation's GoatCounter site and set the repository variable `VITE_GOATCOUNTER_ENDPOINT` to its public endpoint, for example `https://echoes-of-the-past.goatcounter.com/count`. Do not store an analytics API token in GitHub or the website.

Set repository variables `VITE_AI_PROVIDER=gemini` (or `openai`) and `VITE_CENTRAL_SERVICES_ENABLED=true` only after hosted checks pass. Narration needs OpenAI and video needs Gemini regardless of this default. Merge the reviewed migration into main; the Pages workflow checks and deploys it. Verify direct routes, clean-browser anonymous use, English/Romanian/French errors and existing archives on the deployed URL.

For an incident, set the backend `GENERATION_ENABLED=false` to block new generation/uploads immediately. Existing video polling remains available to recover already-started work. Disable action rows as needed. Rebuild with the frontend flag false. Preserve reservations and existing media. Roll back frontend changes only while paid endpoints remain disabled; never restore the old permissive handlers. For complete function shutdown, disable access to the gateway at the platform layer as well.

## Echoes deployment record — 22 September 2026

Project `bnkzbmwhirmcixeaaipa` in Frankfurt is linked with CLI profile `echoes`. Gateway and four legacy tombstones are deployed. Both migrations are applied and recorded in `supabase_migrations.schema_migrations`. The installed CLI's legacy migration subcommands failed with a profile-format error; deployment used `db query --linked --profile echoes --file ...` and explicitly recorded the applied SQL using the CLI history schema. Do not reapply those migrations.

Anonymous Auth is enabled with user approval. Live smoke checks created a visitor session, denied visitor ledger access, rejected absent/public-key bearer sessions, and returned a friendly unavailable response with generation disabled. The dashboard-created RLS trigger's client execution grants were revoked after an advisor warning. The remaining advisor warning concerns leaked-password protection for email/password Auth; this platform uses anonymous sessions.

The operator approved **five AI requests per visitor per UTC day across creation types** and **EUR 50 per UTC day across all visitors**. `generation_budget` stores these values. Each AI call (including tutor, analysis and prompt preparation) reserves one request; one multi-step creation can therefore consume multiple requests. Uploads have a separate quota. The service reserves a conservative per-action upper cost before calling the provider; all `max_cost_eur` values remain zero and actions remain disabled until actual model prices, output bounds, exchange-rate allowance and fees are reviewed. This reservation ceiling is not a guarantee about hosting charges or provider billing; configure provider caps as well. Anonymous visitors can reset their identity; the shared budget cannot be reset that way.

Public URL/key are saved in the ignored local `.env`. GitHub configuration and live Pages are unchanged. Provider secrets, per-action cost bounds, paid smoke tests and final frontend cutover remain pending.

### Gemini credential verification

On 22 September 2026, `GEMINI_API_KEY` was confirmed present by secret name/digest only. A single bounded text request through the deployed gateway using an anonymous session and `gemini-3.6-flash` returned HTTP 200 and `Connection successful`. Only text was temporarily allowed, with a global one-request ceiling and a conservative EUR 5 reservation (not the actual charge). The server kill switch and text action were disabled again afterwards. The test reservation is retained for accounting. Images/video and OpenAI remain unverified; paid production activation is still pending.

### Staged public release — 22 September 2026

Live text, multimodal postcard description, upload/storage retrieval, saved creation reload, duplicate-request caching and the five-request visitor limit passed. A sixth request returned 429 without paid work. Images and Veo each reached their provider and returned quota errors; no generated media or video playback was verified. No OpenAI key is present. Image, video and audio rows are disabled; frontend medium flags default false and show translated unavailable notices. A transient text failure showed a friendly message; a changed request subsequently succeeded.

Enabled text reserves EUR 0.25 per request, with total Gemini input capped at 32,768 tokens and output capped at 2,000 including thinking. Google's published rate is USD 0.75/3.75 per million input/output tokens through 2026, then USD 1.50/7.50; even the latter gives USD 0.064152 before currency/tax allowance. The EUR 0.25 reservation includes a conservative margin. Image is bounded to 1 candidate, 1K resolution and 8,192 output tokens with a EUR 1.50 reservation, and video to 4 seconds/720p with EUR 3 reserved; both remain disabled. Review these margins when prices, taxes or exchange rates change. Source: https://ai.google.dev/gemini-api/docs/pricing . No tools/search grounding are enabled.

The global row allows EUR 50 in reservations daily across visitors; failures retain reservations, so service may stop earlier than actual spending warrants. This does not cap unrelated account activity, exchange-rate extremes, taxes outside the margin or hosting bills. Text also has a 200-request global daily ceiling. Uploads: 5 per visitor and 100 globally daily, JPEG/PNG/WebP only, maximum 5 MiB. Anonymous identity is browser-based and can be reset; only the shared budget resists that bypass.

Set GitHub variables `VITE_IMAGE_ENABLED`, `VITE_VIDEO_ENABLED`, `VITE_NARRATION_ENABLED`, `VITE_OPENAI_ENABLED` to true only after their respective service tests pass and matching backend limits are enabled. The current release sets all four false. The Gemini-only model selector avoids offering unfunded OpenAI models.

## Map tiles

The map uses Leaflet and OpenStreetMap standard tiles, with visible attribution and normal browser caching. No map API key is required. Do not add bulk downloads, offline prefetching, or a no-referrer policy for tile requests. Review https://operations.osmfoundation.org/policies/tiles/ before scaling traffic; the community tile service has no availability guarantee.
