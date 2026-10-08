# Ship a Page

**Sarthak Ships** — small experiments with new technology, by Sarthak Patel. One growing Next.js app; a new page for every approved build.

## Run locally

Requires Node 22.13+ and npm 11.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Verify with `npm run typecheck`, `npm test` and `npm run build`.

## Structure

- `app/` — Next.js App Router pages and global design tokens in `app/site.css`.
- `components/site-header.tsx`, `reveal.tsx` — responsive navigation and optional scroll reveals.
- `components/workbench.tsx` — accessible tabs explaining the daily routine.
- `components/build-log.tsx` — filterable experiment index.
- `public/sarthak-studio.webp` — newly generated portrait, based on Sarthak’s provided references (not an original photograph).
- `components/build-card.tsx` — build-log cards with screenshots of the actual experiment interfaces.
- `data/builds.ts` — the single source of truth for published builds.

## Add a daily experiment

1. Create `app/experiments/<slug>/page.tsx`.
2. Reuse existing components and CSS variables.
3. Add a working experiment to `data/builds.ts` with its route, category, tags, and a product screenshot with descriptive alt text.
4. Run type checking and a production build.
5. Open a separate PR for the approved experiment. Keep merging and publishing explicit.

Research runs at 7am and 5pm IST. The evening brief proposes five ideas; implementation starts after Sarthak selects one. Upcoming projects are clearly labeled; the homepage is Build 000, the foundation.

The homepage uses Base UI’s accessible dialog, Lucide icons, Tailwind CSS, and custom visual components. No API key is needed. Model-specific credentials for future experiments belong only in server-side environment variables.

## Called It and themes

`/experiments/called-it` records predictions, deadlines, challenges and evidence-backed resolutions using Supabase Auth with X OAuth 2.0. See [activation and data rules](docs/called-it.md). Public browsing needs no account; publishing requires sign-in. Until the backend is configured, the page clearly labels its illustrative collection and does not accept writes.

The homepage and all experiment routes share light/dark tokens. The header switch remembers the choice; first visits follow the system preference.

Only placeholder values belong in `.env.example`; real credentials remain outside Git.
