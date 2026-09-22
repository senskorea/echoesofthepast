# Public launch readiness — 22 September 2026

**Staged release: text, tutor and uploads verified; image, video and narration unavailable.**

53 tests, strict lint, frontend and server type checks and production build pass. Hosted checks verified anonymous Auth, internal-table and RPC access denial, five-request limit, duplicate text request caching, upload/storage retrieval and text generation. Browser testing verified multimodal postcard generation, Save to Creations, reload persistence and French unavailable messaging.

The Echoes project (`bnkzbmwhirmcixeaaipa`, Frankfurt) contains both recorded migrations and all five deployed functions. Automatic-RLS helper grants were restricted; the advisor's remaining leaked-password warning concerns unused email/password authentication. Limits are five AI requests per anonymous browser visitor and EUR 50 daily reserved cost globally, resetting at UTC midnight. This is a conservative API reservation allowance, not an exact all-in currency billing cap. See [DEPLOYMENT.md](DEPLOYMENT.md) for cost assumptions and limits.

## Unresolved gates

- Google returns quota errors for image and Veo; no generated image/video playback test passed. Both are disabled in the backend and frontend.
- OPENAI_API_KEY is absent. Narration/OpenAI models are unavailable.
- Maps key is absent; Gallery remains available with a friendly map notice.
- Provider billing/quotas and hosting storage usage require operator monitoring. Media has no automatic retention cleanup; removing files breaks saved archive links.
- Anonymous visitors can reset their identity; per-person enforcement is not possible without accounts. The shared ledger budget remains enforced.

The public source and Pages release contain no private provider credentials. Creations remain in the visitor's browser; uploaded media is public by link and never automatically added to the curated catalogue.
