"use client";

import { useEffect, useState } from "react";

/**
 * Persistent count-up timer. Elapsed time is derived from `startedAt` (the DB
 * value), so it survives refresh and reads identically across synced devices.
 */
export function GameTimer({ startedAt }: { startedAt: string }) {
  const start = new Date(startedAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = Math.max(0, Math.floor((now - start) / 1000));
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <span
      className="font-heading text-sm font-semibold tabular-nums text-ink/70"
      aria-label="Game time"
    >
      {mm}:{ss}
    </span>
  );
}
