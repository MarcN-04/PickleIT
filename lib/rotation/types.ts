/**
 * Pure rotation-engine types. Deliberately UI- and DB-agnostic: the engine
 * takes a plain snapshot of the session state and returns a new snapshot, so it
 * can be unit-tested in isolation. The app maps these to/from Supabase rows.
 */

import type { Category } from "@/lib/categories";

export type PairingMode = "balance" | "king_of_the_court";
export type TeamSide = "a" | "b";

/** A player as the engine needs to see them. */
export interface EnginePlayer {
  id: string;
  category: Category;
  /** In-session games played — the fairness counter. */
  gamesPlayed: number;
  /**
   * Monotonic enrollment/arrival order. Lower = arrived earlier. Used as the
   * "longest wait" tiebreaker and to keep ordering deterministic. Late arrivals
   * get a higher value than everyone present.
   */
  seq: number;
}

/** A 2v2 game currently on a court. */
export interface EngineGame {
  court: number; // 1-based court number
  teamA: [string, string]; // player ids
  teamB: [string, string]; // player ids
}

/**
 * Full engine state snapshot.
 * - courtCount: how many courts are active (1–3).
 * - games: current in-progress games (one per occupied court).
 * - queue: waiting player ids, FRONT = next up (index 0).
 * - players: every active player by id (state lives in courts+queue; this is
 *   the lookup for category/gamesPlayed/seq).
 * - history: recent completed pairings, for soft repeat-avoidance.
 */
export interface EngineState {
  courtCount: number;
  mode: PairingMode;
  games: EngineGame[];
  queue: string[];
  players: Record<string, EnginePlayer>;
  /** Most-recent-first list of partner/opponent sets per past game. */
  history: GameHistoryEntry[];
}

/** A record of who partnered/opposed whom, for repeat-avoidance. */
export interface GameHistoryEntry {
  teamA: [string, string];
  teamB: [string, string];
}

/** Result of completing a game: the engine returns the next state. */
export interface GameResult {
  court: number;
  winner: TeamSide;
}
