# PickleIT

A mobile-first PWA that automates how a pickleball group organizes games across 1–3 courts. It replaces the manual "stack paddles in fours" queue with an automated, fair rotation engine, and keeps a permanent player database with lifetime win/loss stats that persist across sessions.

- **Stack:** Next.js (App Router) + TypeScript · Tailwind (custom glassmorphism theme) · Framer Motion · Supabase (Postgres + Realtime + Auth) · PWA · deployed on Vercel.
- **Dev runtime:** **Docker only** — you do **not** need Node or npm installed on your machine.

---

## Develop with Docker (the only supported way)

> All development runs inside the dev container. The host never needs Node/npm and never has `node_modules` written to it (it lives in a named Docker volume).

1. **Create your env file** — copy the example and fill in your Supabase values (see [Supabase setup](#supabase-setup)):

   ```bash
   cp .env.example .env.local
   # then edit .env.local
   ```

2. **Start the dev server:**

   ```bash
   docker compose up
   ```

   The app is served at **http://localhost:3000** with hot reload.

3. **One-off tasks** (install a package, run tests, etc.) use `run --rm`:

   ```bash
   docker compose run --rm app npm install <package>
   docker compose run --rm app npm test          # runs the rotation-engine unit tests (Vitest)
   docker compose run --rm app npm run lint
   ```

> First `docker compose up` builds the image and installs dependencies into the named `node_modules` volume; subsequent starts are fast. If you change `package.json`, rebuild with `docker compose build` (or `docker compose run --rm app npm install`).

### Why Docker is dev-only

Docker runs the Next.js dev server **locally**. It is **not** used by Vercel (Vercel builds with its own pipeline) and Supabase is the hosted cloud database. The container simply runs the app and connects to your hosted Supabase project via the env vars in `.env.local`.

---

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the **Project URL** and the **anon / public** key into `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. **Apply the schema.** SQL migrations live under [`supabase/migrations/`](supabase/migrations/) and are the reproducible source of truth. Apply them via the Supabase **SQL Editor** (paste each migration in filename order and run), or with the Supabase CLI (`supabase db push`).

_(The schema, auth tables, and Row Level Security policies are added in a later build phase.)_

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Import Project** and select the repo.
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in **Project Settings → Environment Variables**.
4. Deploy. After that, **every push to `main` auto-deploys** to production.

---

## Auth model (planned)

> Added in a later phase — documented here so the intended behavior is clear.

- **Username + password** sign-up / sign-in (no email shown to the user; implemented via a synthetic `<username>@pickleit.local` address behind Supabase Auth).
- **Roles:** Admin / Organizer / Viewer.
  - **Admin** — everything, including user management and settings.
  - **Organizer** — run sessions, add/edit players, log results.
  - **Viewer** — read-only dashboard and leaderboard.
- The **first user to sign up becomes Admin**. Later sign-ups are **pending** (no access) until an Admin assigns a role in Settings.

---

## Project status

Built incrementally; each phase keeps the app runnable.

- [x] **Phase 1 — Scaffold + Docker.** `docker compose up` serves a styled placeholder.
- [ ] Phase 2 — Design-system primitives
- [ ] Phase 3 — Supabase schema + Auth + RLS
- [ ] Phase 4 — Auth UI + route protection
- [ ] Phase 5 — Players tab
- [ ] Phase 6 — Play flow setup
- [ ] Phase 7 — Rotation engine + tests
- [ ] Phase 8 — Live dashboard + Realtime
- [ ] Phase 9 — Summary, Leaderboard, Settings/Admin
- [ ] Phase 10 — PWA + Deploy

---

## Known limitations (MVP)

- Username-only login is implemented via synthetic `@pickleit.local` emails; there is no real email or password recovery in v1.
- Deferred post-v1: dynamic skill adjustment from win/loss history, a multi-court promotion/relegation ladder, and functional category-label renaming.
