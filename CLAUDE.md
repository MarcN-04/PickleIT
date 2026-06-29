# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PickleIT is a mobile-first PWA that automates organizing pickleball games across 1–3 courts. It replaces the manual "stack paddles in fours" queue with an automated, fair rotation engine, plus a permanent player database with lifetime win/loss stats that persist across sessions.

Stack: Next.js 14 (App Router) + TypeScript · Tailwind (custom glassmorphism theme) · Framer Motion · Supabase (Postgres + Realtime + Auth). The `@` import alias points at the repo root.

## Commands

Development is **Docker-only** — the host needs neither Node nor npm, and `node_modules` lives in a named Docker volume (never written to the host).

```bash
docker compose up                                   # dev server with hot reload at http://localhost:3000
docker compose run --rm app npm test                # Vitest (rotation-engine unit tests)
docker compose run --rm app npm run test:watch      # Vitest in watch mode
docker compose run --rm app npm run lint            # next lint
docker compose run --rm app npm install <package>   # add a dependency (rebuilds the volume)
docker compose build                                # rebuild after package.json changes
```

> Note: `package.json` sets `next dev -p 3001`, but `docker compose up` maps it to **3000** on the host.

Run a single test by passing a name filter to Vitest:

```bash
docker compose run --rm app npm test -- -t "king of the court"
```

Tests only cover the pure rotation engine — Vitest is configured (`vitest.config.ts`) to include `lib/**/*.test.ts` and runs in a `node` environment. There is no test setup for React components.

Docker is dev-only: Vercel builds with its own pipeline and Supabase is the hosted cloud DB. Every push to `main` auto-deploys to Vercel.

## The rotation engine (the heart of the app)

`lib/rotation/` is a **pure, deterministic, UI- and DB-agnostic** module — it takes a plain `EngineState` snapshot and returns a new one (never mutates input), which is why it can be unit-tested in isolation. Everything else maps to/from Supabase rows around it.

- `types.ts` — `EngineState` (courts, queue, players-by-id, mode, history). Players carry `gamesPlayed` (the fairness counter) and `seq` (monotonic arrival order; late arrivals get a higher value than everyone present).
- `queue.ts` — `orderQueue()` sorts waiting players by **gamesPlayed asc → seq asc (longest wait) → id**. This single rule governs all sit-outs when player count exceeds `courtCount * 4`.
- `teams.ts` — `bestPairing()` enumerates the 3 ways to split 4 players, picks the most skill-balanced (by `SKILL_WEIGHT`), tie-broken by **soft repeat-avoidance** (recent-history window) then id. Team A/B assignment is normalized by sorted-id key so output is stable.
- `engine.ts` — entry points `initializeSession`, `applyGameResult`, `addLatePlayer`, `removePlayer`.

Two pairing modes (`PairingMode`):
- **balance** — all four players go to the back of the queue after a game; the next four come off the front.
- **king_of_the_court** — winners stay and are **split onto opposite teams**, each paired with a challenger pulled from the queue's front; losers go to the back. `splitWinnersGame()` guards against `bestPairing` re-pairing the two winners together.

**Determinism is a hard invariant**: given identical inputs, output is identical (all ordering falls back to ids). Preserve this when editing — the tests depend on it.

`SKILL_WEIGHT` (beginner 1 / intermediate 2 / pro 3) lives in `lib/categories.ts`, the single source of truth for the three skill `Category` values shared by badges, forms, roster grouping, and the engine.

## How the engine connects to the database

The engine never touches Supabase. The bridge is in `lib/data/`:

- `liveSession.ts` — `loadLiveSession()` reads the session, enrolled players, in-progress games, and team rosters; `toEngineState()` converts those rows into an `EngineState` (deriving `seq` from `session_players.created_at` order).
- `liveSessionActions.ts` — Server Actions that run the engine and **reconcile** the result back to the DB: `ensureGamesStarted` (idempotent first-load init), `startGame`, `recordWinner`, `addPlayerToSession`. `persistSessionPlayers()` writes each player's `state`/`current_court`/`queue_position`/`games_played` from the new `EngineState`.

Every mutation is a `"use server"` action that re-checks the caller's role (`canManageGameplay`) and calls `revalidatePath`. Live state is reconstructed from the DB on every render so multiple devices stay in sync via Realtime — `RealtimeSync.tsx` subscribes to `session_players`, `games`, and `game_players` changes and debounces a `router.refresh()`. `AutoInit` triggers the first court fill on load.

> Branch context: `feature/003-NoDatabaseForSession` suggests in-progress work to move live-session state off the DB. Confirm the intended source-of-truth before assuming the DB-backed flow above is still current.

## Auth model

Username-only product built on Supabase email auth via **synthetic emails**: `lib/auth/username.ts` maps `<username>` ↔ `<username>@pickleit.local` (the user never sees an email). This requires **Confirm email = OFF** in Supabase, or sign-ups are rejected/throttled.

Roles (`lib/auth/roles.ts`): `admin` > `organizer` > `viewer` > `pending`. The **first user to sign up becomes Admin** (DB trigger); later users are `pending` until an Admin assigns a role. Permission helpers (`canView`, `canManageGameplay`, `isAdmin`, `isPending`) mirror the DB's RLS rules — **RLS is the source of truth; UI gating is convenience only.**

`getCurrentProfile()` (`lib/auth/session.ts`) is wrapped in React `cache()` so the layout guards and pages share one Supabase round-trip per request. Supabase clients: `lib/supabase/client.ts` (browser), `server.ts` (Server Components/Actions), `middleware.ts` (token refresh + signed-out redirect). In `middleware`, never run code between `createServerClient` and `getUser()` — `getUser()` refreshes the token.

## Routing structure

App Router with route groups:
- `app/(auth)/` — `/login`, `/signup` (public; middleware redirects signed-in users away).
- `app/(app)/` — authenticated shell. `(app)/layout.tsx` requires a profile; `(app)/(tabs)/layout.tsx` additionally bounces `pending` users to `/pending` and renders the adaptive nav (desktop `SideNav` ≥1024px, mobile `TabBar` — never both).
- `app/(app)/(tabs)/` — the four tabs: `play`, `players`, `leaderboard`, `settings`. The live dashboard is `play/session/[id]`; recap is `play/summary/[id]`.
- `app/style/page.tsx` — design-system reference page for the glass primitives in `components/ui/`.

## Database

SQL migrations in `supabase/migrations/` are the reproducible source of truth — apply them in filename order via the Supabase SQL editor (see README for the full setup). Tables: `players`, `sessions`, `session_players`, `games`, `game_players`, `profiles`, `app_settings`, plus the `player_stats` view.

`types/database.ts` is **hand-maintained** to mirror the SQL (kept hand-written so the project doesn't need the Supabase CLI in the Docker-only workflow). **When you change a migration, update `types/database.ts` to match** — they are not generated.
