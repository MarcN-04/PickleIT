import { redirect } from "next/navigation";
import { TabBar } from "@/components/TabBar";
import { SideNav } from "@/components/SideNav";
import { getCurrentProfile } from "@/lib/auth/session";
import { isPending } from "@/lib/auth/roles";

/**
 * Shell for the four main tabs (Play / Players / Leaderboard / Settings).
 * Adaptive navigation: a fixed left SideNav on desktop (≥1024px) and the
 * bottom TabBar on mobile/tablet — never both. Content sits in a wide,
 * centered container so it uses the space on large screens without becoming
 * an unreadable full-bleed.
 *
 * - mobile: single column, pb-24 leaves room for the fixed bottom TabBar.
 * - desktop: lg:pl-60 offsets the fixed sidebar; content max-w-5xl centered.
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
    <div className="min-h-dvh lg:pl-60">
      <SideNav username={profile.username} role={profile.role} />
      <main className="mx-auto w-full max-w-5xl px-3 pb-24 sm:px-5 lg:px-8 lg:pb-10 lg:pt-4">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
