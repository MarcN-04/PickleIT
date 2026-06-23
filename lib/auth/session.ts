import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/**
 * Server-side: fetch the current auth user + their profile (with role).
 * Returns null when signed out. Used by the layout/guards to route users to
 * login, the pending screen, or the app.
 *
 * Token validation is owned by the middleware (lib/supabase/middleware.ts),
 * which runs `getUser()` (a networked Auth-server check) before any route
 * renders and redirects unauthenticated users. So here we deliberately use the
 * LOCAL `getSession()` (a cookie read, no network) for the user id — re-hitting
 * the Auth server would add a redundant round-trip to every render. This is
 * safe because these routes are gated: middleware already validated the token
 * upstream in the same request.
 *
 * Wrapped in React `cache()` so the multiple call sites per request (the (app)
 * guard, the (tabs) guard, and most pages) share a SINGLE profiles query.
 */
export const getCurrentProfile = cache(
  async (): Promise<Profile | null> => {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    return (profile as Profile) ?? null;
  }
);
