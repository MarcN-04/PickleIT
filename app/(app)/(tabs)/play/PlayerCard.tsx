"use client";

import { motion } from "framer-motion";
import { CATEGORY_META } from "@/lib/categories";
import { springOvershoot, springSnappy } from "@/lib/motion";
import { cn } from "@/lib/cn";
import type { Player } from "@/types/database";

/** First letters of the first and last word, uppercased, max 2 chars. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Props = {
  player: Player;
  selected: boolean;
  onToggle: () => void;
};

/**
 * Selectable player tile: category-tinted initials avatar + name, with an
 * emerald ring/glow + filled check when selected. The check pops on toggle;
 * the card itself stays calm (selection fires often — keep motion subtle).
 * Players are already grouped by tier, so no tier tag is shown.
 */
export function PlayerCard({ player, selected, onToggle }: Props) {
  const meta = CATEGORY_META[player.category];
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      whileTap={{ scale: 0.97, transition: springSnappy }}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-glass border bg-white/90 px-4 py-5 text-left transition-all",
        selected
          ? "border-primary bg-white shadow-glow-primary ring-1 ring-primary/30"
          : "border-white/80 hover:border-primary/30 hover:shadow-glass"
      )}
    >
      {/* Avatar */}
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-heading text-sm font-semibold",
          meta.bg,
          meta.text
        )}
        aria-hidden
      >
        {initials(player.name)}
      </span>

      {/* Name */}
      <span className="min-w-0 flex-1 truncate font-medium text-ink">
        {player.name}
      </span>

      {/* Selected check */}
      <motion.span
        animate={{ scale: selected ? 1 : 0.9 }}
        transition={springOvershoot}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-colors",
          selected
            ? "border-primary bg-primary text-white"
            : "border-ink/20 text-transparent group-hover:border-primary/40"
        )}
        aria-hidden
      >
        ✓
      </motion.span>
    </motion.button>
  );
}
