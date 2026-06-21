import { redirect } from "next/navigation";
import { TabBar } from "@/components/TabBar";
import { SideNav } from "@/components/SideNav";
import { getCurrentProfile } from "@/lib/auth/session";
import { isPending } from "@/lib/auth/roles";

/**
 * Shell for the four main tabs (Play / Players / Leaderboard / Settings).
 * Adaptive navigation via a flex row: a full-height left SideNav on desktop
 * (≥1024px) and the bottom TabBar on mobile/tablet — never both.
 *
 * - desktop: SideNav is a flex child (full height by the row); content is a
 *   flex-1 column whose inner wrapper is LEFT-aligned with a capped width, so
 *   it hugs the sidebar and fills the space (no empty band, no centered void).
 * - mobile: single column; pb-24 clears the fixed bottom TabBar.
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
    <div className="flex min-h-dvh">
      <SideNav username={profile.username} role={profile.role} />
      <main className="min-w-0 flex-1">
        <div className="w-full max-w-7xl px-7 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-3 lg:pt-3">
          {children}
        </div>
      </main>
      <TabBar />
    </div>
  );
}
