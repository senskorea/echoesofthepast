# AI recovery audit — 22 September 2026

## Verified

- 76 automated tests pass; lint, frontend build/type checking and server type checking pass.
- Live CORS preflight: 204 for the published origin.
- Live request without visitor session: rejected with 401.
- Live anonymous visitor session: 200.
- Live Gemini text generation: 200 with text.
- Same request ID replay: 200 with saved text, using the existing reservation.
- Database configuration: five AI requests per visitor per UTC day and EUR 50 shared daily reservation ceiling.

## Fixes

- A confirmed failed job returns a terminal flag on its first response, allowing a deliberate retry without an extra round trip to rediscover the failed job.
- Pending video reservations return busy until a provider operation is stored.
- Malformed success responses keep their request ID, protecting uncertain work from duplicate requests.
- Tutor prompts are restored after errors. Failed turns are excluded from AI history so retrying an unchanged question preserves its original request identity.
- Tutor history and question length are bounded to fit the gateway input limit.
- The recorded walkthrough is labelled as an older version; its setup quiz now points to the current Learn guide. Visitors are not asked for API keys.

## Recovery coverage

Tests cover HTTP 429/500/502/503/504, provider response redaction, interrupted connections, cached and pending jobs, malformed responses, explicit retries, text/image/audio/video adapter responses, access checks, media URL restrictions, and the quota ledger.

## Operational limits

Text, tutor and uploads are enabled. Image and video remain disabled pending provider quota verification; narration requires its server-side OpenAI key. Successful mocked media tests do not establish paid-provider availability.

There are no automatic paid generation retries or unverified model switches. Failed reservations still count toward allowances because providers may have processed a request. Visitors who reach a limit must wait for the UTC reset. Provider outages and previously uncertain pending jobs cannot be guaranteed to recover automatically.

An already-open tab continues running its loaded build until refreshed. Refresh existing tabs after deployment; browser-local saved work is retained. This audit is a bounded readiness check, not a guarantee that every external service will remain available.
