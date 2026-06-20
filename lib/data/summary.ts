import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/categories";

export interface SummaryGame {
  gameId: string;
  court: number;
  endedAt: string | null;
  teamA: Array<{ name: string; category: Category }>;
  teamB: Array<{ name: string; category: Category }>;
  winner: "a" | "b" | null;
}

export interface SessionSummary {
  totalGames: number;
  games: SummaryGame[];
  /** Players sorted by wins this session. */
  topPlayers: Array<{ name: string; wins: number; games: number }>;
}

/**
 * Recap of a finished (or in-progress) session: every completed game with its
 * teams and winner, plus a per-player win tally for the session.
 */
export async function getSessionSummary(
  sessionId: string
): Promise<SessionSummary> {
  const supabase = createClient();

  const { data: games } = await supabase
    .from("games")
    .select("id, court_number, ended_at, winner, status")
    .eq("session_id", sessionId)
    .eq("status", "completed")
    .order("ended_at", { ascending: true });

  const completed = (games ?? []) as Array<{
    id: string;
    court_number: number;
    ended_at: string | null;
    winner: "a" | "b" | null;
  }>;

  const gameIds = completed.map((g) => g.id);
  let rosters: Array<{
    game_id: string;
    team: "a" | "b";
    player: { name: string; category: Category };
  }> = [];

  if (gameIds.length) {
    const { data } = await supabase
      .from("game_players")
      .select("game_id, team, player:player_id (name, category)")
      .in("game_id", gameIds);
    rosters = (data as unknown as typeof rosters) ?? [];
  }

  const winTally = new Map<string, { name: string; wins: number; games: number }>();

  const summaryGames: SummaryGame[] = completed.map((g) => {
    const mine = rosters.filter((r) => r.game_id === g.id);
    const teamA = mine.filter((r) => r.team === "a").map((r) => r.player);
    const teamB = mine.filter((r) => r.team === "b").map((r) => r.player);

    for (const r of mine) {
      const key = r.player.name;
      const cur = winTally.get(key) ?? { name: r.player.name, wins: 0, games: 0 };
      cur.games += 1;
      if (g.winner === r.team) cur.wins += 1;
      winTally.set(key, cur);
    }

    return {
      gameId: g.id,
      court: g.court_number,
      endedAt: g.ended_at,
      teamA,
      teamB,
      winner: g.winner,
    };
  });

  const topPlayers = [...winTally.values()].sort(
    (a, b) => b.wins - a.wins || b.games - a.games || a.name.localeCompare(b.name)
  );

  return { totalGames: completed.length, games: summaryGames, topPlayers };
}
