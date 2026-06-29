---
name: realtime-patterns
description: Use this skill when adding, editing, or reviewing any Realtime subscription in PickleIT.
---
## How Realtime works in this project
- Component: components/RealtimeSync.tsx
- Subscribes to: session_players, games, game_players
- On any change: calls router.refresh() with a debounce
- Live state is reconstructed from the DB on every render — the DB is the source of truth

## Rules
- Never remove or shorten the debounce on router.refresh() — rapid refreshes cause flicker and excess DB reads
- Every new Realtime subscription must have a cleanup function on unmount
- Do not subscribe to tables outside the three above without explicit discussion
- Do not manage local state that mirrors Realtime data — let the server re-render handle it

## Adding a new subscription
```ts
useEffect(() => {
  const channel = supabase
    .channel("channel-name")
    .on("postgres_changes", { event: "*", schema: "public", table: "your_table" }, () => {
      debouncedRefresh()
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [supabase, debouncedRefresh])
```
