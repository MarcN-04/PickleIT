"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { setUserRole } from "@/lib/data/settingsActions";
import { ROLE_LABEL } from "@/lib/auth/roles";
import type { Profile, UserRole } from "@/types/database";

const ASSIGNABLE: UserRole[] = ["admin", "organizer", "viewer", "pending"];

/**
 * Admin user-management: list every account, approve pending users, and change
 * roles. The current admin can't demote themselves.
 */
export function UserManagement({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function change(userId: string, role: UserRole) {
    setError(null);
    setPendingId(userId);
    startTransition(async () => {
      const res = await setUserRole(userId, role);
      if ("error" in res) setError(res.error);
      else router.refresh();
      setPendingId(null);
    });
  }

  return (
    <Card className="p-5" animateIn>
      <h2 className="mb-1 font-heading text-sm font-bold text-ink">Users</h2>
      <p className="mb-3 text-xs text-ink/55">
        Approve new sign-ups and set roles. Pending users can&apos;t access the
        app until assigned a role.
      </p>

      {error && (
        <p role="alert" className="mb-3 rounded-2xl bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {profiles.map((p) => {
          const isSelf = p.id === currentUserId;
          return (
            <li
              key={p.id}
              className="glass-inner flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink">{p.username}</span>
                {isSelf && (
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-ink/50">
                    you
                  </span>
                )}
                {p.role === "pending" && (
                  <span className="rounded-full bg-cat-intermediate px-2 py-0.5 text-[10px] font-medium text-cat-intermediateInk">
                    needs approval
                  </span>
                )}
              </div>

              <select
                value={p.role}
                disabled={pendingId === p.id || (isSelf && p.role === "admin")}
                onChange={(e) => change(p.id, e.target.value as UserRole)}
                className="rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-sm text-ink outline-none focus:border-primary/40 disabled:opacity-60"
                aria-label={`Role for ${p.username}`}
              >
                {ASSIGNABLE.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
