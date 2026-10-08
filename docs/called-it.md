# Called It

Route: `/experiments/called-it`. Built on `main` after the personal homepage merge. PR #3's optional AI/quota backend is not required or merged by this change.

## Activate the backend

1. Use a dedicated active Supabase project. The connected project inventory currently contains only inactive VYRA; no changes were made to it.
2. Apply `supabase/migrations/20261008145055_called_it.sql` to the intended project through the SQL editor or Supabase CLI. The migration contains no example accounts or predictions. Run advisors and verify RLS using real sessions before launch.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel Preview and Production with the correct project per environment; redeploy. These are deliberately browser-visible public configuration. No service-role key is used by Called It.
4. In the X developer console, configure a Web App using OAuth 2.0 and the Supabase callback `https://<project-ref>.supabase.co/auth/v1/callback`. Supply the real website, `/experiments/called-it/terms` and `/experiments/called-it/privacy` URLs. Enable requested email access as required by the current Supabase X provider guide. Confirm developer access/billing in X before opening accounts.
5. Save X Client ID/Secret in Supabase Auth > X / Twitter (OAuth 2.0). These are not Vercel frontend variables. Configure the Site URL and exact `/auth/callback` return URLs for the production, approved preview and local origins. Avoid broad production wildcard redirects.
6. Sign in once, then appoint the intended reviewer from the SQL editor:
   `insert into called_it_private.reviewers(user_id) values ('<real Supabase auth user UUID>');`
   Reviewers are never appointed from browser input, user metadata or an environment list of handles.

Without public configuration the app displays a clearly labelled illustrative collection and disables publishing. With configuration but unavailable tables, it displays an error rather than falling back to examples. No examples are inserted into production.

## Data rules

- Public can read calls, basic profiles, responses and resolutions. No email or provider tokens are exposed by these tables.
- X identities and Supabase user UUID establish write access. Display metadata is cosmetic and does not confer permissions.
- Only the signed-in owner can insert a call; database column grants and a trigger lock its original wording, evidence source, deadline and creation time.
- At most 5 calls and 30 responses per rolling 24 hours per account. Advisory transaction locks serialize same-user inserts. This limits account activity, not multi-account abuse; add platform/IP limits before a large public launch.
- One response per user per call. Authors cannot respond to themselves; responses close at the deadline and are immutable. The response and resolution triggers share a per-call advisory lock to serialize checks without requiring ordinary members to have update permissions.
- Only a database-appointed reviewer can resolve an open call after its deadline, with an explanation and evidence URL. The first outcome is final in the UI. A disputed or incorrect resolution needs a documented operator correction workflow; do not silently overwrite it.
- Foreign keys cascade on account deletion to support operator privacy removal. "Permanent" refers to original content not being silently editable, not immunity from privacy/moderation removal.
- No application service-role key or AI is required. Private `SECURITY DEFINER` helpers have fixed search paths, narrow execution grants and explicit session checks.
- User URLs are outbound links only and are not fetched on the server.

## Verification

Run `npm ci`, `npx playwright install chromium`, `npm run typecheck`, `npm test`, `npm run build`, then `npm run test:e2e`. The browser suite uses the production build.

Validated: production build, TypeScript, 5 validation/database tests and 6 browser journeys passed. Desktop/light and mobile/dark screenshots were inspected. When the Playwright browser download was truncated in this runtime, the same suite passed using an installed Chromium binary via `CHROMIUM_PATH`.

Database tests execute the migration in PGlite PostgreSQL with a minimal Supabase auth fixture and real anon/authenticated roles. They verify permissions, impersonation, immutability, quotas, response rules and reviewer-only outcomes. This does not substitute for testing hosted OAuth or concurrent HTTP writes on the chosen Supabase project.

The interface uses a compact social timeline with a composer, author-led posts, public response counts, stance shortcuts and sharing. The artwork is a small intro detail. A large hero and side navigation are intentionally omitted.

Browser tests cover the homepage and experiment's persistent themes, mobile layout, filters/search, receipt detail/download, form review, keyboard dialog and draft validation. The browser suite checks public/preview journeys and safe rejection of unconfigured writes; the database tests separately check authenticated write enforcement. A live X callback, cookie refresh, real publishing, response persistence and reviewer flow remain deployment checks after project/provider configuration.
