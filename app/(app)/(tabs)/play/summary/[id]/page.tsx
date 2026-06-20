import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button, CategoryBadge } from "@/components/ui";
import { getSession } from "@/lib/data/sessions";
import { getSessionSummary } from "@/lib/data/summary";

/**
 * End-session summary: total games, a per-player win tally, and a list of every
 * completed game with teams + winner.
 */
export default async function SummaryPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession(params.id);
  if (!session) notFound();

  const summary = await getSessionSummary(session.id);

  return (
    <div>
      <PageHeader
        title="Session summary"
        subtitle={session.name}
        action={
          <Link href="/play">
            <Button size="sm">New session</Button>
          </Link>
        }
      />

      <Card className="mb-4 flex items-center justify-around p-5" animateIn>
        <Stat label="Games" value={summary.totalGames} />
        <div className="h-10 w-px bg-ink/10" />
        <Stat
          label="Players"
          value={summary.topPlayers.length}
        />
      </Card>

      {summary.topPlayers.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 px-1 font-heading text-sm font-semibold text-ink/70">
            Wins this session
          </h2>
          <ul className="flex flex-col gap-2">
            {summary.topPlayers.map((p, i) => (
              <li
                key={p.name}
                className="glass-inner flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-heading text-xs font-bold text-ink/40">
                    {i + 1}
                  </span>
                  <span className="font-medium text-ink">{p.name}</span>
                </div>
                <span
                  className={
                    i === 0 && p.wins > 0
                      ? "rounded-full bg-gradient-to-r from-accent-from to-accent-to px-3 py-1 text-xs font-bold text-ink"
                      : "text-sm text-ink/60"
                  }
                >
                  {p.wins}W · {p.games}G
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="mb-2 px-1 font-heading text-sm font-semibold text-ink/70">
        Games played
      </h2>
      {summary.games.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-ink/50">
          No games were completed in this session.
        </p>
      ) : (
        <ul className="grid gap-2 pb-2 sm:grid-cols-2">
          {summary.games.map((g, i) => (
            <li key={g.gameId}>
              <Card className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-heading text-xs font-bold text-ink/50">
                    Game {i + 1} · Court {g.court}
                  </span>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <TeamLine team={g.teamA} won={g.winner === "a"} />
                  <span className="font-heading text-[11px] font-bold text-ink/40">
                    VS
                  </span>
                  <TeamLine team={g.teamB} won={g.winner === "b"} alignRight />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-heading text-3xl font-bold text-ink">{value}</div>
      <div className="text-xs uppercase tracking-wide text-ink/50">{label}</div>
    </div>
  );
}

function TeamLine({
  team,
  won,
  alignRight = false,
}: {
  team: Array<{ name: string; category: import("@/lib/categories").Category }>;
  won: boolean;
  alignRight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-glass p-2 ${
        won
          ? "bg-gradient-to-br from-accent-from/25 to-accent-to/25"
          : "bg-white/40"
      } ${alignRight ? "items-end text-right" : "items-start"}`}
    >
      {won && (
        <span className="text-[10px] font-bold uppercase tracking-wide text-cat-proInk">
          Winner
        </span>
      )}
      {team.map((p) => (
        <div
          key={p.name}
          className={`flex items-center gap-1.5 ${
            alignRight ? "flex-row-reverse" : ""
          }`}
        >
          <span className="text-sm font-medium text-ink">{p.name}</span>
          <CategoryBadge category={p.category} size="sm" />
        </div>
      ))}
    </div>
  );
}
