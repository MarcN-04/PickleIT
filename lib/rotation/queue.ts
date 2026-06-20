/**
 * Waiting-queue ordering and helpers.
 *
 * The queue is ordered so that whoever has played the FEWEST games (and, on a
 * tie, has waited longest) is next on. This governs sit-outs whenever the
 * player count exceeds courtCount * 4.
 */

import type { EnginePlayer } from "./types";

/**
 * Sort a set of waiting player ids by fairness:
 *   gamesPlayed ascending, then seq ascending (longest wait), then id (stable).
 */
export function orderQueue(
  ids: string[],
  players: Record<string, EnginePlayer>
): string[] {
  return [...ids].sort((x, y) => {
    const px = players[x];
    const py = players[y];
    return (
      px.gamesPlayed - py.gamesPlayed ||
      px.seq - py.seq ||
      px.id.localeCompare(py.id)
    );
  });
}

/** Take the first `n` ids off the front of the queue; returns [taken, rest]. */
export function takeFront(queue: string[], n: number): [string[], string[]] {
  return [queue.slice(0, n), queue.slice(n)];
}
