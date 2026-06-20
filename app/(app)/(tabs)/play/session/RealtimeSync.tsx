"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to live-state changes for a session and refreshes the server
 * components when anything changes, so multiple phones viewing the same session
 * stay in sync. Renders nothing.
 *
 * We listen broadly (all rows on the three live tables) and filter by session
 * where the table carries session_id; game_players has no session_id, so any
 * change there triggers a refresh too (cheap — sessions are small).
 */
export function RealtimeSync({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let scheduled = false;
    const refresh = () => {
      // Debounce a burst of row events into a single refresh.
      if (scheduled) return;
      scheduled = true;
      setTimeout(() => {
        scheduled = false;
        router.refresh();
      }, 150);
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_players" },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, router]);

  return null;
}
