"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Chip, CategoryBadge } from "@/components/ui";
import { CATEGORIES, CATEGORY_META, type Category } from "@/lib/categories";
import { popIn, staggerContainer } from "@/lib/motion";
import type { PlayerStats } from "@/types/database";

type SortKey = "win_rate" | "wins" | "games";

const SORT_LABEL: Record<SortKey, string> = {
  win_rate: "Win rate",
  wins: "Wins",
  games: "Games",
};

/**
 * Rankings sortable by win rate / wins / games and filterable by category.
 * Tapping a player opens their profile. Players with 0 games sink to the bottom.
 */
export function LeaderboardTable({ stats }: { stats: PlayerStats[] }) {
  const [sort, setSort] = useState<SortKey>("win_rate");
  const [filter, setFilter] = useState<Category | "all">("all");

  const rows = useMemo(() => {
    const filtered =
      filter === "all" ? stats : stats.filter((s) => s.category === filter);
    return [...filtered].sort((a, b) => {
      // Players with no games always rank last regardless of sort key.
      if (a.games === 0 && b.games === 0) return a.name.localeCompare(b.name);
      if (a.games === 0) return 1;
      if (b.games === 0) return -1;
      const key = sort;
      return (
        b[key] - a[key] ||
        b.wins - a.wins ||
        a.name.localeCompare(b.name)
      );
    });
  }, [stats, sort, filter]);

  return (
    <div className="flex flex-col gap-4">
      {/* Sort */}
      <div>
        <p className="mb-2 px-1 text-xs font-medium text-ink/55">Sort by</p>
        <div className="flex gap-2">
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
            <Chip key={k} selected={sort === k} onClick={() => setSort(k)}>
              {SORT_LABEL[k]}
            </Chip>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div>
        <p className="mb-2 px-1 text-xs font-medium text-ink/55">Category</p>
        <div className="flex flex-wrap gap-2">
          <Chip selected={filter === "all"} onClick={() => setFilter("all")}>
            All
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              selected={filter === c}
              onClick={() => setFilter(c)}
            >
              {CATEGORY_META[c].label}
            </Chip>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-1 py-8 text-center text-sm text-ink/50">
          No players to rank yet.
        </p>
      ) : (
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2 pb-2"
        >
          {rows.map((s, i) => (
            <motion.li key={s.player_id} variants={popIn}>
              <Link
                href={`/players/${s.player_id}`}
                className="glass-inner flex items-center justify-between gap-3 px-4 py-3 transition-shadow hover:shadow-glass"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full font-heading text-xs font-bold ${
                      i === 0 && s.games > 0
                        ? "bg-gradient-to-br from-accent-from to-accent-to text-ink"
                        : "bg-white/70 text-ink/50"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium text-ink">{s.name}</span>
                    <CategoryBadge category={s.category} size="sm" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-heading text-lg font-bold text-primary">
                    {s.games > 0 ? `${Math.round(s.win_rate * 100)}%` : "—"}
                  </div>
                  <div className="text-[11px] text-ink/50">
                    {s.wins}W · {s.losses}L · {s.games}G
                  </div>
                </div>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
