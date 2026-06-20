"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageGameplay } from "@/lib/auth/roles";
import {
  initializeSession,
  applyGameResult,
  type EngineState,
  type GameHistoryEntry,
} from "@/lib/rotation";
import { loadLiveSession, toEngineState } from "./liveSession";
import type { TeamSide } from "@/types/database";

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Reconcile an EngineState to the DB session_players rows: who is playing on
 * which court, who is waiting at which queue position, and their games_played.
 * (games / game_players are written separately by the callers.)
 */
async function persistSessionPlayers(
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

/** Insert a fresh in-progress game + its 4 game_players rows. */
async function insertGame(
  supabase: SupabaseClient,
  sessionId: string,
  court: number,
  teamA: [string, string],
  teamB: [string, string]
) {
  const { data: game, error } = await supabase
    .from("games")
    .insert({ session_id: sessionId, court_number: court, status: "in_progress" })
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
 * On first dashboard load (no in-progress games yet), run the engine's session
 * initializer and persist the initial courts + queue. Idempotent: if games
 * already exist, does nothing.
 */
export async function ensureGamesStarted(sessionId: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!canManageGameplay(profile?.role)) return;

  const supabase = createClient();
  const live = await loadLiveSession(sessionId);
  if (!live || live.session.status !== "active") return;
  if (live.games.length > 0) return; // already initialized

  const engineBefore = toEngineState(live);
  const state = initializeSession(
    engineBefore.players,
    live.session.court_count,
    live.session.pairing_mode
  );

  // Persist new games, then reconcile player states.
  for (const g of state.games) {
    await insertGame(supabase, sessionId, g.court, g.teamA, g.teamB);
  }
  await persistSessionPlayers(supabase, sessionId, state);

  revalidatePath(`/play/session/${sessionId}`);
}

/**
 * Record a winner for the game on `court`: completes that game, runs the engine
 * for the chosen pairing mode, then persists the freed/refilled court and the
 * updated queue + games_played.
 */
export async function recordWinner(
  sessionId: string,
  court: number,
  winner: TeamSide
): Promise<{ error: string } | void> {
  const profile = await getCurrentProfile();
  if (!canManageGameplay(profile?.role)) {
    return { error: "You don't have permission to record results." };
  }

  const supabase = createClient();
  const live = await loadLiveSession(sessionId);
  if (!live || live.session.status !== "active") {
    return { error: "Session is not active." };
  }

  const dbGame = live.games.find((g) => g.court_number === court);
  if (!dbGame) return { error: "No active game on that court." };

  // Build engine state and seed history from the current games so
  // repeat-avoidance considers what's on court right now.
  const state = toEngineState(live);
  const history: GameHistoryEntry[] = live.games.map((g) => {
    const a = live.gamePlayers.filter((gp) => gp.game_id === g.id && gp.team === "a").map((gp) => gp.player_id);
    const b = live.gamePlayers.filter((gp) => gp.game_id === g.id && gp.team === "b").map((gp) => gp.player_id);
    return { teamA: [a[0], a[1]], teamB: [b[0], b[1]] };
  });
  const seeded: EngineState = { ...state, history };

  const next = applyGameResult(seeded, { court, winner });

  // 1) Complete the finished game.
  const { error: cErr } = await supabase
    .from("games")
    .update({ status: "completed", winner, ended_at: new Date().toISOString() })
    .eq("id", dbGame.id);
  if (cErr) return { error: cErr.message };

  // 2) Insert the new game on this court (if the engine put one there).
  const newGame = next.games.find((g) => g.court === court);
  if (newGame) {
    await insertGame(supabase, sessionId, court, newGame.teamA, newGame.teamB);
  }

  // 3) Reconcile all player states / queue / games_played.
  await persistSessionPlayers(supabase, sessionId, next);

  revalidatePath(`/play/session/${sessionId}`);
}

/**
 * Add a late arrival to a running session: enroll them at the BACK of the
 * waiting queue. If they were previously in the session and left, re-activate.
 */
export async function addPlayerToSession(
  sessionId: string,
  playerId: string
): Promise<{ error: string } | void> {
  const profile = await getCurrentProfile();
  if (!canManageGameplay(profile?.role)) {
    return { error: "You don't have permission to add players." };
  }

  const supabase = createClient();
  const live = await loadLiveSession(sessionId);
  if (!live || live.session.status !== "active") {
    return { error: "Session is not active." };
  }

  // Already enrolled and active?
  const existing = live.sessionPlayers.find((sp) => sp.player_id === playerId);
  const maxQueue = Math.max(
    -1,
    ...live.sessionPlayers
      .filter((sp) => sp.state === "waiting")
      .map((sp) => sp.queue_position ?? 0)
  );
  const backPosition = maxQueue + 1;

  if (existing) {
    if (existing.state !== "left") return { error: "Player is already in the session." };
    const { error } = await supabase
      .from("session_players")
      .update({ state: "waiting", queue_position: backPosition, current_court: null })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("session_players").insert({
      session_id: sessionId,
      player_id: playerId,
      state: "waiting",
      queue_position: backPosition,
      games_played: 0,
    });
    if (error) return { error: error.message };
  }

  revalidatePath(`/play/session/${sessionId}`);
}
