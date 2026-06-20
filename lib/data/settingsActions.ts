"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import type { PairingMode, UserRole } from "@/types/database";

export type ActionResult = { error: string } | { ok: true };

/** Update app-wide defaults (admin only; RLS also enforces). */
export async function updateSettings(
  formData: FormData
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile?.role)) return { error: "Admins only." };

  const mode = String(formData.get("default_pairing_mode") ?? "") as PairingMode;
  const courts = Number.parseInt(
    String(formData.get("default_court_count") ?? ""),
    10
  );
  if (!["balance", "king_of_the_court"].includes(mode)) {
    return { error: "Invalid pairing mode." };
  }
  if (![1, 2, 3].includes(courts)) return { error: "Courts must be 1–3." };

  const supabase = createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      default_pairing_mode: mode,
      default_court_count: courts,
      label_beginner: String(formData.get("label_beginner") ?? "Beginner").trim() || "Beginner",
      label_intermediate:
        String(formData.get("label_intermediate") ?? "Intermediate").trim() || "Intermediate",
      label_pro: String(formData.get("label_pro") ?? "Pro").trim() || "Pro",
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/play");
  return { ok: true };
}

/** Assign/approve a user's role (admin only). */
export async function setUserRole(
  userId: string,
  role: UserRole
): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (!isAdmin(me?.role)) return { error: "Admins only." };
  if (userId === me!.id && role !== "admin") {
    return { error: "You can't remove your own admin role." };
  }
  if (!["admin", "organizer", "viewer", "pending"].includes(role)) {
    return { error: "Invalid role." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}
