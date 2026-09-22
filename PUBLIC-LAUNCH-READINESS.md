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

52 tests pass, strict lint passes, frontend and Deno type checks pass, and the production build succeeds. SQL runs in PGlite with mock Supabase auth/storage schemas and roles. Handler/provider tests use mocks. Local browser checks verified Settings and the friendly disabled tutor response. This does **not** establish hosted Supabase RLS/storage integration, provider model access or successful live media generation.

The organisation in Brave is `teacherbgv's Org`. Echoes is now provisioned and Healthy in Frankfurt, reference `bnkzbmwhirmcixeaaipa`. The local URL has been updated; its public key is configured and services remain disabled. CLI profile `echoes` is connected. Both migrations and all five functions are deployed; anonymous sessions are enabled. See DEPLOYMENT.md for live check evidence and the approved five-request / EUR 50 budget configuration.

## Remaining launch gates

1. Completed: project creation, anonymous Auth and operator access.
2. Completed: schema, grants/RLS checks, gateway and legacy tombstones. Advisor helper-function warnings fixed; email/password leaked-password protection warning remains (unused by this app).
3. Set private provider secrets and approved per-action limits. Verify funded-account access to the exact model IDs. Configure the restricted Maps key.
4. Run bounded hosted smoke tests: unauthenticated/cross-session denial, duplicate requests, exhausted limits, file rejection, uploads, analysis, tutor, text, images, audio, video, playback, export and reload.
5. Set a storage/ledger retention policy and monitor usage. Media deletion breaks archive links; no automatic cleanup has been enabled. Set provider budgets as an additional safeguard; request allowances are not exact currency caps.
6. Update GitHub configuration, deploy frontend, verify clean-browser use without visitor keys and preserve existing local work.

Creations remain local/personal with a curated public catalogue. No shared publishing workflow was added. See [the deployment runbook](DEPLOYMENT.md) for cutover and rollback.
