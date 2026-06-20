"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav-items";
import { PickleIcon } from "./icons";
import { SignOutButton } from "./SignOutButton";
import { ROLE_LABEL } from "@/lib/auth/roles";
import type { UserRole } from "@/types/database";

/**
 * Desktop left sidebar navigation (≥1024px). Hidden below lg, where the mobile
 * TabBar takes over. Logo at top, nav items in the middle (active = emerald
 * tint + sliding indicator), account + sign-out pinned to the bottom.
 */
export function SideNav({
  username,
  role,
}: {
  username: string;
  role: UserRole;
}) {
  const pathname = usePathname();

  return (
    <aside className="glass fixed inset-y-0 left-0 z-40 hidden w-60 flex-col rounded-none rounded-r-glass-lg p-4 lg:flex">
      {/* Brand */}
      <Link href="/play" className="mb-6 flex items-center gap-2.5 px-2 pt-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-from to-primary-to text-white shadow-glass">
          <PickleIcon size={20} />
        </span>
        <span className="font-heading text-lg font-bold text-ink">PickleIT</span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1" aria-label="Primary">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                active ? "text-primary" : "text-ink/65 hover:text-ink hover:bg-white/40"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidenav-indicator"
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary-from/12 to-primary-to/12 shadow-[inset_0_0_0_1px_rgba(20,150,85,0.25)]"
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                />
              )}
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Account */}
      <div className="mt-4 flex items-center justify-between gap-2 rounded-glass border border-white/60 bg-white/40 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{username}</p>
          <p className="text-xs text-ink/55">{ROLE_LABEL[role]}</p>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
