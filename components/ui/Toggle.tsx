"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { springSnappy } from "@/lib/motion";

type ToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Pill-shaped on/off toggle with a springy sliding knob.
 * "On" uses the emerald primary gradient.
 */
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: ToggleProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-3 select-none",
        disabled && "opacity-50",
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200",
          checked
            ? "border-primary/30 bg-gradient-to-r from-primary-from to-primary-to"
            : "border-white/70 bg-white/60",
          !disabled && "cursor-pointer"
        )}
      >
        <motion.span
          layout
          transition={springSnappy}
          className={cn(
            "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-glass",
            checked ? "right-1" : "left-1"
          )}
        />
      </button>
      {label && <span className="text-sm font-medium text-ink/80">{label}</span>}
    </label>
  );
}
