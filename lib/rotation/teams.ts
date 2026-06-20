/**
 * Team formation for a court of 4 players.
 *
 * Goal: split 4 players into two 2v2 teams that are as balanced as possible by
 * combined skill weight. There are exactly 3 distinct ways to pair 4 players;
 * we evaluate all three and pick the most balanced, breaking ties by:
 *   1) repeat-avoidance (prefer pairings not seen in recent history), then
 *   2) ascending player id (fully deterministic for tests).
 */

import { SKILL_WEIGHT } from "@/lib/categories";
import type { EnginePlayer, GameHistoryEntry, TeamSide } from "./types";

export type Pairing = {
  teamA: [string, string];
  teamB: [string, string];
};

/** The 3 ways to partition [p0,p1,p2,p3] into two pairs. */
function enumeratePairings(ids: [string, string, string, string]): Pairing[] {
  const [a, b, c, d] = ids;
  return [
    { teamA: [a, b], teamB: [c, d] },
    { teamA: [a, c], teamB: [b, d] },
    { teamA: [a, d], teamB: [b, c] },
  ];
}

function teamWeight(
  team: [string, string],
  players: Record<string, EnginePlayer>
): number {
  return team.reduce((sum, id) => sum + SKILL_WEIGHT[players[id].category], 0);
}

/** Canonical key for a 2-player set, order-independent. */
function pairKey(pair: [string, string]): string {
  return [...pair].sort().join("|");
}

/**
 * How many of this pairing's partnerships appeared in recent history.
 * Lower is better (fresher partnerships). We look back a small window so the
 * avoidance is "soft" and never blocks progress.
 */
function repeatPenalty(
  pairing: Pairing,
  history: GameHistoryEntry[],
  window = 4
): number {
  const recent = history.slice(0, window);
  const recentPartnerKeys = new Set<string>();
  for (const h of recent) {
    recentPartnerKeys.add(pairKey(h.teamA));
    recentPartnerKeys.add(pairKey(h.teamB));
  }
  let penalty = 0;
  if (recentPartnerKeys.has(pairKey(pairing.teamA))) penalty++;
  if (recentPartnerKeys.has(pairKey(pairing.teamB))) penalty++;
  return penalty;
}

/** Stable id-based tiebreak signature for a pairing. */
function deterministicKey(pairing: Pairing): string {
  const a = pairKey(pairing.teamA);
  const b = pairKey(pairing.teamB);
  return [a, b].sort().join("#");
}

/**
 * Choose the most balanced pairing for exactly 4 player ids.
 * Returns teamA/teamB (assignment of which is "A" is deterministic: the team
 * whose sorted-id key is smaller becomes team A, so output is stable).
 */
export function bestPairing(
  fourIds: [string, string, string, string],
  players: Record<string, EnginePlayer>,
  history: GameHistoryEntry[]
): Pairing {
  const candidates = enumeratePairings(fourIds).map((p) => {
    const diff = Math.abs(teamWeight(p.teamA, players) - teamWeight(p.teamB, players));
    return {
      pairing: p,
      diff,
      repeat: repeatPenalty(p, history),
      key: deterministicKey(p),
    };
  });

  candidates.sort(
    (x, y) =>
      x.diff - y.diff || x.repeat - y.repeat || x.key.localeCompare(y.key)
  );

  // Normalize team A/B so the smaller-keyed pair is always team A (stable).
  const chosen = candidates[0].pairing;
  const aKey = pairKey(chosen.teamA);
  const bKey = pairKey(chosen.teamB);
  return aKey <= bKey
    ? { teamA: chosen.teamA, teamB: chosen.teamB }
    : { teamA: chosen.teamB, teamB: chosen.teamA };
}

/** Did `team` win, given the winning side? */
export function teamWon(side: TeamSide, winner: TeamSide): boolean {
  return side === winner;
}
