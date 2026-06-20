"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageGameplay } from "@/lib/auth/roles";
import { CATEGORIES, type Category } from "@/lib/categories";

export type PlayerFormResult =
  | { ok: true; playerId: string }
  | { ok: false; error: string };

function parseForm(formData: FormData): {
  name: string;
  age: number | null;
  category: Category;
} | null {
  const name = String(formData.get("name") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const category = String(formData.get("category") ?? "") as Category;

  if (!name) return null;
  if (!CATEGORIES.includes(category)) return null;

  const age = ageRaw === "" ? null : Number.parseInt(ageRaw, 10);
  if (age !== null && (Number.isNaN(age) || age < 0 || age > 120)) return null;

  return { name, age, category };
}

/** Create a new player (Organizer/Admin only). RLS also enforces this. */
export async function createPlayer(
  _prev: PlayerFormResult | undefined,
  formData: FormData
): Promise<PlayerFormResult> {
  const profile = await getCurrentProfile();
  if (!canManageGameplay(profile?.role)) {
    return { ok: false, error: "You don't have permission to add players." };
  }

  const parsed = parseForm(formData);
  if (!parsed) return { ok: false, error: "Please enter a valid name and category." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("players")
    .insert(parsed)
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/players");
  return { ok: true, playerId: (data as { id: string }).id };
}

/** Update an existing player (Organizer/Admin only). */
export async function updatePlayer(
  id: string,
  _prev: PlayerFormResult | undefined,
  formData: FormData
): Promise<PlayerFormResult> {
  const profile = await getCurrentProfile();
  if (!canManageGameplay(profile?.role)) {
    return { ok: false, error: "You don't have permission to edit players." };
  }

  const parsed = parseForm(formData);
  if (!parsed) return { ok: false, error: "Please enter a valid name and category." };

  const supabase = createClient();
  const { error } = await supabase.from("players").update(parsed).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/players");
  revalidatePath(`/players/${id}`);
  return { ok: true, playerId: id };
}
