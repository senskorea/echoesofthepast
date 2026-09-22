# Public launch readiness — 22 September 2026

**Local implementation complete for hosted verification; public central generation is not active.** The existing live Pages deployment has not been changed by this migration.

## Implemented locally

- Central gateway for text, analysis, JSON repair, images, narration, video and uploads. Private keys are read only from server secrets.
- Verified anonymous visitor JWTs; browser public keys are not accepted as visitor identities.
- PostgreSQL reservation ledger: per-action global and visitor daily allowances, concurrency controls, request reuse and ownership checks. Limits default to zero/disabled. Failed attempts count; uncertain paid operations are not automatically repeated.
- RLS and revoked client access on internal tables/RPC; server-owned storage paths. Public-by-link media notice is shown before upload.
- Video owner checks, persistent pending jobs, serialized polling, cached results and bounded Google-only download redirects without leaking provider keys.
- Retired legacy functions; deployment returns 410 from their old endpoints.
- Visitor credential forms removed, deployment-only configuration, friendly English/Romanian/French service errors, safer archive restore, page error recovery and storage-failure handling.
- Updated quick guide, README, environment templates and CI server type checking.

## Evidence and limits

50 tests pass, strict lint passes, frontend and Deno type checks pass, and the production build succeeds. SQL runs in PGlite with mock Supabase auth/storage schemas and roles. Handler/provider tests use mocks. Local browser checks verified Settings and the friendly disabled tutor response. This does **not** establish hosted Supabase RLS/storage integration, provider model access or successful live media generation.

The organisation in Brave is `teacherbgv's Org`. The project creation form is prepared as GeoStories in Frankfurt, automatic RLS enabled and automatic new-table exposure disabled. Password entry and submission remain with the user. The old local endpoint is unreachable; its values are preserved with services explicitly disabled.

## Remaining launch gates

1. User completes project creation; configure anonymous Auth and operator access.
2. Apply migration to the fresh project, verify actual grants/RLS/storage, run Supabase security advisors and deploy gateway plus legacy tombstones.
3. Set private provider secrets and approved per-action limits. Verify funded-account access to the exact model IDs. Configure the restricted Maps key.
4. Run bounded hosted smoke tests: unauthenticated/cross-session denial, duplicate requests, exhausted limits, file rejection, uploads, analysis, tutor, text, images, audio, video, playback, export and reload.
5. Set a storage/ledger retention policy and monitor usage. Media deletion breaks archive links; no automatic cleanup has been enabled. Set provider budgets as an additional safeguard; request allowances are not exact currency caps.
6. Update GitHub configuration, deploy frontend, verify clean-browser use without visitor keys and preserve existing local work.

Creations remain local/personal with a curated public catalogue. No shared publishing workflow was added. See [the deployment runbook](DEPLOYMENT.md) for cutover and rollback.
