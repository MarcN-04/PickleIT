import { createClient } from "@/lib/supabase/server";
import type { Player, PlayerStats } from "@/types/database";

/** All players, ordered by name. */
export async function getPlayers(): Promise<Player[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data as Player[]) ?? [];
}

/** A single player by id, or null. */
export async function getPlayer(id: string): Promise<Player | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();
  return (data as Player) ?? null;
}

/** Lifetime stats for a single player from the player_stats view. */
export async function getPlayerStats(id: string): Promise<PlayerStats | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("player_stats")
    .select("*")
    .eq("player_id", id)
    .single();
  return (data as PlayerStats) ?? null;
}

/** Lifetime stats for all players (leaderboard + roster annotations). */
export async function getAllPlayerStats(): Promise<PlayerStats[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("player_stats").select("*");
  if (error) throw error;
  return (data as PlayerStats[]) ?? [];
}

export type RecentGame = {
  game_id: string;
  ended_at: string;
  won: boolean;
  session_name: string;
  court_number: number;
};

/**
 * A player's most recent completed games (newest first), with whether they won.
 * Also used to compute the current win streak in the app.
 */
export async function getRecentGames(
  playerId: string,
  limit = 20
): Promise<RecentGame[]> {
  const supabase = createClient();

  // Join from the player's game_players rows -> completed games -> session.
  const { data, error } = await supabase
    .from("game_players")
    .select(
      `team,
       games:game_id!inner (
         id, winner, ended_at, court_number, status,
         sessions:session_id ( name )
       )`
    )
    .eq("player_id", playerId)
    .eq("games.status", "completed")
    .order("ended_at", { foreignTable: "games", ascending: false })
    .limit(limit);

  if (error) throw error;

  // Normalize the nested shape into RecentGame[].
  type Row = {
    team: "a" | "b";
    games: {
      id: string;
      winner: "a" | "b" | null;
      ended_at: string;
      court_number: number;
      sessions: { name: string } | null;
    } | null;
  };

  return ((data as unknown as Row[]) ?? [])
    .filter((r) => r.games)
    .map((r) => ({
      game_id: r.games!.id,
      ended_at: r.games!.ended_at,
      won: r.games!.winner === r.team,
      session_name: r.games!.sessions?.name ?? "Session",
      court_number: r.games!.court_number,
    }));
}

/** Current win streak = count of most-recent consecutive wins (resets on a loss). */
export function currentWinStreak(recent: RecentGame[]): number {
  let streak = 0;
  for (const g of recent) {
    if (g.won) streak++;
    else break;
  }
  return streak;
}
