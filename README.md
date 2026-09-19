# Utkarsh Associates — Website & CMS

Next.js 16 (App Router) + Supabase + Tailwind, per `utkarsh-associates-project-plan.md`
and `PHASE-6-PUBLIC-UX-AND-SIMPLIFICATION-PLAN.md` (both kept as the project's
Claude Projects knowledge base — update them as decisions evolve).

## Status

Phases 1–5 built. Phase 6 (public UX pass, `content.json` migration, schema
finalization, empty-state UI) is in progress — see
`PHASE-6-PUBLIC-UX-AND-SIMPLIFICATION-PLAN.md` for scope and §13 for the
work sequence.

## Getting started — fresh Supabase project (per Phase 6 §10's relaunch plan)

```bash
npm install
cp .env.example .env.local   # fill in Supabase + JWT_SECRET values
```

1. Create a new Supabase project.
2. Run every migration in `supabase/migrations/` **in order** (`0001` through
   the highest-numbered file) — there's no single combined schema file,
   each one is additive on top of the last.
3. Generate a real bootstrap password hash: `node scripts/hash-password.js "..."`,
   paste it into `supabase/seed.sql` in place of the placeholder.
4. Run `supabase/seed.sql` — this is the **only** seed file now (roles,
   permissions, the bootstrap superAdmin). Phase 6 §10 deliberately launches
   with empty CMS tables — every public listing has a defined empty state,
   so there's nothing else to seed. (The earlier `seed_phase3.sql`/
   `seed_phase4.sql` sample-content files were removed in Phase 6 §11's
   schema migration, since they referenced the `offices` table and
   `icon_key` column that migration drops/renames.)
5. Copy the project's URL / anon key / service role key into `.env.local`.
6. Fill in real values in `src/config/content.json` (Offices, hero copy,
   disclaimer text, etc. — Phase 6 §1 moved this out of the database; see
   that file's own `_comment` fields for what's placeholder vs. real).
7. Add `SUPABASE_URL` / `SUPABASE_ANON_KEY` as GitHub repo Actions secrets
   so the keep-alive workflow can run.
8. `npm run dev`.

## Placeholder assets

Logo and illustrations are placeholders for now (see plan §3 and §10
checklist). Nothing in the code changes when final SVGs arrive — they get
dropped in at the same filename under `public/`, per `src/config/assets.ts`.
Practice area icons are the one exception as of Phase 6 §7 — those are now
a real per-practice-area upload in the admin, not a placeholder file swap.

## Design system reference

The full token sheet with live rendered components lives in
`utkarsh-associates-design-system.html` — treat it as the visual source of
truth; `tailwind.config.ts` and `tokens.css` are generated from it, not the
other way around. A few tokens (button padding, the `body-l` type size)
were revised in Phase 6 §3 — that file's own copy was updated to match.
