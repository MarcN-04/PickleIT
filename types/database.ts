/**
 * Hand-maintained types mirroring the SQL schema in supabase/migrations/.
 * (Kept hand-written rather than generated so the project doesn't require the
 * Supabase CLI in the Docker-only workflow. Keep in sync with the migrations.)
 */

import type { Category } from "@/lib/categories";

export type PairingMode = "balance" | "king_of_the_court";
export type SessionStatus = "active" | "ended";
export type SessionPlayerState = "playing" | "waiting" | "left";
export type GameStatus = "in_progress" | "completed";
export type TeamSide = "a" | "b";
export type UserRole = "admin" | "organizer" | "viewer" | "pending";

export interface Player {
  id: string;
  name: string;
  age: number | null;
  category: Category;
  created_at: string;
}

export interface Session {
  id: string;
  name: string;
  court_count: number;
  pairing_mode: PairingMode;
  status: SessionStatus;
  created_at: string;
  ended_at: string | null;
}

export interface SessionPlayer {
  id: string;
  session_id: string;
  player_id: string;
  state: SessionPlayerState;
  current_court: number | null;
  queue_position: number | null;
  games_played: number;
  created_at: string;
}

export interface Game {
  id: string;
  session_id: string;
  court_number: number;
  status: GameStatus;
  winner: TeamSide | null;
  started_at: string;
  ended_at: string | null;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  player_id: string;
  team: TeamSide;
}

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface AppSettings {
  id: number;
  default_pairing_mode: PairingMode;
  default_court_count: number;
  label_beginner: string;
  label_intermediate: string;
  label_pro: string;
  updated_at: string;
}

/** Row shape of the player_stats view. */
export interface PlayerStats {
  player_id: string;
  name: string;
  category: Category;
  games: number;
  wins: number;
  losses: number;
  win_rate: number;
}
