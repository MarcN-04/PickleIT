import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { isPending } from "@/lib/auth/roles";

/**
 * Guard for all authenticated app pages.
 * - Signed out          -> /login (middleware already redirects; this is belt-and-suspenders)
 * - Signed in + pending  -> /pending
 * - Signed in + role     -> render the app
 *
 * The /pending route itself lives in this group but renders its own check,
 * so we allow pending users through ONLY to that page.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return <>{children}</>;
}
