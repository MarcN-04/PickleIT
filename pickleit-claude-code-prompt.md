# PickleIT — Claude Code Build Prompt

Build a mobile-first web app called **PickleIT** that automates how a pickleball group organizes games across multiple courts. Read this entire brief, then build the app following the workflow, design system, data model, and rotation logic below. Build incrementally in the order given at the end, and keep each stage runnable.

---

## 1. What the app does

A group plays pickleball on 1–3 courts. Each court holds 4 players (two teams of two). Currently they manually "stack paddles" in groups of four and feed the next four onto whichever court just finished. This app replaces that manual queue with automated, fair pairing — and keeps a permanent record of players and their win/loss stats across sessions.

Core loop: an organizer creates a session, selects who showed up, the app fills the courts and builds a waiting queue, and after each game the organizer taps the winner — the app logs the result, re-queues those players according to the chosen pairing mode, and pulls the next group onto the court.

---

## 2. Tech stack (use exactly this)

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS** with a custom theme for the tokens below, plus a small amount of hand-written CSS for the glass panels and floating orbs. Do **not** use a component library (no shadcn/MUI) — the look is bespoke.
- **Framer Motion** for animation.
- **Space Grotesk** (headings) and **Inter** (body), loaded via `next/font/google`.
- **Supabase** (hosted Postgres) for the database, with **Supabase Realtime** for live multi-device sync of the active session.
- **PWA**: installable, with a manifest and app icons, so it can live on a phone home screen and tolerate flaky court wifi.
- Deploy target: **Vercel**. Source of truth: **GitHub**.

---

## 3. Development environment — Docker

The developer does **not** have Node or npm installed locally. All development must run inside Docker.

- Provide a `Dockerfile.dev` based on `node:20-slim`.
- Provide a `docker-compose.yml` with one `app` service:
  - Maps port `3000:3000`.
  - Mounts the project source as a volume for hot reload.
  - Keeps `node_modules` in a **named (container-managed) volume** so it never depends on or writes to the host.
  - Loads environment variables from `.env.local`.
- Day-to-day commands must work as:
  - `docker compose up` → starts the Next.js dev server at `localhost:3000`.
  - `docker compose run --rm app <command>` → for one-off tasks (installing a package, running scripts).
- The README must document these commands as the only way to develop.

**Important separation:** Docker is for local development only. Vercel builds with its own pipeline (it does **not** use the Dockerfile), and Supabase is the hosted cloud database. The dev container just runs the Next.js app and connects to the hosted Supabase project via env vars.

---

## 4. Repo, environment, and deployment

- Initialize a git repository with a proper `.gitignore` (`node_modules`, `.next`, `.env*`, build artifacts, OS files).
- Commit a `.env.example` listing required variables; never commit real secrets:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Commit the database schema as SQL migration file(s) under `/supabase/migrations/` so the schema is reproducible.
- Write a `README.md` covering: project overview, the Docker dev commands, how to set up a Supabase project and fill `.env.local`, how to apply the SQL schema, and how to connect the repo to Vercel (push to `main` → auto-deploy).
- If the GitHub CLI (`gh`) is available, offer to create the remote repo and push; otherwise print the exact commands to add a remote and push.

**Auth note:** For the MVP, no login is required — the app is run by trusted organizers. Set up Supabase Row Level Security with permissive policies for now, but leave a clearly commented seam to add real auth later. Flag this in the README as a known limitation.

---

## 5. Design system

Light **glassmorphism** — airy, premium, calm. Never dark, never flat.

**Background**
- Soft mint/cream gradient-mesh background with several large, blurred, slowly floating orbs.

**Glass panels**
- Frosted translucent white surfaces: `backdrop-filter: blur(22px)`, near-white 1px borders, soft green-tinted shadows, and a subtle inner top highlight.
- Generously rounded: cards 16–28px; buttons, toggles, and chips are fully pill-shaped.

**Color tokens**
- Primary action (emerald gradient, white text): `#149655 → #0e7a44`
- Accent (bright lime, dark text): `#c4e637 → #9bc416`
- Text (near-black-green): `#14291d`

**Typography**
- Headings: Space Grotesk. Body: Inter.

**Motion (Framer Motion)**
- Springy: hover lifts, pop-in scaling on mount, overshoot easing `cubic-bezier(.34,1.46,.5,1)`.
- Selected states scale up slightly and glow with a colored shadow.

**Two refinements to apply:**
1. On the **Live dashboard**, where panels are dense with names, badges, and scores, keep the frosted glass but increase legibility: put player rows on a slightly more opaque inner surface and use the strong `#14291d` text so everything stays crisp when viewed at arm's length in bright outdoor light.
2. Use the **lime accent sparingly** — reserve it for selected states, wins, and the "up next" highlight — so it stays a premium pop rather than visual noise.

**Category badges:** give Beginner / Intermediate / Pro three soft, distinct tints that still sit calmly within the palette (e.g., a soft green, a warm amber, a deeper emerald/teal), with readable dark text.

---

## 6. Information architecture

Mobile bottom tab bar with four tabs.

### Tab 1 — Play (home)
A single sequential flow, not a menu:
1. **Start session** — set: active courts (1–3), pairing mode (**Balance** or **King of the court**), then proceed to selection. (Default pairing mode comes from Settings but is chosen here per session.)
2. **Select players** — choose today's attendees from the saved roster, **grouped by category** (each category section shows a "selected of total" count). Includes an **Add new player** action for walk-ins (name, age, category) that also saves them to the roster. Confirm with a "Start session · N players" button.
3. **Live dashboard** — for each active court: the two teams (with category badges), a game timer, and a **Game over** button. Below: the **Up next** group and the ordered **Waiting list** (numbered, showing wait order).
4. **Winner select** — opened from a court's Game over: tap the winning team. Logs the result, updates stats, re-queues the four players per the pairing mode, and pulls the next group onto that court.
5. **Add player to session** — drop a late arrival into the running session.
6. **End session summary** — recap of games played and results when the session is closed.

### Tab 2 — Players (persistent database)
- **All players** — full roster grouped by category, with search.
- **Player profile** — lifetime stats (games, wins, losses, win rate, current streak) and a recent-games history list.
- **Add / edit player** — form for name, age, category.

### Tab 3 — Leaderboard
- Rankings of all players, sortable by win rate / wins / games played, filterable by category. Tapping a player opens their profile.

### Tab 4 — Settings
- Default pairing mode (pre-selects one at session creation).
- Default court count.
- Category management (optional: rename labels).
- Data & backup info.
- About / version.

---

## 7. Data model (Supabase / Postgres)

Provide these as SQL migrations. Use UUID primary keys and `created_at` timestamps.

**players**
- `id`, `name` (text), `age` (int, nullable), `category` (enum: `beginner` | `intermediate` | `pro`), `created_at`

**sessions**
- `id`, `name` (text, e.g. date label), `court_count` (int), `pairing_mode` (enum: `balance` | `king_of_the_court`), `status` (enum: `active` | `ended`), `created_at`, `ended_at` (nullable)

**session_players** (attendance + live state, so the dashboard is reconstructable from the DB for realtime sync)
- `id`, `session_id` (fk), `player_id` (fk)
- `state` (enum: `playing` | `waiting` | `left`)
- `current_court` (int, nullable — set when playing)
- `queue_position` (int, nullable — set when waiting; lower = next up)
- `games_played` (int, default 0 — for in-session fairness)
- unique(`session_id`, `player_id`)

**games**
- `id`, `session_id` (fk), `court_number` (int)
- `status` (enum: `in_progress` | `completed`)
- `winner` (enum: `a` | `b`, nullable until completed)
- `started_at`, `ended_at` (nullable)

**game_players** (join: who played, which team)
- `id`, `game_id` (fk), `player_id` (fk), `team` (enum: `a` | `b`)

**player_stats** — a SQL **view** aggregating completed games across all sessions: per player → games, wins, losses, win_rate. Used by profiles and the leaderboard. (Compute current streak in the app or via a second view/function.)

The active session's live state (current games + queue) lives in the DB via `games`/`game_players` (in_progress rows) and `session_players` (`state`, `current_court`, `queue_position`). Subscribe to Supabase Realtime on these so multiple phones see the same dashboard update live.

---

## 8. The rotation engine (most important — implement carefully)

Encapsulate all of this in a well-tested, pure-logic module (e.g. `/lib/rotation/`), separate from UI, so it can be unit-tested. Each "game over" event runs the engine, which returns the updated court/queue state; the app then persists it to Supabase.

### Shared concepts
- **Skill weight** from category: Beginner = 1, Intermediate = 2, Pro = 3. (Build in an optional hidden dynamic adjustment from win/loss over time, but the category weight is the base — keep it simple for v1.)
- **Fairness counter:** `games_played` per player in the session. The waiting queue is ordered by `games_played` ascending, then by longest wait — so whoever has played least/waited longest is next on. This governs sit-outs when player count > courts × 4.
- **Soft repeat-avoidance:** when forming teams, prefer combinations that avoid the exact same partners/opponents as the immediately previous games, as a secondary tie-breaker.
- Handle counts not divisible by 4, players leaving mid-session (`state = left`, removed from queue), and late arrivals (added to the back of the queue).

### Session start (both modes)
- Order selected players by category/fairness, fill the active courts, and place the remainder into the waiting queue (ordered).
- When filling a court, assign the 2v2 teams to **balance** the two teams' combined skill weight (for 4 players, evaluate the three possible pairings and pick the most balanced; break ties with repeat-avoidance).

### Balance mode (on game over)
- Record the winner (for stats only — it does **not** change queue priority here).
- Increment `games_played` for the four players.
- Send all four players to the **back of the waiting queue**.
- Pull the next four from the **front** of the queue onto the now-free court, and assign balanced 2v2 teams as above.
- Goal: everyone cycles fairly and games stay competitive.

### King of the court mode (on game over)
- Record the winner.
- Increment `games_played` for the four players.
- **Losing team** → goes to the **back of the waiting queue**.
- **Winning team** → **stays on the same court** (they hold the court), but to keep partnerships fresh, **split the two winners** and pair each with one new challenger pulled from the **front of the queue**. (If fewer than two players are waiting, the winners stay paired and whoever is available fills in.)
- This keeps the strongest players on court while rotating fresh challengers in.
- (Optional later enhancement, do **not** build in v1 unless trivial: a multi-court ladder where winners promote up toward Court 1 and losers drop down. v1 uses the per-court "winners stay, split, challengers in" rule above.)

Make the engine deterministic given its inputs, and cover both modes plus the edge cases with unit tests.

---

## 9. Build order

Build incrementally; keep the app runnable at each step.

1. **Scaffold:** Docker dev setup, Next.js + TypeScript, Tailwind theme tokens, fonts, git repo with `.gitignore`/`.env.example`/README. Confirm `docker compose up` serves a styled placeholder.
2. **Design system primitives:** background mesh + floating orbs, glass panel/card/button/chip/toggle components, motion presets. Build a tiny style reference page.
3. **Supabase:** schema migrations, client setup, the `player_stats` view, env wiring.
4. **Players tab:** roster list grouped by category + search, add/edit player, player profile with stats and history.
5. **Play flow:** start session (courts + pairing mode) → select players (grouped, with add-new) → persist session.
6. **Rotation engine:** the pure module with unit tests for both modes and edge cases.
7. **Live dashboard + winner select:** wire the engine to the UI, persist live state, then add **Supabase Realtime** sync.
8. **End session summary**, **Leaderboard**, **Settings**.
9. **PWA** (manifest + icons + installability) and final polish per the design system.
10. **Deploy:** push to GitHub, document the Vercel connection, verify a production deploy.

---

## 10. Acceptance criteria

- Runs entirely via Docker with no local Node/npm.
- A player added once persists in Supabase and is reusable across future sessions.
- A session can be created with chosen courts + pairing mode, players selected grouped by category, and games auto-organized.
- Tapping a winner correctly updates stats and rotates players per the selected mode.
- Sit-outs and wait order are fair (fewest games / longest wait go next).
- Profiles and leaderboard reflect real lifetime win/loss data.
- Two phones viewing the same active session stay in sync via Realtime.
- The UI matches the glassmorphism design system and is comfortable on a phone.
- Pushing to `main` deploys to Vercel.

Ask me before making any decision that would visibly change scope or behavior; otherwise proceed and keep me updated at each build-order milestone.
