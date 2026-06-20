"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageGameplay } from "@/lib/auth/roles";
import type { PairingMode } from "@/types/database";

export type StartSessionResult = { error: string } | undefined;

/**
 * Create a session and enroll the selected players.
 *
 * For now every enrolled player is stored as `waiting` with a provisional
 * queue order (by category strength, then name). The rotation engine (Phase 7)
 * takes this initial roster and assigns courts/teams + the real queue on first
 * run; the live dashboard (Phase 8) triggers that. Keeping enrollment and
 * rotation separate keeps the engine pure and unit-testable.
 */
export async function startSession(formData: FormData): Promise<StartSessionResult> {
  const profile = await getCurrentProfile();
  if (!canManageGameplay(profile?.role)) {
    return { error: "You don't have permission to start a session." };
  }

  const courtCount = Number.parseInt(String(formData.get("court_count") ?? ""), 10);
  const pairingMode = String(formData.get("pairing_mode") ?? "") as PairingMode;
  const playerIds = JSON.parse(String(formData.get("player_ids") ?? "[]")) as string[];

  if (![1, 2, 3].includes(courtCount)) return { error: "Pick 1–3 courts." };
  if (!["balance", "king_of_the_court"].includes(pairingMode)) {
    return { error: "Pick a pairing mode." };
  }
  if (playerIds.length < 4) {
    return { error: "Select at least 4 players to start." };
  }

  const supabase = createClient();

  // Prevent two concurrent active sessions.
  const { data: existing } = await supabase
    .from("sessions")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (existing) {
    return { error: "A session is already active. End it before starting another." };
  }

  const name = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .insert({ name, court_count: courtCount, pairing_mode: pairingMode })
    .select("id")
    .single();
  if (sErr || !session) return { error: sErr?.message ?? "Could not create session." };

  const sessionId = (session as { id: string }).id;

  // Enroll players as waiting with a provisional queue order.
  const rows = playerIds.map((player_id, i) => ({
    session_id: sessionId,
    player_id,
    state: "waiting" as const,
    queue_position: i,
    games_played: 0,
  }));

  const { error: spErr } = await supabase.from("session_players").insert(rows);
  if (spErr) {
    // Roll back the session so we don't leave an empty active one behind.
    await supabase.from("sessions").delete().eq("id", sessionId);
    return { error: spErr.message };
  }

  revalidatePath("/play");
  redirect(`/play/session/${sessionId}`);
}

/** End the active session. */
export async function endSession(sessionId: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!canManageGameplay(profile?.role)) return;

  const supabase = createClient();
  await supabase
    .from("sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", sessionId);

  revalidatePath("/play");
  redirect(`/play/summary/${sessionId}`);
}
