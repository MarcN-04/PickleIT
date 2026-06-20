import type { Transition, Variants } from "framer-motion";

/**
 * Shared Framer Motion presets — springy, with the brief's overshoot feel.
 * Import these instead of redefining transitions per-component so motion
 * stays consistent across the app.
 */

/** Springy overshoot, used for mounts and selection changes. */
export const springOvershoot: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 22,
  mass: 0.7,
};

/** Snappier spring for hover/tap micro-interactions. */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 30,
};

/** Pop-in scaling on mount (cards, chips, list items). */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: springOvershoot },
};

/** Staggered container for lists of popIn children. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

/** Hover lift + tap press, for interactive glass surfaces. */
export const hoverLift = {
  whileHover: { y: -3, transition: springSnappy },
  whileTap: { scale: 0.97, transition: springSnappy },
};
