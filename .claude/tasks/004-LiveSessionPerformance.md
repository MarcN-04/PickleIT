# Spec 004 — Live Session Performance

**Status:** Approved (pending Orchestrator)
**Created:** 2026-06-29
**Strategy:** Keep the DB as the source of truth; make the click round-trip cheap. No move to client-first/in-memory engine.

## Problem

On the live session dashboard (`play/session/[id]`), clicking gameplay buttons
(Start Game, Game Over → winner, Add Player) feels slow in two distinct ways,
confirmed in interview:

1. **Frozen tap (fixed latency floor)** — present even in small sessions
   (~8 players / 1–2 courts). The tap does nothing visible for 1–3s, then the
   UI updates.
2. **Worsens as players grow (N-scaling)** — more players → slower writes/reload.

Usage reality: a **single organizer device** drives gameplay. Multi-device
Realtime fan-out is **not** the bottleneck and is out of scope as a problem to
solve — but see Finding 4 (the organizer's own device pays a redundant refresh).

## Root-cause findings (from code)

Every gameplay action (`lib/data/liveSessionActions.ts`) does, sequentially and
fully awaited before the button settles:

1. `getCurrentProfile()` round-trip → `loadLiveSession()` = **4 sequential
   queries** (`sessions`, `session_players`+join, `games`, `game_players`) →
   run engine → **sequential** DB writes → `revalidatePath` → full server
   re-render.
2. `CourtCard` (`app/(app)/(tabs)/play/session/CourtCard.tsx`) uses
   `useTransition` only — it **awaits the full server round-trip** before
   anything changes on screen. No optimistic state. This is the "frozen tap."
3. `persistSessionPlayers()` fires **one UPDATE per player** via
   `Promise.all` (N round-trips). `session_players` has
   `unique (session_id, player_id)` → a single batched upsert is viable.
4. `RealtimeSync` (`app/(app)/(tabs)/play/session/RealtimeSync.tsx`) calls
   `router.refresh()` on **every** change including the organizer's **own**
   writes — so the clicking device pays for the action *and* a redundant
   full reload (4 queries) ~150ms later.

## Tasks

### Frontend Agent

- **F1 — Optimistic UI on gameplay buttons.** In `CourtCard.tsx`, render the
  intended next state immediately on click (e.g. Start → timer starts / Game
  Over → court shows "recording…" or the winner highlighted), using
  `useOptimistic` (or local optimistic state) layered over the existing
  `useTransition`. Reconcile/rollback when the Server Action resolves (on
  `res.error`, revert and show the error already wired up). Apply the same
  pattern to the Add Player flow in `AddToSessionDialog.tsx` /
  `SessionQueuePanel.tsx` where a click currently blocks on the round-trip.
  - **Acceptance:** Tapping Start Game / Game Over produces a visible state
    change within one frame (<100ms perceived), before the server responds.
    Errors still surface and roll back the optimistic state.

- **F4 — Suppress self-inflicted Realtime refresh on the acting device.**
  After an action's `revalidatePath` already refreshes the clicker's view,
  the subsequent Realtime echo of the same write triggers a second full
  reload. Debounce/skip the refresh for changes this device just made (e.g.
  ignore Realtime events within a short window after a local mutation, or tag
  local writes). Keep cross-device sync intact for the genuine remote case.
  - **Acceptance:** A single organizer click results in **one** server reload,
    not two. Other devices (if present) still update.

### Backend Agent

- **B2 — Batch the per-player writes.** Replace the N-update `Promise.all` in
  `persistSessionPlayers()` (`lib/data/liveSessionActions.ts`) with a single
  `upsert` on `session_players` keyed by `(session_id, player_id)`, writing
  `state`, `current_court`, `queue_position`, `games_played` for all players in
  one round-trip. Preserve exact current semantics (waiting vs. playing,
  `queue_position` null for players on court). Follow `database-conventions`
  and `server-actions-pattern` skills; if upsert needs an explicit
  `onConflict`, use the existing unique constraint.
  - **Acceptance:** One DB write replaces N. `npm test` (engine) still green;
    a session with 16 players reconciles state in a single statement.

- **B3 — Trim & parallelize the action reload.** Each action calls
  `loadLiveSession()` which runs 4 sequential queries. (a) Run the independent
  queries in parallel (`Promise.all`) inside `loadLiveSession`. (b) In actions
  that already hold most of what they need, avoid re-fetching redundantly.
  (c) Confirm `getCurrentProfile()` is `cache()`-deduped so the role re-check
  isn't a second round-trip. Keep RLS-correct behavior.
  - **Acceptance:** `loadLiveSession` issues its independent queries
    concurrently; no action does more sequential round-trips than necessary to
    be correct.

### Reviewer Agent (runs last)

- Verify determinism of the rotation engine is untouched (no engine files
  edited; `lib/rotation/` and its tests unchanged unless explicitly needed).
- Verify optimistic state cannot desync the DB source of truth (rollback on
  error proven).
- Verify the batched upsert matches RLS policies and the
  `(session_id, player_id)` constraint; no orphaned/duplicate rows.
- Verify `types/database.ts` still matches if any query shape changed.
- Confirm single-click → single reload (F4) and acceptance criteria above.

## Out of scope

- Moving live-session state off the DB (client-first engine) — explicitly
  deferred (Strategy Y). Document as a future option only.
- Multi-device Realtime fan-out optimization beyond F4 (single-device usage).
- Bundle-size / Framer Motion work unless a profiler flags it.

## Notes for the Orchestrator

- Docker-only workflow: run `npm test`/`lint` via `docker compose run --rm app`.
- F1 and B2 are the highest-impact, lowest-risk wins — prioritize.
- F1 (Frontend) and B2/B3 (Backend) are independent and can run in parallel.
  F4 touches both `RealtimeSync.tsx` and the action layer — coordinate.
