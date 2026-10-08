# Ship a Page

**Sarthak Ships** — small experiments with new technology, by Sarthak Patel. One growing Next.js app; a new page for every approved build.

## Run locally

Requires Node 22.13+ and pnpm 10.

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. Verify with `pnpm typecheck` and `pnpm build`.

## Structure

- `app/` — Next.js App Router pages and global design tokens.
- `components/site-header.tsx`, `reveal.tsx` — responsive navigation and optional scroll reveals.
- `components/workbench.tsx` — accessible tabs explaining the daily routine.
- `components/build-log.tsx` — filterable experiment index.
- `public/sarthak-studio.webp` — newly generated portrait, based on Sarthak’s provided references (not an original photograph).
- `components/build-card.tsx` — build-log cards and the foundation details dialog.
- `data/builds.ts` — the single source of truth for published builds.

## Add a daily experiment

1. Create `app/experiments/<slug>/page.tsx`.
2. Reuse existing components and CSS variables.
3. Add a working experiment to `data/builds.ts` with its route, category, and tags.
4. Run type checking and a production build.
5. Open a separate PR for the approved experiment. Keep merging and publishing explicit.

Research runs at 7am and 5pm IST. The evening brief proposes five ideas; implementation starts after Sarthak selects one. Upcoming projects are clearly labeled; the homepage is Build 000, the foundation.

The homepage uses Base UI’s accessible dialog, Lucide icons, Tailwind CSS, and custom visual components. No API key is needed. Model-specific credentials for future experiments belong only in server-side environment variables.
