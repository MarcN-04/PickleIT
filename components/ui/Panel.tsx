"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";
import { popIn } from "@/lib/motion";

type PanelProps = HTMLMotionProps<"div"> & {
  /** Roundedness preset. `lg` = 28px for big hero panels, default = 20px. */
  size?: "default" | "lg";
  /** Animate in with a pop-in on mount. */
  animateIn?: boolean;
};

/**
 * Frosted translucent glass panel — the base surface of the app.
 * Styling (blur, inner highlight, green shadow) lives in `.glass` (globals.css);
 * this wraps it with motion + sizing.
 */
export function Panel({
  className,
  size = "default",
  animateIn = false,
  children,
  ...props
}: PanelProps) {
  return (
    <motion.div
      className={cn(
        "glass",
        size === "lg" ? "rounded-glass-lg" : "rounded-glass",
        className
      )}
      variants={animateIn ? popIn : undefined}
      initial={animateIn ? "hidden" : undefined}
      animate={animateIn ? "visible" : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** A Panel with default padding — the common "card" case. */
export function Card({ className, ...props }: PanelProps) {
  return <Panel className={cn("p-5", className)} {...props} />;
}
