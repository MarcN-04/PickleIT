/**
 * Username <-> synthetic email mapping.
 *
 * Supabase Auth requires an email or phone, but the product is username-only.
 * We map a username to "<username>@pickleit.local" behind the scenes; the user
 * never sees or types an email. The real username is also stored in
 * profiles.username (via the sign-up metadata + the handle_new_user trigger).
 */

/** Internal domain for synthetic emails — not a real, deliverable domain. */
export const SYNTHETIC_EMAIL_DOMAIN = "pickleit.local";

/** Allowed username shape: 3–24 chars, letters/numbers/_/.-, no leading/trailing dot. */
const USERNAME_RE = /^(?![.\-_])[a-zA-Z0-9._-]{3,24}(?<![.\-_])$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(raw: string): boolean {
  return USERNAME_RE.test(normalizeUsername(raw));
}

/** "marc" -> "marc@pickleit.local" (normalized first). */
export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

/** "marc@pickleit.local" -> "marc" (best-effort, for display fallbacks). */
export function emailToUsername(email: string): string {
  return email.split("@")[0] ?? email;
}

/** Human-readable rule, shown under the sign-up field on validation failure. */
export const USERNAME_RULE =
  "3–24 characters: letters, numbers, dot, dash, or underscore.";
