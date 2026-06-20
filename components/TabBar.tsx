"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Tab = { href: string; label: string; icon: string };

const TABS: Tab[] = [
  { href: "/play", label: "Play", icon: "🎾" },
  { href: "/players", label: "Players", icon: "👥" },
  { href: "/leaderboard", label: "Ranks", icon: "🏆" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

/**
 * Mobile bottom tab bar — the app's primary navigation.
 * Fixed to the bottom on a frosted glass surface; the active tab pops with the
 * emerald primary and a sliding glow indicator.
 */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-stretch justify-around rounded-b-none rounded-t-glass-lg px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
      aria-label="Primary"
    >
      {TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5"
          >
            {active && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary-from/12 to-primary-to/12 shadow-[inset_0_0_0_1px_rgba(20,150,85,0.25)]"
                transition={{ type: "spring", stiffness: 500, damping: 34 }}
              />
            )}
            <span className="text-lg leading-none" aria-hidden>
              {tab.icon}
            </span>
            <span
              className={cn(
                "text-[11px] font-medium",
                active ? "text-primary" : "text-ink/55"
              )}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
