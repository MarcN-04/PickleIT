import { createClient } from "@/lib/supabase/server";
import type { AppSettings, Profile } from "@/types/database";

const DEFAULTS: AppSettings = {
  id: 1,
  default_pairing_mode: "balance",
  default_court_count: 2,
  label_beginner: "Beginner",
  label_intermediate: "Intermediate",
  label_pro: "Pro",
  updated_at: new Date(0).toISOString(),
};

/** App-wide settings (single row). Falls back to defaults if not present. */
export async function getAppSettings(): Promise<AppSettings> {
  const supabase = createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return (data as AppSettings) ?? DEFAULTS;
}

/** All user profiles (admin-only; RLS enforces). For the user-management panel. */
export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data as Profile[]) ?? [];
}
