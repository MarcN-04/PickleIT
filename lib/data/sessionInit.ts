import { createClient } from "@/lib/supabase/server";
import { initializeSession, type EngineState, type EnginePlayer } from "@/lib/rotation";
import type { PairingMode } from "@/types/database";

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Shared server-side session-init helpers. These take a Supabase client and so
 * MUST NOT live in a "use server" module: every export there becomes a callable
 * Server Action, which requires serializable args — a SupabaseClient is not.
 * The action files (sessionActions, liveSessionActions) import from here.
 */

/**
 * Reconcile an EngineState to the DB session_players rows: who is playing on
 * which court, who is waiting at which queue position, and their games_played.
 * (games / game_players are written separately by the callers.)
 */
export async function persistSessionPlayers(
  supabase: SupabaseClient,
  sessionId: string,
  state: EngineState
) {
  // Map player_id -> { state, current_court } from the current games.
  const onCourt = new Map<string, number>();
  for (const g of state.games) {
    for (const id of [...g.teamA, ...g.teamB]) onCourt.set(id, g.court);
  }
  const queuePos = new Map<string, number>();
  state.queue.forEach((id, i) => queuePos.set(id, i));

  // One update per player. (Small N — a handful of players per session.)
  const updates = Object.values(state.players).map((p) => {
    const court = onCourt.get(p.id);
    if (court != null) {
      return {
        player_id: p.id,
        state: "playing" as const,
        current_court: court,
        queue_position: null as number | null,
        games_played: p.gamesPlayed,
      };
    }
    return {
      player_id: p.id,
      state: "waiting" as const,
      current_court: null as number | null,
      queue_position: queuePos.get(p.id) ?? null,
      games_played: p.gamesPlayed,
    };
  });

  await Promise.all(
    updates.map((u) =>
      supabase
        .from("session_players")
        .update({
          state: u.state,
          current_court: u.current_court,
          queue_position: u.queue_position,
          games_played: u.games_played,
        })
        .eq("session_id", sessionId)
        .eq("player_id", u.player_id)
    )
  );
}

/** Insert a fresh pending game + its 4 game_players rows. */
export async function insertGame(
  supabase: SupabaseClient,
  sessionId: string,
  court: number,
  teamA: [string, string],
  teamB: [string, string]
) {
  const { data: game, error } = await supabase
    .from("games")
    .insert({ session_id: sessionId, court_number: court, status: "pending" })
    .select("id")
    .single();
  if (error || !game) throw error ?? new Error("game insert failed");

  const gameId = (game as { id: string }).id;
  const rows = [
    { game_id: gameId, player_id: teamA[0], team: "a" as const },
    { game_id: gameId, player_id: teamA[1], team: "a" as const },
    { game_id: gameId, player_id: teamB[0], team: "b" as const },
    { game_id: gameId, player_id: teamB[1], team: "b" as const },
  ];
  const { error: gpErr } = await supabase.from("game_players").insert(rows);
  if (gpErr) throw gpErr;
}

/**
 * Run the engine's session initializer and persist the initial courts + queue.
 * Shared by `startSession` (the hot path, called right after enrollment so the
 * first live-page build already has games) and the idempotent
 * `ensureGamesStarted` fallback. The `enginePlayers` map is supplied by the
 * caller, which already has the roster in hand — no re-read needed.
 *
 * Games for each court are inserted concurrently (courts are independent); each
 * insert keeps its own ordering (game row before its 4 game_players).
 */
export async function initializeCourts(
  supabase: SupabaseClient,
  sessionId: string,
  courtCount: number,
  pairingMode: PairingMode,
  enginePlayers: Record<string, EnginePlayer>
): Promise<void> {
  const state = initializeSession(enginePlayers, courtCount, pairingMode);

  await Promise.all(
    state.games.map((g) =>
      insertGame(supabase, sessionId, g.court, g.teamA, g.teamB)
    )
  );
  await persistSessionPlayers(supabase, sessionId, state);
}
