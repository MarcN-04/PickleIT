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

3. **Apply the schema.** SQL migrations live under [`supabase/migrations/`](supabase/migrations/) and are the reproducible source of truth. In the Supabase dashboard, open **SQL Editor → New query**, then paste and **Run each file in filename order**:

   1. `0001_core_schema.sql` — enums + tables (players, sessions, session_players, games, game_players)
   2. `0002_player_stats_view.sql` — lifetime stats view
   3. `0003_auth_profiles.sql` — profiles table, roles, first-user-becomes-Admin trigger
   4. `0004_rls_policies.sql` — Row Level Security policies
   5. `0005_realtime.sql` — publish live-state tables for Realtime

   Each should report success before you run the next.

4. **Enable username/password sign-up.** In **Authentication → Providers → Email**:
   - Make sure **Email** is **enabled** and **Allow new users to sign up** is **ON**.
   - Turn **Confirm email = OFF**. **This is required** — we use synthetic
     `<username>@pickleit.local` addresses that can't receive mail. With
     confirmation ON, Supabase rejects the synthetic domain
     (`email_address_invalid`) and/or throttles sign-ups
     (`over_email_send_rate_limit`). With it OFF, accounts activate instantly.

### Roles & first user

The **first account created becomes Admin** automatically; everyone after is **pending** until the Admin assigns a role in-app (Settings → Users). See [Auth model](#auth-model-planned).

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
- [x] **Phase 2 — Design-system primitives.** Glass components + `/style` reference page.
- [x] **Phase 3 — Supabase schema + Auth + RLS.** Migrations, role-based RLS, browser/server clients.
- [x] **Phase 4 — Auth UI + route protection.** Username/password, roles, pending-approval flow.
- [x] **Phase 5 — Players tab.** Bottom tab bar, roster grouped + search, add/edit, profile (stats/streak/history).
- [ ] Phase 6 — Play flow setup
- [ ] Phase 7 — Rotation engine + tests
- [ ] Phase 8 — Live dashboard + Realtime
- [ ] Phase 9 — Summary, Leaderboard, Settings/Admin
- [ ] Phase 10 — PWA + Deploy

---

## Known limitations (MVP)

- Username-only login is implemented via synthetic `@pickleit.local` emails; there is no real email or password recovery in v1.
- Deferred post-v1: dynamic skill adjustment from win/loss history, a multi-court promotion/relegation ladder, and functional category-label renaming.
