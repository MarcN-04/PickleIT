import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button, CategoryBadge } from "@/components/ui";
import {
  getPlayer,
  getPlayerStats,
  getRecentGames,
  currentWinStreak,
} from "@/lib/data/players";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageGameplay } from "@/lib/auth/roles";

export default async function PlayerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const player = await getPlayer(params.id);
  if (!player) notFound();

  const [stats, recent, profile] = await Promise.all([
    getPlayerStats(player.id),
    getRecentGames(player.id),
    getCurrentProfile(),
  ]);

  const games = stats?.games ?? 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const winRate = stats ? Math.round(stats.win_rate * 100) : 0;
  const streak = currentWinStreak(recent);
  const canEdit = canManageGameplay(profile?.role);

  return (
    <div className="px-4">
      <PageHeader
        title={player.name}
        action={
          <Link href="/players">
            <Button variant="ghost" size="sm">
              ← Back
            </Button>
          </Link>
        }
      />

      {/* Identity */}
      <Card className="mb-4 flex items-center justify-between p-5" animateIn>
        <div className="flex items-center gap-3">
          <CategoryBadge category={player.category} />
          {player.age != null && (
            <span className="text-sm text-ink/60">Age {player.age}</span>
          )}
        </div>
        {canEdit && (
          <Link href={`/players/${player.id}/edit`}>
            <Button variant="glass" size="sm">
              Edit
            </Button>
          </Link>
        )}
      </Card>

      {/* Lifetime stats */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Stat label="Games" value={games} />
        <Stat label="Win rate" value={`${winRate}%`} accent />
        <Stat label="Wins" value={wins} />
        <Stat label="Losses" value={losses} />
      </div>

      {streak > 0 && (
        <Card className="mb-4 flex items-center justify-center gap-2 bg-gradient-to-r from-accent-from/30 to-accent-to/30 p-3">
          <span aria-hidden>🔥</span>
          <span className="text-sm font-semibold text-ink">
            {streak}-game win streak
          </span>
        </Card>
      )}

      {/* Recent games */}
      <h2 className="mb-2 px-1 font-heading text-sm font-semibold text-ink/70">
        Recent games
      </h2>
      {recent.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-ink/50">
          No games played yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 pb-2">
          {recent.map((g) => (
            <li
              key={g.game_id}
              className="glass-inner flex items-center justify-between px-4 py-3"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-ink">
                  {g.session_name}
                </span>
                <span className="text-xs text-ink/50">
                  Court {g.court_number} ·{" "}
                  {new Date(g.ended_at).toLocaleDateString()}
                </span>
              </div>
              <span
                className={
                  g.won
                    ? "rounded-full bg-gradient-to-r from-accent-from to-accent-to px-3 py-1 text-xs font-bold text-ink"
                    : "rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-ink/55"
                }
              >
                {g.won ? "Win" : "Loss"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-ink/50">
        {label}
      </div>
      <div
        className={`mt-1 font-heading text-2xl font-bold ${
          accent ? "text-primary" : "text-ink"
        }`}
      >
        {value}
      </div>
    </Card>
  );
}
