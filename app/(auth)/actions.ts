"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  usernameToEmail,
  normalizeUsername,
  isValidUsername,
  USERNAME_RULE,
} from "@/lib/auth/username";

export type AuthResult = { error: string } | undefined;

/**
 * Sign up with username + password. Maps the username to a synthetic email
 * and passes the username in metadata so the DB trigger (0003) records it on
 * the profile and decides admin-vs-pending. No email confirmation (the
 * synthetic domain can't receive mail — see README Supabase setup).
 */
export async function signUp(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!isValidUsername(username)) return { error: USERNAME_RULE };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email: usernameToEmail(username),
    password,
    options: { data: { username } },
  });

  if (error) {
    // Surface a friendly message for the common "already registered" case.
    if (/registered|already/i.test(error.message)) {
      return { error: "That username is taken." };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/** Sign in with username + password. */
export async function signIn(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!username || !password) return { error: "Enter your username and password." };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error) return { error: "Incorrect username or password." };

  revalidatePath("/", "layout");
  redirect("/");
}

/** Sign out and return to the login screen. */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
