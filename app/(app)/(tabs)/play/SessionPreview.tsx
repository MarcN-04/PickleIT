"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui";
import { popIn, staggerContainer } from "@/lib/motion";
import { ScaleIcon, CrownIcon } from "@/components/icons";
import { CourtDiagram } from "./CourtDiagram";
import type { PairingMode } from "@/types/database";

const MODE_LABEL: Record<PairingMode, string> = {
  balance: "Balance",
  king_of_the_court: "King of the court",
};

const MODE_BLURB: Record<PairingMode, string> = {
  balance: "Everyone rotates fairly; teams are balanced each game.",
  king_of_the_court: "Winners hold the court (split + new challengers); losers re-queue.",
};

const MODE_ICON: Record<PairingMode, typeof ScaleIcon> = {
  balance: ScaleIcon,
  king_of_the_court: CrownIcon,
};

type Props = {
  courtCount: number;
  mode: PairingMode;
};

/** Small color-swatch legend entry. */
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink/70">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

/**
 * Live, presentational preview of the session being set up. Renders real mini
 * pickleball courts (one per selected court) with team-colored players, a
 * legend, and a pairing-mode recap. Reads state only — sets nothing.
 */
export function SessionPreview({ courtCount, mode }: Props) {
  const courts = Array.from({ length: courtCount }, (_, i) => i + 1);
  const capacity = courtCount * 4;
  const ModeIcon = MODE_ICON[mode];

  return (
    <Card size="lg" className="flex h-full min-h-0 flex-col gap-5 overflow-hidden p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-ink/70">
          Your setup
        </h2>
        <span className="text-xs text-ink/65">
          Up to <span className="font-semibold text-ink">{capacity}</span> players
        </span>
      </div>

      {/* Court diagrams — fill the card's leftover space; courts shrink to fit
          (more courts => smaller courts) so the card never overflows. */}
      <motion.div
        layout
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className={`grid min-h-0 flex-1 gap-3 sm:grid-cols-2 ${
          courtCount === 3 ? "grid-rows-2" : "grid-rows-1"
        } auto-rows-fr`}
      >
        <AnimatePresence mode="popLayout">
          {courts.map((n) => (
            <motion.div
              key={n}
              layout
              variants={popIn}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={courtCount === 1 ? "sm:col-span-2" : ""}
            >
              <CourtDiagram label={`Court ${n}`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Legend */}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1">
        <LegendItem color="#149655" label="Team A" />
        <LegendItem color="#9bc416" label="Team B" />
        <LegendItem color="rgba(20,150,85,0.18)" label="Kitchen (no-volley)" />
      </div>

      {/* Mode recap */}
      <div className="flex items-start gap-3 rounded-glass border border-white/60 bg-white/55 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-from to-primary-to text-white">
          <ModeIcon size={18} />
        </span>
        <div>
          <div className="font-heading text-sm font-semibold text-ink">
            {MODE_LABEL[mode]}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/70">
            {MODE_BLURB[mode]}
          </p>
        </div>
      </div>
    </Card>
  );
}
