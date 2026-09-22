# Central service deployment

This runbook is for the operator, not visitors. Keep both service flags disabled until the hosted checks below pass. The migration targets a **fresh project**; an existing `postcards` bucket deliberately causes a conflict so its old policies cannot be silently inherited.

## 1. Create and connect the project

Complete the prepared GeoStories project form in the selected Supabase organisation. Save its database password securely; never put it in Git or chat. Record the project reference. Enable anonymous sign-ins in Auth. Anonymous visitors need no email/password, but resetting browser data can create a new identity: global limits are essential. Review Auth rate limits. CAPTCHA is not integrated in this frontend; if required, integrate its token flow before enabling it in Auth.

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
supabase functions deploy ai-gateway generate-story generate-video analyse-postcard-image format-postcard-json --project-ref PROJECT_REF --use-api
```

The gateway config disables legacy JWT verification at the platform layer because the function verifies every caller with `auth.getUser`. Do not remove that handler check. All four legacy endpoints are tombstones and must also be deployed to prevent old clients using the previous implementations.

## 3. Limits and hosted checks

All five action rows start disabled with zero allowance. After the operator chooses a budget, set `enabled`, `global_daily`, `visitor_daily` and `max_concurrent` for each desired action in `public.generation_limits`. Actions are text, image, audio, video and upload. Use separate low video limits. Do not enable a row without positive reviewed limits. Daily windows reset at UTC midnight. Failures count toward allowances, and concurrency leases expire after bounded intervals.

Limits count requests, not money. Provider model access/prices, anonymous account creation, storage and function invocation costs require monitoring too. Configure provider-side budgets where available. Establish a media/ledger retention policy before broad launch; no automatic deletion is configured, and deleting media breaks saved links. Do not delete active reservations or daily ledger rows to recover failed work: doing so can reopen allowances or duplicate paid jobs.

For a bounded smoke test, enable only the necessary action limits and set the server flag true. Set the local frontend flag true with the new public URL/key. Verify every existing generation type against funded accounts and supported models. Check unauthenticated and cross-session requests, duplicate IDs, quota exhaustion, invalid/oversized uploads, friendly failures, pending-video recovery, media playback and archive restoration. Confirm provider secrets never appear in browser responses, media URLs or the bundle. Turn the server flag off again if checks fail.

## 4. GitHub Pages cutover

Set repository Actions secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_GOOGLE_MAPS_API_KEY` (the latter restricted to the Pages domain and Maps JavaScript API). These values are public in the built site, even though GitHub stores them as secrets.

Set repository variables `VITE_AI_PROVIDER=gemini` (or `openai`) and `VITE_CENTRAL_SERVICES_ENABLED=true` only after hosted checks pass. Narration needs OpenAI and video needs Gemini regardless of this default. Merge the reviewed migration into main; the Pages workflow checks and deploys it. Verify direct routes, clean-browser anonymous use, English/Romanian/French errors and existing archives on the deployed URL.

For an incident, set the backend `GENERATION_ENABLED=false` to block new generation/uploads immediately. Existing video polling remains available to recover already-started work. Disable action rows as needed. Rebuild with the frontend flag false. Preserve reservations and existing media. Roll back frontend changes only while paid endpoints remain disabled; never restore the old permissive handlers. For complete function shutdown, disable access to the gateway at the platform layer as well.
