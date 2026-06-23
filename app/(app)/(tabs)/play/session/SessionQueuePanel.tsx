"use client";

import { motion } from "framer-motion";
import { TierDot } from "@/components/ui";
import { CheckIcon } from "@/components/icons";
import { CATEGORY_META, type Category } from "@/lib/categories";
import { initials } from "@/lib/initials";
import { springOvershoot } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { CourtDiagram } from "../CourtDiagram";
import { MatchupRow } from "./MatchupRow";
import { AddToSessionDialog } from "./AddToSessionDialog";

export type QueuePlayer = { id: string; name: string; category: Category };

/**
 * Live-session right sidebar — mirrors the SideNav / SessionSummaryPanel glass
 * treatment. Full-height & sticky on desktop (only the courts scroll); drops
 * into normal flow below the courts on mobile. Shows "Up next" (a ready-foursome
 * preview or a short fallback list) and the "Waiting list".
 */
export function SessionQueuePanel({
  sessionId,
  upNext,
  rest,
  canManage,
}: {
  sessionId: string;
  upNext: QueuePlayer[];
  rest: QueuePlayer[];
  canManage: boolean;
}) {
  const fullGroup = upNext.length === 4;

  return (
    <div className="glass flex h-full min-h-0 flex-col overflow-hidden rounded-glass-lg">
      {/* ── Up next — bold solid-green banner flush with the panel top ── */}
      <div className="bg-primary px-5 py-4 text-white">
        <h2 className="font-heading text-2xl font-bold leading-tight">Up next</h2>
        <p className="mt-0.5 text-sm text-white/85">
          {upNext.length > 0 ? "First group to rotate in" : "Nobody queued yet"}
        </p>
      </div>

      {/* Content area (padded; banner stays flush). */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        {fullGroup && (
          <div className="flex flex-col gap-3">
            <div className="aspect-[100/64]">
              <CourtDiagram
                teamA={upNext.slice(0, 2)}
                teamB={upNext.slice(2, 4)}
                size="sm"
              />
            </div>
            <MatchupRow
              teamA={{ players: upNext.slice(0, 2) }}
              teamB={{ players: upNext.slice(2, 4) }}
            />
          </div>
        )}

        {/* Fewer than 4 queued: simple player cards. */}
        {!fullGroup && upNext.length > 0 && (
          <div className="flex flex-col gap-2">
            {upNext.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springOvershoot}
                className="glass-inner flex items-center gap-3 px-3 py-2.5"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    CATEGORY_META[p.category].bg,
                    CATEGORY_META[p.category].text
                  )}
                >
                  {initials(p.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex min-w-0 items-center gap-1.5">
                    <TierDot category={p.category} />
                    <span
                      title={p.name}
                      className="min-w-0 flex-1 truncate text-sm font-semibold text-ink"
                    >
                      {p.name}
                    </span>
                  </p>
                  <p className="text-xs text-ink/60">Next to rotate in</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Waiting list ── */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-ink/55">
              Waiting list
            </h2>
            {canManage && <AddToSessionDialog sessionId={sessionId} />}
          </div>

          {rest.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
              <CheckIcon size={28} className="text-ink/40" />
              <p className="text-sm text-ink/60">Everyone waiting is up next.</p>
            </div>
          ) : (
            <ul className="no-scrollbar flex flex-col gap-2 overflow-y-auto pr-1">
              {rest.map((p, i) => (
                <li
                  key={p.id}
                  className="glass-inner flex min-w-0 items-center gap-2.5 px-3 py-2.5"
                >
                  <span className="font-heading text-xs font-bold text-ink/55">
                    {i + 5}
                  </span>
                  <TierDot category={p.category} />
                  <span
                    title={p.name}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-ink"
                  >
                    {p.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
