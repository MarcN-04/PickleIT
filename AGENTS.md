# AGENTS.md

State file for the PickleIT Loop Engineering system.
The Orchestrator appends a new block here for every feature run.
Do not edit manually during an active run.

## How it works
1. You → Interviewer agent → spec file in .claude/tasks/
2. Spec approved → Orchestrator picks it up automatically
3. Orchestrator creates worktrees and delegates to specialized agents
4. Reviewer runs last
5. Orchestrator cleans up worktrees and marks this file Done

---

## Run History

### [2026-06-29] - Live Session Performance

Spec: .claude/tasks/004-LiveSessionPerformance.md
Worktrees: backend/live-session-perf (c88ccce), frontend/live-session-perf (8c006c5)
Tasks: F1 + F4 (Frontend), B2 + B3 (Backend), Reviewer (last)
Status: Done

- B2 — `persistSessionPlayers()` now does ONE upsert (onConflict
  session_id,player_id) instead of N UPDATEs.
- B3 — `loadLiveSession()` runs its 3 independent queries via Promise.all;
  `getCurrentProfile()` already React-cache-deduped (no change).
- F1 — `useOptimistic` overlay in CourtCard (instant Start/Game Over) +
  AddToSessionDialog (instant candidate hide); rolls back on error.
- F4 — `localMutation.ts` window suppresses the acting device's own Realtime
  echo so a single click triggers ONE reload, not two.
- Reviewer (run on the merged result): 19/19 engine tests pass, ESLint clean,
  `tsc --noEmit` clean. Rotation engine untouched; optimistic state is
  presentation-only (cannot desync DB); upsert RLS-equivalent to prior UPDATEs.

Note: both worktree agents stalled mid-run; work was recovered from their
committed branches and merged (no conflicts — disjoint files). Worktrees at
.worktrees/backend-perf and .worktrees/frontend-perf are retained for now.
