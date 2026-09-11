# Utkarsh Associates — Website & CMS

Next.js 16 (App Router) + Supabase + Tailwind, per `utkarsh-associates-project-plan.md`
(kept as the project's Claude Projects knowledge base — update it as decisions evolve).

## Phase 1 status — Foundation

Done in this scaffold:
- [x] Folder structure (`src/app`, `src/components`, `src/lib`, `src/config`, `supabase/`, `.github/`)
- [x] `tailwind.config.ts` — every color/type/spacing/radius/shadow token mapped 1:1 from the design system
- [x] `src/styles/tokens.css` — raw CSS variables for SVG/inline use (icons reference these directly)
- [x] Fonts — Newsreader / Inter / IBM Plex Mono, self-hosted via `next/font`
- [x] Shared UI component library first pass: `Button`, `Tag`, `Input` (default/error/success), `PracticeAreaCard`, `StatStrip`
- [x] `src/config/assets.ts` — central placeholder-swap asset registry
- [x] `src/config/permissions.ts` — permission key list (single source of truth, mirrored in `seed.sql`)
- [x] `supabase/migrations/0001_init.sql` — full schema + RLS policies from plan §6
- [x] `supabase/seed.sql` + `scripts/hash-password.js` — roles/permissions/bootstrap superAdmin
- [x] `.github/workflows/supabase-keep-alive.yml` — twice-weekly ping, wired up now per §9

Still to do before Phase 1 is fully closed out (needs your actual accounts/network — I can't reach these from here):
- [ ] `npm install` locally
- [ ] Create the Supabase project, run `supabase/migrations/0001_init.sql`
- [ ] Generate a real bootstrap password hash (`node scripts/hash-password.js "..."`) and paste it into `seed.sql` before running it
- [ ] Add `SUPABASE_URL` / `SUPABASE_ANON_KEY` as GitHub repo Actions secrets so the keep-alive workflow can run
- [ ] Push to GitHub, connect the repo to Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + JWT_SECRET values
npm run dev
```

## Placeholder assets

Logo and illustrations are placeholders for now (see plan §3 and §10 checklist).
Nothing in the code changes when final SVGs arrive — they get dropped in at the
same filename under `public/`, per `src/config/assets.ts`.

## Design system reference

The full token sheet with live rendered components lives in
`utkarsh-associates-design-system.html` — treat it as the visual source of
truth; `tailwind.config.ts` and `tokens.css` are generated from it, not the
other way around.
