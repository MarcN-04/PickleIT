/**
 * Tiny classname joiner — concatenates truthy class strings.
 * Kept dependency-free (no clsx/tailwind-merge) to honor the "no component
 * library" constraint and keep the bundle lean.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
