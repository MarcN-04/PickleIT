"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { endSession } from "@/lib/data/sessionActions";

/** Ends the active session (with a confirm), then redirects to its summary. */
export function EndSessionButton({ sessionId }: { sessionId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("End this session? This can't be undone.")) return;
        startTransition(() => endSession(sessionId));
      }}
    >
      {isPending ? "Ending…" : "End session"}
    </Button>
  );
}
