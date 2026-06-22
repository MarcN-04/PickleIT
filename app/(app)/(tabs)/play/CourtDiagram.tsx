"use client";

import { motion } from "framer-motion";
import { initials } from "@/lib/initials";
import { springOvershoot } from "@/lib/motion";

/**
 * A single mini pickleball court, drawn horizontally (net runs vertically down
 * the middle). Shows the non-volley "kitchen" zones either side of the net,
 * service lines, and 4 player dots — 2 Team A (emerald, left) + 2 Team B
 * (lime, right) — sitting in their service boxes, each labelled with the
 * player's initials. Purely presentational.
 */

// viewBox geometry (100 x 64). Net at x=50; kitchen spans x≈38–62.
const A = "#149655"; // Team A — emerald
const B = "#9bc416"; // Team B — lime accent
const LINE = "rgba(20,150,85,0.35)";
const SURFACE_FROM = "rgba(20,150,85,0.10)";
const SURFACE_TO = "rgba(155,196,22,0.10)";
const KITCHEN = "rgba(20,150,85,0.10)";

// Fixed dot positions: Team A left half, Team B right half.
const SLOTS = [
  { cx: 22, cy: 22 },
  { cx: 22, cy: 42 },
  { cx: 78, cy: 22 },
  { cx: 78, cy: 42 },
] as const;

export type DiagramPlayer = { id: string; name: string };

export function CourtDiagram({
  teamA = [],
  teamB = [],
  label,
  size = "default",
}: {
  teamA?: DiagramPlayer[];
  teamB?: DiagramPlayer[];
  label?: string;
  size?: "default" | "sm";
}) {
  // Map the (up to) 4 players onto fixed slots: A→left two, B→right two.
  const placed = [
    { player: teamA[0], fill: A },
    { player: teamA[1], fill: A },
    { player: teamB[0], fill: B },
    { player: teamB[1], fill: B },
  ];

  const r = size === "sm" ? 6 : 5;
  const fontSize = size === "sm" ? 5 : 4.5;

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5">
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-primary/20 bg-white/55 p-2">
        <svg
          viewBox="0 0 100 64"
          preserveAspectRatio="xMidYMid meet"
          className="block h-full max-h-full w-full"
          role="img"
          aria-label={label ? `${label}, 4 players` : "Pickleball court"}
        >
          <defs>
            <linearGradient id="court-surface" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={SURFACE_FROM} />
              <stop offset="100%" stopColor={SURFACE_TO} />
            </linearGradient>
          </defs>

          {/* Surface */}
          <rect
            x="2"
            y="2"
            width="96"
            height="60"
            rx="4"
            fill="url(#court-surface)"
            stroke={LINE}
            strokeWidth="1"
          />

          {/* Kitchen / non-volley zones either side of the net */}
          <rect x="38" y="2" width="12" height="60" fill={KITCHEN} />
          <rect x="50" y="2" width="12" height="60" fill={KITCHEN} />

          {/* Service lines (centerline per half) */}
          <line x1="2" y1="32" x2="38" y2="32" stroke={LINE} strokeWidth="0.8" />
          <line x1="62" y1="32" x2="98" y2="32" stroke={LINE} strokeWidth="0.8" />

          {/* Kitchen lines */}
          <line x1="38" y1="2" x2="38" y2="62" stroke={LINE} strokeWidth="0.8" />
          <line x1="62" y1="2" x2="62" y2="62" stroke={LINE} strokeWidth="0.8" />

          {/* Net (dashed, down the middle) */}
          <line
            x1="50"
            y1="2"
            x2="50"
            y2="62"
            stroke="rgba(20,150,85,0.55)"
            strokeWidth="1.2"
            strokeDasharray="3 2.5"
          />

          {/* Player dots with initials */}
          {placed.map(({ player, fill }, i) => {
            const slot = SLOTS[i];
            return (
              <motion.g
                key={player?.id ?? i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...springOvershoot, delay: 0.04 * i }}
                style={{ transformOrigin: `${slot.cx}px ${slot.cy}px` }}
              >
                <circle
                  cx={slot.cx}
                  cy={slot.cy}
                  r={r}
                  fill={fill}
                  stroke="white"
                  strokeWidth="1.5"
                />
                {player && (
                  <text
                    x={slot.cx}
                    y={slot.cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={fontSize}
                    fontWeight="700"
                    fill="white"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {initials(player.name)}
                  </text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
      {label && (
        <span className="px-0.5 font-heading text-[11px] font-semibold text-ink/70">
          {label} <span className="font-normal text-ink/55">· 4 players</span>
        </span>
      )}
    </div>
  );
}
