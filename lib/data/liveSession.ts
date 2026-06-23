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

  // These three are independent — run them in one parallel wave. Only
  // game_players depends on the resulting game ids, so it follows as wave two.
  const [{ data: session }, { data: sps }, { data: games }] = await Promise.all([
    supabase.from("sessions").select("*").eq("id", sessionId).single(),
    supabase
      .from("session_players")
      .select("*, player:player_id (*)")
      .eq("session_id", sessionId),
    supabase
      .from("games")
      .select("*")
      .eq("session_id", sessionId)
      .in("status", ["pending", "in_progress"]),
  ]);
  if (!session) return null;

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
 * Group game_players by game_id into team rosters once, so callers can index by
 * game_id in O(1) instead of re-filtering the whole array per game (O(n²)).
 */
export function groupGamePlayers(
  gamePlayers: GamePlayer[]
): Map<string, { a: string[]; b: string[] }> {
  const byGame = new Map<string, { a: string[]; b: string[] }>();
  for (const gp of gamePlayers) {
    let entry = byGame.get(gp.game_id);
    if (!entry) {
      entry = { a: [], b: [] };
      byGame.set(gp.game_id, entry);
    }
    (gp.team === "a" ? entry.a : entry.b).push(gp.player_id);
  }
  return byGame;
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

  const gpByGame = groupGamePlayers(live.gamePlayers);
  const games: EngineGame[] = live.games.map((g) => {
    const e = gpByGame.get(g.id) ?? { a: [], b: [] };
    return {
      court: g.court_number,
      teamA: [e.a[0], e.a[1]] as [string, string],
      teamB: [e.b[0], e.b[1]] as [string, string],
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
