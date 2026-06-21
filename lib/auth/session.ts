import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/**
 * Server-side: fetch the current auth user + their profile (with role).
 * Returns null when signed out. Used by the layout/guards to route users to
 * login, the pending screen, or the app.
 *
 * Wrapped in React `cache()` so the multiple call sites per request
 * (middleware aside, the (app) guard, the (tabs) guard, and most pages) share
 * a SINGLE Supabase round-trip instead of repeating it 3–4× per navigation.
 */
export const getCurrentProfile = cache(
  async (): Promise<Profile | null> => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return (profile as Profile) ?? null;
  }
);
