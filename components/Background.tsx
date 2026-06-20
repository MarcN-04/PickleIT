/**
 * Fixed gradient-mesh background with large blurred, slowly-floating orbs.
 * Pure CSS (see globals.css) so it is cheap and respects prefers-reduced-motion.
 */
export function Background() {
  return (
    <div className="app-bg" aria-hidden="true">
      <div className="orb orb--1" />
      <div className="orb orb--2" />
      <div className="orb orb--3" />
    </div>
  );
}
