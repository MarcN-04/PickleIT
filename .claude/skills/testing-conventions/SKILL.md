---
name: testing-conventions
description: Use this skill before writing, editing, or reviewing any test in PickleIT.
---
## Test scope
- Tests cover lib/rotation/ only — the pure engine
- No test setup for React components
- Vitest configured in vitest.config.ts to include lib/**/*.test.ts
- Runs in node environment

## Run commands (always through Docker)
- All tests: docker compose run --rm app npm test
- Single test: docker compose run --rm app npm test -- -t "test name"
- Watch mode: docker compose run --rm app npm run test:watch

## What to test
- Deterministic output: same input → same output every time
- Queue ordering: gamesPlayed asc → seq asc → id
- Pairing: skill balance, repeat-avoidance, stable id-based output
- King of the court: winners split onto opposite teams, not re-paired together
- Edge cases: minimum players, exact court fill, late arrivals

## What not to test
- UI behavior
- Supabase queries
- Server Actions
- Anything that imports from outside lib/rotation/

## Hard invariants to assert in tests
- No Math.random() or Date.now() in engine output
- Input state is never mutated — always a new EngineState returned
- All ordering falls back to player id as final tiebreaker
