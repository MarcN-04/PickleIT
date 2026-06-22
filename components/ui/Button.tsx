"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";
import { springSnappy } from "@/lib/motion";

type Variant = "primary" | "accent" | "glass" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

type ButtonProps = Omit<HTMLMotionProps<"button">, "ref"> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  // Primary action — emerald gradient, white text.
  primary:
    "bg-gradient-to-r from-primary-from to-primary-to text-white shadow-glass hover:shadow-glass-lift",
  // Accent — bright lime, dark text. Reserve for wins / key affirmative actions.
  accent:
    "bg-gradient-to-r from-accent-from to-accent-to text-ink shadow-glass hover:shadow-glow-accent",
  // Frosted glass button.
  glass:
    "glass !rounded-full text-ink hover:shadow-glass-lift",
  // Minimal text button.
  ghost: "text-ink/70 hover:text-ink hover:bg-white/40",
  // Quiet destructive — light red outline, fills softly on hover. For actions
  // that shouldn't be tapped by accident (e.g. End session).
  destructive:
    "border border-red-200 bg-white/60 text-red-600 hover:bg-red-50 hover:border-red-300",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-7 py-3.5 text-base",
};

/**
 * Pill-shaped button. All buttons are fully rounded per the design system.
 * Springy hover lift + tap press via Framer Motion.
 */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-heading font-semibold",
        "transition-shadow duration-200 ease-overshoot",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        className
      )}
      whileHover={disabled ? undefined : { y: -2, transition: springSnappy }}
      whileTap={disabled ? undefined : { scale: 0.96, transition: springSnappy }}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
