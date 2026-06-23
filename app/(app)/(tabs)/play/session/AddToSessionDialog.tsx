"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button, CategoryBadge } from "@/components/ui";
import {
  addPlayerToSession,
  getLateArrivalCandidates,
  type LateArrivalCandidate as Candidate,
} from "@/lib/data/liveSessionActions";

/**
 * Drop a late arrival into the running session. Lists roster players not already
 * enrolled; tapping one enrolls them at the back of the queue. Candidates load
 * on demand when the dialog opens, so the live page doesn't block its courts
 * render on a roster query that's only needed here.
 */
export function AddToSessionDialog({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);

  // Fetch the roster the first time the dialog opens (and refetch each open so
  // it reflects who's already in the session now).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCandidates(null);
    getLateArrivalCandidates(sessionId).then((list) => {
      if (!cancelled) setCandidates(list);
    });
    return () => {
      cancelled = true;
    };
  }, [open, sessionId]);

  function add(playerId: string) {
    setError(null);
    startTransition(async () => {
      const res = await addPlayerToSession(sessionId, playerId);
      if (res?.error) setError(res.error);
      else {
        router.refresh();
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button variant="glass" size="sm" onClick={() => setOpen(true)}>
        + Late arrival
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/20 p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isPending && setOpen(false)}
          >
            <motion.div
              className="glass max-h-[70vh] w-full max-w-md overflow-y-auto rounded-glass-lg p-5"
              initial={{ y: 24, scale: 0.97, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 24, scale: 0.97, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-3 font-heading text-lg font-bold text-ink">
                Add a late arrival
              </h2>

              {candidates === null ? (
                <p className="py-6 text-center text-sm text-ink/70">Loading roster…</p>
              ) : candidates.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink/70">
                  Everyone in the roster is already in this session.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {candidates.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => add(c.id)}
                        disabled={isPending}
                        className="glass-inner flex w-full items-center justify-between px-4 py-3 text-left transition-shadow hover:shadow-glass disabled:opacity-60"
                      >
                        <span className="font-medium text-ink">{c.name}</span>
                        <CategoryBadge category={c.category} size="sm" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {error && (
                <p role="alert" className="mt-2 text-center text-xs text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-4">
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
