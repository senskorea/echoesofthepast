# Centrally managed public deployment

Superseded by [the consolidated implementation plan](IMPLEMENTATION-PLAN.md), which includes backend alternatives, environment setup, documentation and friendly error handling. The notes below describe the earlier Supabase-specific approach, not a confirmed hosting decision.

Requirement: visitors use GeoStories without entering API keys or creating their own Supabase project. Preserve the existing feature scope.

## Deployment prerequisite

The configured Supabase project `xyllwepplgclcfhlnhoy` did not resolve during the latest deployment checks. Confirm the organisation-owned project before changing production configuration. Provider secrets must be entered in that project's Edge Function secrets, never in frontend `VITE_` variables, the repository, or browser storage.

## Changes required

1. Route text, image, audio, postcard analysis, JSON formatting, and tutor requests through server functions. `src/lib/ai-service.ts` currently calls providers directly; `src/components/ImportDialog.tsx` also contains direct provider calls and key preconditions. Both paths must migrate.
2. Change `supabase/functions/generate-video/index.ts` to read the central Gemini secret. Remove client-supplied keys and the local key gate in `src/pages/PostcardDetail.tsx`. Bind video operations to their originating session and continue storing completed videos without credential-bearing URLs.
3. Enforce allowed operations/models, request size limits, durable request quotas and an operator-controlled global generation limit before paid provider requests. Do not treat CORS or the public Supabase key as authorisation. Reject requests when quota enforcement is unavailable.
4. Use deployment-managed Supabase configuration in the public build. Remove visitor overrides from `src/lib/supabase-config.ts`. Review upload policies against the actual visitor access model before enabling central uploads.
5. Configure the Google Maps browser key once for the deployment, with restrictions to the site domains and Maps JavaScript API. A Maps browser key is necessarily visible to browsers; AI secrets are not. Remove the visitor Maps-key prompt.
6. Remove provider and infrastructure credential entry/testing from public Settings. Preserve relevant local archive export/restore functions. Replace missing-service messages with service availability messages rather than asking visitors to configure APIs. Update the tutor's setup guidance.
7. Preserve existing audio support: it currently requires OpenAI. Supply a central OpenAI key for that feature, or explicitly decide to migrate its implementation to Gemini before retiring the dependency.

## Verification and cutover

- Test in a fresh browser with no local settings or provider keys.
- Assert that browser requests target the configured backend and never contain provider secrets.
- Test all import and generation paths, tutor responses, video polling/playback and upload permissions.
- Test quota rejection, oversized input, unsupported models, forged operations and provider failures.
- Check deployed frontend bundles and saved/exported data for provider credentials.
- Deploy backend and configure secrets first; smoke-test it before switching the public frontend.
- Run the existing tests, lint and production build before publishing.

Status: integration points inspected; production migration awaits the selected backend project and securely configured operator secrets. This document does not mean central services have been implemented or enabled.

Reference: https://supabase.com/docs/guides/functions/secrets
