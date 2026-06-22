import { createClient } from "@/lib/supabase/server";
import type {
  Session,
  SessionPlayer,
  Game,
  GamePlayer,
  Player,
} from "@/types/database";
import type { EnginePlayer, EngineState, EngineGame } from "@/lib/rotation";

/**
 * The full live state of a session as the dashboard renders it and the engine
 * consumes it: session row, enrolled players (with their player record), the
 * in-progress games, and their team rosters.
 */
export interface LiveSessionState {
  session: Session;
  sessionPlayers: Array<SessionPlayer & { player: Player }>;
  games: Game[]; // pending + in_progress
  gamePlayers: GamePlayer[];
}

/** Load everything needed to render and drive the live dashboard. */
export async function loadLiveSession(
  sessionId: string
): Promise<LiveSessionState | null> {
  const supabase = createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  if (!session) return null;

  const { data: sps } = await supabase
    .from("session_players")
    .select("*, player:player_id (*)")
    .eq("session_id", sessionId);

  const { data: games } = await supabase
    .from("games")
    .select("*")
    .eq("session_id", sessionId)
    .in("status", ["pending", "in_progress"]);

  const gameIds = (games ?? []).map((g) => (g as Game).id);
  let gamePlayers: GamePlayer[] = [];
  if (gameIds.length) {
    const { data: gps } = await supabase
      .from("game_players")
      .select("*")
      .in("game_id", gameIds);
    gamePlayers = (gps as GamePlayer[]) ?? [];
  }

  return {
    session: session as Session,
    sessionPlayers:
      (sps as unknown as Array<SessionPlayer & { player: Player }>) ?? [],
    games: (games as Game[]) ?? [],
    gamePlayers,
  };
}

/**
 * Build the pure-engine snapshot from the live DB state.
 * - seq: derived from session_players.created_at order (stable arrival order).
 * - queue: waiting players ordered by queue_position.
 * - games: in-progress games mapped to engine games (teams a/b).
 */
export function toEngineState(live: LiveSessionState): EngineState {
  const players: Record<string, EnginePlayer> = {};

  // Stable seq from enrollment order.
  const bySeq = [...live.sessionPlayers].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );
  bySeq.forEach((sp, i) => {
    if (sp.state === "left") return; // excluded from the active set
    players[sp.player_id] = {
      id: sp.player_id,
      category: sp.player.category,
      gamesPlayed: sp.games_played,
      seq: i,
    };
  });

  const queue = live.sessionPlayers
    .filter((sp) => sp.state === "waiting")
    .sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0))
    .map((sp) => sp.player_id);

  const games: EngineGame[] = live.games.map((g) => {
    const teamA = live.gamePlayers
      .filter((gp) => gp.game_id === g.id && gp.team === "a")
      .map((gp) => gp.player_id);
    const teamB = live.gamePlayers
      .filter((gp) => gp.game_id === g.id && gp.team === "b")
      .map((gp) => gp.player_id);
    return {
      court: g.court_number,
      teamA: [teamA[0], teamA[1]] as [string, string],
      teamB: [teamB[0], teamB[1]] as [string, string],
    };
  });

  return {
    courtCount: live.session.court_count,
    mode: live.session.pairing_mode,
    games: games.sort((a, b) => a.court - b.court),
    queue,
    players,
    history: [], // history is recomputed from games in the engine call site
  };
}
