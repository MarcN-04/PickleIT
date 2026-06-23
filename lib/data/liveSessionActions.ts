"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageGameplay } from "@/lib/auth/roles";
import {
  initializeSession,
  applyGameResult,
  type EngineState,
  type EnginePlayer,
  type GameHistoryEntry,
} from "@/lib/rotation";
import { loadLiveSession, toEngineState, groupGamePlayers } from "./liveSession";
import type { PairingMode, TeamSide } from "@/types/database";

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
 * `ensureGamesStarted` fallback below. The `enginePlayers` map is supplied by
 * the caller, which already has the roster in hand — no re-read needed.
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

/**
 * Idempotent fallback to initialize the courts of an active session that has no
 * games yet (e.g. a session created before games were initialized, or one whose
 * inline init failed). The hot path initializes inside `startSession`; this just
 * recovers a games-less session. Does nothing if games already exist.
 */
export async function ensureGamesStarted(sessionId: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!canManageGameplay(profile?.role)) return;

  const supabase = createClient();
  const live = await loadLiveSession(sessionId);
  if (!live || live.session.status !== "active") return;
  if (live.games.length > 0) return; // already initialized

  const engineBefore = toEngineState(live);
  await initializeCourts(
    supabase,
    sessionId,
    live.session.court_count,
    live.session.pairing_mode,
    engineBefore.players
  );

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

  // Targeted lookup of the single pending game on this court — an index hit on
  // the partial unique index games(session_id, court_number) WHERE status in
  // ('pending','in_progress'). No need to load the whole live session.
  const { data: dbGame } = await supabase
    .from("games")
    .select("id")
    .eq("session_id", sessionId)
    .eq("court_number", court)
    .eq("status", "pending")
    .maybeSingle();
  if (!dbGame) return { error: "No pending game on that court." };

  const { error } = await supabase
    .from("games")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", (dbGame as { id: string }).id);
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
  // repeat-avoidance considers what's on court right now. Pre-group game_players
  // by game_id once (O(n)) instead of re-filtering per game (O(n²)).
  const state = toEngineState(live);
  const gpByGame = groupGamePlayers(live.gamePlayers);
  const history: GameHistoryEntry[] = live.games.map((g) => {
    const e = gpByGame.get(g.id) ?? { a: [], b: [] };
    return { teamA: [e.a[0], e.a[1]], teamB: [e.b[0], e.b[1]] };
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

export type LateArrivalCandidate = {
  id: string;
  name: string;
  category: import("@/lib/categories").Category;
};

/**
 * Roster players not currently active in this session — the candidates for a
 * late arrival. Loaded on demand when the "Late arrival" dialog opens, so the
 * live page never blocks its courts render on a full roster query.
 */
export async function getLateArrivalCandidates(
  sessionId: string
): Promise<LateArrivalCandidate[]> {
  const profile = await getCurrentProfile();
  if (!canManageGameplay(profile?.role)) return [];

  const supabase = createClient();

  // Active player ids in this session (anyone not 'left').
  const { data: active } = await supabase
    .from("session_players")
    .select("player_id, state")
    .eq("session_id", sessionId);
  const activeIds = new Set(
    (active ?? [])
      .filter((sp) => (sp as { state: string }).state !== "left")
      .map((sp) => (sp as { player_id: string }).player_id)
  );

  const { data: roster } = await supabase
    .from("players")
    .select("id, name, category")
    .order("name");

  return ((roster ?? []) as LateArrivalCandidate[]).filter(
    (p) => !activeIds.has(p.id)
  );
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
