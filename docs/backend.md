# Shared backend setup

The homepage works with no credentials. Project-specific Next.js Route Handlers will use the shared server utilities when needed. There is no user login, generic AI proxy, public database write endpoint, or upload endpoint in this foundation.

## Values to set in Vercel

Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `RATE_LIMIT_HASH_SECRET` for each environment. Use a dedicated Supabase project or development branch for Preview and Development rather than giving preview builds production database access. The secret key (`sb_secret_...`) is from Supabase Project Settings → API Keys; the URL is the Project URL. Generate the hash secret with a password manager (32+ random characters). Never paste keys into issues or commit them.

Apply `supabase/migrations/20261008110000_backend_foundation.sql` to the selected project before using the database. It creates private quota counters, server-only `experiment_runs`, and a service-only quota RPC. RLS is enabled; no anonymous/browser access policies are granted. The server secret bypasses RLS, so expose only narrowly validated, project-specific routes. Do not turn off the Data API: the server SDK uses it.

For a text AI project, set an exact current `AI_GATEWAY_MODEL` from the gateway model catalog. Vercel supplies `VERCEL_OIDC_TOKEN` automatically; a server-only `AI_GATEWAY_API_KEY` is optional for local/non-Vercel access. Enable Gateway access/funding and a provider-side monetary budget before setting `AI_ENABLED=true`. No model is chosen and no paid request is made by this setup. Other providers can be integrated for the selected project instead.

Configuration defaults: 5 requests per client per minute, 100 paid attempts across the entire site per UTC day, 4,000 input characters, and 512 completion tokens per text call. These are request/token limits, not a dollar budget. All attempts reserve a slot before provider access; failed provider calls still count. The database transaction enforces both counters across concurrent Vercel instances. IP hashes rotate daily; raw IPs are not stored. IP limits are approximate for shared networks and VPN users. Quotas refuse requests if Supabase is missing or unavailable; there is no in-memory production fallback.

## Adding a project

1. Define a route under `app/api/experiments/<slug>/route.ts`, with Node runtime.
2. Read JSON using `readJsonObject`; validate its exact fields and types. Do not forward arbitrary request options to providers.
3. For text generation, use `generateExperimentText(request, slug, serverSystemInstruction, validatedText)`. It checks AI configuration, input length, quota, and server-set token limits. It returns text without persisting prompts. Return errors through `errorResponse`.
4. For non-AI writes/APIs, call `reserveRequest` before performing the action. Every public state-changing route needs its own validation and access decision.
5. Persist selected results with `saveExperimentResult` only when the project needs it. Establish retention/privacy rules for that project; avoid storing sensitive inputs by default.
6. For browser-only state, keep using local storage. Add storage buckets, vector tables, job queues, or auth only when the chosen project needs them.

`GET /api/health` is liveness only. It does not claim the database or AI is connected. There are no build-time network calls or credential requirements.

## Verification

Run `pnpm test`, `pnpm typecheck`, and `pnpm build`. Tests use fake credentials and mocked services; they do not contact Supabase or spend model credits. After the migration is applied, verify function grants, anonymous table denial, quota concurrency, and result insertion on a preview database before enabling paid routes. These live checks remain required.

Real local keys go only in `.env.local`. `.gitignore` excludes every `.env*` file except `.env.example`; only that template is committed. Redeploy after entering environment variables in Vercel so the new deployment receives them.
