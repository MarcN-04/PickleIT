"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Input, CategoryBadge } from "@/components/ui";
import { CATEGORIES, CATEGORY_META } from "@/lib/categories";
import { popIn, staggerContainer } from "@/lib/motion";
import type { Player, PlayerStats } from "@/types/database";

type Props = {
  players: Player[];
  statsById: Record<string, PlayerStats>;
};

/**
 * Full roster, grouped by category with a search box. Each group shows a count.
 * Tapping a player opens their profile.
 */
export function RosterList({ players, statsById }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, query]);

  const grouped = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      cat,
      players: filtered.filter((p) => p.category === cat),
    }));
  }, [filtered]);

  return (
    <div className="flex flex-col gap-4">
      <Input
        name="search"
        placeholder="Search players…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search players"
      />

      {players.length === 0 && (
        <p className="px-1 py-8 text-center text-sm text-ink/50">
          No players yet. Add your first player to get started.
        </p>
      )}

      {grouped.map(({ cat, players: group }) =>
        group.length === 0 ? null : (
          <section key={cat}>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="font-heading text-sm font-semibold text-ink/70">
                {CATEGORY_META[cat].label}
              </h2>
              <span className="text-xs text-ink/45">{group.length}</span>
            </div>

            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-2"
            >
              {group.map((p) => {
                const s = statsById[p.id];
                return (
                  <motion.li key={p.id} variants={popIn}>
                    <Link
                      href={`/players/${p.id}`}
                      className="glass-inner flex items-center justify-between gap-3 px-4 py-3 transition-shadow hover:shadow-glass"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-ink">{p.name}</span>
                        <CategoryBadge category={p.category} size="sm" />
                      </div>
                      <span className="text-xs text-ink/50">
                        {s && s.games > 0
                          ? `${s.wins}W · ${s.losses}L`
                          : "No games"}
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </section>
        )
      )}

      {query && filtered.length === 0 && players.length > 0 && (
        <p className="px-1 py-6 text-center text-sm text-ink/50">
          No players match “{query}”.
        </p>
      )}
    </div>
  );
}
