"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ensureGamesStarted } from "@/lib/data/liveSessionActions";

/**
 * Fires once on mount to initialize the courts via the rotation engine when a
 * freshly-started session has no games yet. Only organizers/admins can do this
 * (the action enforces it); viewers just wait for Realtime to show the courts.
 */
export function AutoInit({
  sessionId,
  needsInit,
}: {
  sessionId: string;
  needsInit: boolean;
}) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (!needsInit || ran.current) return;
    ran.current = true;
    (async () => {
      await ensureGamesStarted(sessionId);
      router.refresh();
    })();
  }, [needsInit, sessionId, router]);

  return null;
}
