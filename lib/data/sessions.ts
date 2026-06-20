import { createClient } from "@/lib/supabase/server";
import type { Session, SessionPlayer, Player } from "@/types/database";

/** The current active session, or null if none is running. */
export async function getActiveSession(): Promise<Session | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Session) ?? null;
}

/** A session by id. */
export async function getSession(id: string): Promise<Session | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();
  return (data as Session) ?? null;
}

export type SessionPlayerWithPlayer = SessionPlayer & { player: Player };

/** All session_players for a session, joined with their player record. */
export async function getSessionPlayers(
  sessionId: string
): Promise<SessionPlayerWithPlayer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("session_players")
    .select("*, player:player_id (*)")
    .eq("session_id", sessionId);
  if (error) throw error;
  return (data as unknown as SessionPlayerWithPlayer[]) ?? [];
}
