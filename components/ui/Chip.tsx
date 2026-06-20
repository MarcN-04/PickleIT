"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { springOvershoot } from "@/lib/motion";

type ChipProps = {
  selected?: boolean;
  onClick?: () => void;
  /** When selected, glow with the lime accent instead of emerald. Use sparingly. */
  accentWhenSelected?: boolean;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
};

/**
 * Pill-shaped selectable chip (e.g. category filters, court count, mode picker).
 * Selected state scales up slightly and glows with a colored shadow.
 */
export function Chip({
  selected = false,
  onClick,
  accentWhenSelected = false,
  className,
  children,
  disabled = false,
}: ChipProps) {
  const interactive = !!onClick && !disabled;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      animate={{ scale: selected ? 1.05 : 1 }}
      transition={springOvershoot}
      whileTap={interactive ? { scale: 0.95 } : undefined}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
        "border",
        selected
          ? accentWhenSelected
            ? "border-accent-to bg-gradient-to-r from-accent-from to-accent-to text-ink shadow-glow-accent"
            : "border-primary/40 bg-gradient-to-r from-primary-from to-primary-to text-white shadow-glow-primary"
          : "border-white/70 bg-white/55 text-ink/80 hover:bg-white/75",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {children}
    </motion.button>
  );
}
