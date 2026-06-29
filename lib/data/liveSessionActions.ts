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

  // Build one row per player. These rows always already exist (this function
  // only reconciles enrolled players), so the upsert resolves to an UPDATE via
  // the (session_id, player_id) unique constraint. session_id + player_id are
  // included as the conflict key; the four reconciled columns carry the same
  // values the per-player UPDATEs wrote before.
  const rows = Object.values(state.players).map((p) => {
    const court = onCourt.get(p.id);
    if (court != null) {
      return {
        session_id: sessionId,
        player_id: p.id,
        state: "playing" as const,
        current_court: court,
        queue_position: null as number | null,
        games_played: p.gamesPlayed,
      };
    }
    return {
      session_id: sessionId,
      player_id: p.id,
      state: "waiting" as const,
      current_court: null as number | null,
      queue_position: queuePos.get(p.id) ?? null,
      games_played: p.gamesPlayed,
    };
  });

  if (rows.length === 0) return;

  // Single round-trip: ON CONFLICT (session_id, player_id) DO UPDATE.
  const { error } = await supabase
    .from("session_players")
    .upsert(rows, { onConflict: "session_id,player_id" });
  if (error) throw error;
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
 * Promote the pending game on `court` to in_progress, starting its timer now.
 */
export async function startGame(
  sessionId: string,
  court: number
): Promise<{ error: string } | void> {
  const profile = await getCurrentProfile();
  if (!canManageGameplay(profile?.role)) {
    return { error: "You don't have permission to start games." };
  }

  const supabase = createClient();
  const live = await loadLiveSession(sessionId);
  if (!live || live.session.status !== "active") {
    return { error: "Session is not active." };
  }

  const dbGame = live.games.find(
    (g) => g.court_number === court && g.status === "pending"
  );
  if (!dbGame) return { error: "No pending game on that court." };

  const { error } = await supabase
    .from("games")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", dbGame.id);
  if (error) return { error: error.message };

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
  if (dbGame.status !== "in_progress") {
    return { error: "Game hasn't started yet." };
  }

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
