import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { isPending } from "@/lib/auth/roles";

/**
 * Root of the authenticated app. Routes the user to the right place:
 * pending -> approval screen, otherwise -> the Play (home) tab.
 */
export default async function Index() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (isPending(profile.role)) redirect("/pending");
  redirect("/play");
}
