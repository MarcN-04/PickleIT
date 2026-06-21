"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav-items";
import { PickleIcon } from "./icons";
import { SignOutButton } from "./SignOutButton";
import { ROLE_LABEL } from "@/lib/auth/roles";
import type { UserRole } from "@/types/database";

/**
 * Desktop left sidebar navigation (≥1024px). A flex child of the shell, made
 * full-height + scroll-stable via sticky. Hidden below lg, where the mobile
 * TabBar takes over. Instant active highlight on click (optimistic) via a
 * pending target, so navigation feels immediate even before the server responds.
 */
export function SideNav({
  username,
  role,
}: {
  username: string;
  role: UserRole;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Optimistic active target: highlight the clicked item immediately.
  const activePath = pathname;

  return (
    <aside className="sticky top-0 z-40 hidden h-dvh w-60 shrink-0 lg:block">
      <div className="glass m-3 flex h-[calc(100dvh-1.5rem)] flex-col rounded-glass-lg p-4">
        {/* Brand */}
        <Link href="/play" className="mb-6 flex items-center gap-2.5 px-2 pt-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-from to-primary-to text-white shadow-glass">
            <PickleIcon size={20} />
          </span>
          <span className="font-heading text-lg font-bold text-ink">
            PickleIT
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1" aria-label="Primary">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = activePath === href || activePath.startsWith(`${href}/`);
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
                className={cn(
                  "relative flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  active
                    ? "text-primary"
                    : "text-ink/75 hover:bg-white/50 hover:text-ink"
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
        <div className="mt-4 rounded-glass border border-white/70 bg-white/65 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {username}
              </p>
              <p className="text-xs text-ink/70">{ROLE_LABEL[role]}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
