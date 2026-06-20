import type { UserRole } from "@/types/database";

/**
 * Central permission helpers. The DB enforces access via RLS (0004); these
 * mirror the same rules in the UI so we can hide/disable controls the current
 * user can't use. RLS remains the source of truth — UI gating is convenience.
 *
 *   admin     -> manage users/settings + everything organizer can do
 *   organizer -> run sessions, add/edit players, log results
 *   viewer    -> read-only
 *   pending   -> no access (sees the approval screen)
 */

/** Has any assigned role (i.e. not pending) — can at least view data. */
export function canView(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "organizer" || role === "viewer";
}

/** Can create/edit players, run sessions, and log results. */
export function canManageGameplay(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "organizer";
}

/** Can manage users/roles and app settings. */
export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === "admin";
}

/** Pending users are signed in but not yet approved. */
export function isPending(role: UserRole | null | undefined): boolean {
  return role === "pending" || role == null;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  organizer: "Organizer",
  viewer: "Viewer",
  pending: "Pending",
};
