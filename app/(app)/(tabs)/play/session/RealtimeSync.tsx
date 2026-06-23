"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to live-state changes for a session and refreshes the server
 * components when anything changes, so multiple phones viewing the same session
 * stay in sync. Renders nothing.
 *
 * We listen to session_players and games, both filtered by session_id. We do
 * NOT listen to game_players: it has no session_id column (an unfiltered
 * listener would refresh THIS session on every game_players write in ANY
 * session). Every game_players write here is always paired with a session-
 * scoped games insert (insertGame) and session_players updates
 * (persistSessionPlayers), so the two filtered listeners already cover every
 * transition.
 */
export function RealtimeSync({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let scheduled = false;
    const refresh = () => {
      // Coalesce the burst of row events from a single action (a game over
      // writes games + session_players together) into one refresh. Kept short
      // so cross-device sync stays snappy; the acting device already updated
      // optimistically and doesn't feel this at all.
      if (scheduled) return;
      scheduled = true;
      setTimeout(() => {
        scheduled = false;
        router.refresh();
      }, 40);
    };

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_players",
          filter: `session_id=eq.${sessionId}`,
        },
        refresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `session_id=eq.${sessionId}`,
        },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, router]);

  return null;
}
