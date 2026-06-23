"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ensureGamesStarted } from "@/lib/data/liveSessionActions";

/**
 * Recovery fallback: fires once on mount to initialize the courts via the
 * rotation engine ONLY when a session has no games yet. The happy path now
 * initializes courts inline in `startSession`, so this normally does nothing
 * (needsInit is false). It exists to recover the rare case where the inline
 * init failed, leaving an active games-less session. Only organizers/admins can
 * do this (the action enforces it); viewers just wait for Realtime.
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
