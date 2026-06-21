"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav-items";

/**
 * Mobile/tablet bottom tab bar (<1024px) — primary navigation on small screens,
 * hidden on lg where the SideNav takes over. Frosted glass, fixed to the bottom;
 * the active tab pops with the emerald primary and a sliding indicator. Clicks
 * highlight immediately (optimistic) so the tap feels instant.
 */
export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-stretch justify-around rounded-b-none rounded-t-glass-lg px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
      aria-label="Primary"
    >
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            prefetch
            aria-current={active ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              startTransition(() => router.push(href));
            }}
            className="relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {active && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary-from/12 to-primary-to/12 shadow-[inset_0_0_0_1px_rgba(20,150,85,0.25)]"
                transition={{ type: "spring", stiffness: 500, damping: 34 }}
              />
            )}
            <Icon size={22} className={active ? "text-primary" : "text-ink/65"} />
            <span
              className={cn(
                "text-[11px] font-medium",
                active ? "text-primary" : "text-ink/65"
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
