"use client";

import { useOptimistic, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button, CategoryBadge } from "@/components/ui";
import { addPlayerToSession } from "@/lib/data/liveSessionActions";
import { markLocalMutation } from "./localMutation";
import type { Category } from "@/lib/categories";

type Candidate = { id: string; name: string; category: Category };

/**
 * Drop a late arrival into the running session. Lists roster players not already
 * enrolled; tapping one enrolls them at the back of the queue.
 */
export function AddToSessionDialog({
  sessionId,
  candidates,
}: {
  sessionId: string;
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistically hide the tapped candidate while the enroll round-trip is in
  // flight. Base is always the prop list (DB truth): the overlay is discarded
  // when the transition resolves — on success the fresh server props already
  // omit the now-enrolled player; on error the props are unchanged so the
  // candidate reappears. Presentation-only; cannot desync the DB.
  const [pendingId, applyPendingId] = useOptimistic<string | null>(null);
  const visibleCandidates = candidates.filter((c) => c.id !== pendingId);

  function add(playerId: string) {
    setError(null);
    startTransition(async () => {
      // Reflect the enroll instantly: hide the candidate and close the sheet.
      applyPendingId(playerId);
      markLocalMutation();
      const res = await addPlayerToSession(sessionId, playerId);
      if (res?.error) {
        // Revert: surface the error and keep the sheet open so they can retry.
        setError(res.error);
        setOpen(true);
      } else {
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

              {visibleCandidates.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink/70">
                  Everyone in the roster is already in this session.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {visibleCandidates.map((c) => (
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
