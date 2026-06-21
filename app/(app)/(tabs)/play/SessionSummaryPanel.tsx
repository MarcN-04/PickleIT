"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { CATEGORY_META } from "@/lib/categories";
import { springOvershoot } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { AddWalkInDialog } from "./AddWalkInDialog";
import type { Player, PairingMode } from "@/types/database";

const MODE_LABEL: Record<PairingMode, string> = {
  balance: "Balance",
  king_of_the_court: "King of the court",
};

/** First letters of the first and last word, uppercased, max 2 chars. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Props = {
  selectedPlayers: Player[];
  courtCount: number;
  mode: PairingMode;
  enough: boolean;
  isPending: boolean;
  error: string | null;
  onAddWalkIn: (id: string) => void;
  onBack: () => void;
  onStart: () => void;
};

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-ink/65">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

/**
 * Full-height session summary sidebar (mirrors the SideNav panel treatment).
 * Sticky on desktop so only the player list scrolls; drops into normal flow
 * below the list on mobile. Back + Start are docked at the bottom, always
 * visible. Presentational — all state/handlers come from the parent flow.
 */
export function SessionSummaryPanel({
  selectedPlayers,
  courtCount,
  mode,
  enough,
  isPending,
  error,
  onAddWalkIn,
  onBack,
  onStart,
}: Props) {
  const count = selectedPlayers.length;
  const capacity = courtCount * 4;

  return (
    <div className="lg:sticky lg:top-3 lg:h-[calc(100dvh-1.5rem)]">
      <div className="glass flex h-full flex-col gap-4 rounded-glass-lg p-4">
        {/* Header — emerald block */}
        <div className="rounded-glass bg-gradient-to-br from-primary-from to-primary-to p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
            Selected
          </p>
          <p className="mt-0.5 flex items-baseline gap-1.5">
            <span className="font-heading text-3xl font-bold leading-none">
              {count}
            </span>
            <span className="text-sm text-white/85">players</span>
          </p>
          <span
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              enough
                ? "bg-accent text-ink"
                : "bg-white/20 text-white/90"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                enough ? "bg-ink/70" : "bg-white/70"
              )}
            />
            {enough ? "Ready to start" : `Need ${Math.max(0, 4 - count)} more`}
          </span>
        </div>

        {/* Add walk-in */}
        <AddWalkInDialog
          onAdded={onAddWalkIn}
          triggerFullWidth
          triggerLabel="+ Add walk-in"
        />

        {/* Summary rows */}
        <div className="divide-y divide-white/60 border-y border-white/60">
          <SummaryRow label="Courts" value={`${courtCount} court${courtCount > 1 ? "s" : ""}`} />
          <SummaryRow label="Pairing" value={MODE_LABEL[mode]} />
          <SummaryRow
            label="Capacity"
            value={
              <span className={count > capacity ? "text-red-600" : undefined}>
                {count} / {capacity} spots
              </span>
            }
          />
        </div>

        {/* On court — grows to fill the middle, scrolls only on overflow */}
        <div className="flex min-h-0 flex-1 flex-col">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/55">
            On court
          </p>
          {count === 0 ? (
            <p className="text-xs text-ink/55">
              No players selected yet.
            </p>
          ) : (
            <div className="flex flex-wrap content-start gap-1.5 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {selectedPlayers.map((p) => {
                  const meta = CATEGORY_META[p.category];
                  return (
                    <motion.span
                      key={p.id}
                      layout
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={springOvershoot}
                      title={p.name}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold",
                        meta.bg,
                        meta.text
                      )}
                    >
                      {initials(p.name)}
                    </motion.span>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Docked actions */}
        <div className="mt-auto">
          {error && (
            <p
              role="alert"
              className="mb-2 rounded-2xl bg-red-50/90 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="glass" onClick={onBack} disabled={isPending}>
              Back
            </Button>
            <Button
              fullWidth
              onClick={onStart}
              disabled={isPending || !enough}
            >
              {isPending ? "Starting…" : `Start · ${count}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
