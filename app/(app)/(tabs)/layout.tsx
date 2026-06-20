import { redirect } from "next/navigation";
import { TabBar } from "@/components/TabBar";
import { getCurrentProfile } from "@/lib/auth/session";
import { isPending } from "@/lib/auth/roles";

/**
 * Shell for the four main tabs (Play / Players / Leaderboard / Settings).
 * Auth is already guaranteed by (app)/layout; here we bounce pending users to
 * the approval screen and render the bottom tab bar around the content.
 *
 * Bottom padding leaves room for the fixed TabBar.
 */
export default async function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (isPending(profile.role)) redirect("/pending");

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-24">
      {children}
      <TabBar />
    </div>
  );
}
