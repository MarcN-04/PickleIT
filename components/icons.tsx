/**
 * Inline SVG icon set — lightweight, dependency-free, currentColor stroke icons.
 * Consistent 24px viewBox, stroke-width 1.75, round caps/joins. Decorative use
 * should pass aria-hidden (default); pair with a visible text label for nav.
 */

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 24, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Play — a paddle/racket. */
export function PlayIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14.5 9.5a5 5 0 1 0-5 5l-.8 4.3a1.6 1.6 0 0 0 3.1.6l1-3.9a5 5 0 0 0 1.7-6Z" />
      <circle cx="10" cy="9.5" r="0.01" />
    </Base>
  );
}

/** Players — group of people. */
export function PlayersIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
      <circle cx="9" cy="7" r="3" />
      <path d="M22 19v-1a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Base>
  );
}

/** Ranks — trophy. */
export function TrophyIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 9a6 6 0 0 0 12 0V4H6v5Z" />
      <path d="M6 5H4a2 2 0 0 0 2 3" />
      <path d="M18 5h2a2 2 0 0 1-2 3" />
      <path d="M12 15v3" />
      <path d="M9 21h6" />
      <path d="M9 18h6" />
    </Base>
  );
}

/** Settings — gear. */
export function SettingsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </Base>
  );
}

/** Hourglass — waiting. */
export function HourglassIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 3h12" />
      <path d="M6 21h12" />
      <path d="M7 3c0 4 3 5 5 9 2-4 5-5 5-9" />
      <path d="M7 21c0-4 3-5 5-9 2 4 5 5 5 9" />
    </Base>
  );
}

/** Check — completed / success. */
export function CheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Base>
  );
}

/** Flame — win streak. */
export function FlameIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.5 0 3-1 3-3 0-1.4-.8-2.3-1.5-3 .3 1.5-.6 2-.6 2 .2-2.2-1.4-3.7-2.4-4.5C9 5 9.8 4 9.8 4 6.5 5.5 5 8.4 5 11a7 7 0 0 0 14 0c0-2-1-4-2.4-5.4.3 1.7-.6 2.9-1.6 3.4.2-1.7-.5-3.4-2-4.5" />
    </Base>
  );
}

/** Clock — game timer. */
export function ClockIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Base>
  );
}

/** Plus — add. */
export function PlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Base>
  );
}

/** Pickle/logo glyph — used in the brand mark. */
export function PickleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M8 16c-2-2-2-6 1-9s7-3 9-1-1 6-4 9-4 3-6 1Z" />
      <path d="M10 10l.01 0M13 13l.01 0M11.5 11.5l.01 0" />
    </Base>
  );
}
