"use client";

/**
 * Purely client-side signal so the acting (organizer) device can suppress the
 * redundant Realtime echo of its OWN writes.
 *
 * Flow: a gameplay action already calls `revalidatePath` on the server, which
 * refreshes the clicker's view directly. ~150ms later the same write echoes
 * back over Realtime and would trigger a SECOND full reload. The components
 * that own those click handlers (CourtCard, AddToSessionDialog) call
 * `markLocalMutation()` the instant the user taps; RealtimeSync skips
 * `router.refresh()` for any event that arrives inside the suppression window.
 *
 * A genuine REMOTE change (another device) never sets this timestamp on THIS
 * device, so its events fall outside the window and still refresh — cross-device
 * sync is preserved.
 */

// Module-level so every component instance on this device shares one window.
let lastLocalMutationAt = 0;

/**
 * Window (ms) after a local tap during which Realtime echoes are ignored.
 * Must comfortably exceed the action round-trip + the 150ms Realtime debounce
 * so the self-echo lands inside it, while staying short enough that a genuine
 * remote change arriving right after a local action is not swallowed for long.
 */
export const LOCAL_MUTATION_WINDOW_MS = 2500;

/** Call the instant the user triggers a local gameplay/add-player mutation. */
export function markLocalMutation(): void {
  lastLocalMutationAt = Date.now();
}

/**
 * True if a local mutation was triggered on this device within the window —
 * i.e. an incoming Realtime event is most likely the echo of our own write.
 */
export function wasRecentLocalMutation(): boolean {
  return Date.now() - lastLocalMutationAt < LOCAL_MUTATION_WINDOW_MS;
}
