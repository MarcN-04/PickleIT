import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card, CategoryBadge } from "@/components/ui";
import { HourglassIcon } from "@/components/icons";
import { EndSessionButton } from "../../EndSessionButton";
import { CourtCard, type CourtData } from "../CourtCard";
import { RealtimeSync } from "../RealtimeSync";
import { AutoInit } from "../AutoInit";
import { AddToSessionDialog } from "../AddToSessionDialog";
import { loadLiveSession } from "@/lib/data/liveSession";
import { getPlayers } from "@/lib/data/players";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageGameplay } from "@/lib/auth/roles";
import type { Category } from "@/lib/categories";

/**
 * Live dashboard. Renders courts (teams + timer + winner select), the up-next
 * group, and the numbered waiting list — all reconstructed from the DB so it
 * stays in sync across devices via RealtimeSync. AutoInit fills the courts via
 * the engine on first load.
 */
export default async function LiveSessionPage({
  params,
}: {
  params: { id: string };
}) {
  const live = await loadLiveSession(params.id);
  if (!live) notFound();
  if (live.session.status === "ended") redirect(`/play/summary/${live.session.id}`);

  const profile = await getCurrentProfile();
  const canManage = canManageGameplay(profile?.role);

  const { session, sessionPlayers, games, gamePlayers } = live;
  const modeLabel =
    session.pairing_mode === "balance" ? "Balance" : "King of the court";

  // Build court view models.
  const playerById = new Map(sessionPlayers.map((sp) => [sp.player_id, sp.player]));
  const courts: CourtData[] = games
    .slice()
    .sort((a, b) => a.court_number - b.court_number)
    .map((g) => {
      const team = (side: "a" | "b") =>
        gamePlayers
          .filter((gp) => gp.game_id === g.id && gp.team === side)
          .map((gp) => {
            const p = playerById.get(gp.player_id);
            return {
              id: gp.player_id,
              name: p?.name ?? "—",
              category: (p?.category ?? "beginner") as Category,
            };
          });
      return {
        court: g.court_number,
        gameId: g.id,
        startedAt: g.started_at,
        teamA: { players: team("a") },
        teamB: { players: team("b") },
      };
    });

  // Waiting list ordered by queue position; up-next = front 4.
  const waiting = sessionPlayers
    .filter((sp) => sp.state === "waiting")
    .sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0));
  const upNext = waiting.slice(0, 4);
  const rest = waiting.slice(4);

  const needsInit = games.length === 0 && waiting.length >= 4;

  // Candidates for late arrival = roster players not currently active here.
  const activeIds = new Set(
    sessionPlayers.filter((sp) => sp.state !== "left").map((sp) => sp.player_id)
  );
  const roster = canManage ? await getPlayers() : [];
  const candidates = roster
    .filter((p) => !activeIds.has(p.id))
    .map((p) => ({ id: p.id, name: p.name, category: p.category }));

  return (
    <div>
      <RealtimeSync sessionId={session.id} />
      <AutoInit sessionId={session.id} needsInit={needsInit && canManage} />

      <PageHeader
        title={session.name}
        subtitle={`${session.court_count} court${
          session.court_count > 1 ? "s" : ""
        } · ${modeLabel}`}
        action={canManage ? <EndSessionButton sessionId={session.id} /> : undefined}
      />

      <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-6">
      {/* Courts */}
      <div className="lg:min-w-0">
      {courts.length === 0 ? (
        <Card className="flex flex-col items-center p-8 text-center" animateIn>
          <HourglassIcon size={32} className="mb-2 text-ink/40" />
          <p className="text-sm text-ink/60">
            {waiting.length < 4
              ? "Waiting for at least 4 players to fill a court."
              : "Setting up the courts…"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {courts.map((c) => (
            <CourtCard
              key={c.court}
              sessionId={session.id}
              court={c}
              canManage={canManage}
            />
          ))}
        </div>
      )}
      </div>

      {/* Queue column (Up next + Waiting list) */}
      <div className="lg:sticky lg:top-4">
      {/* Up next */}
      {upNext.length > 0 && (
        <section className="mt-5 lg:mt-0">
          <h2 className="mb-2 px-1 font-heading text-sm font-semibold text-ink/70">
            Up next
          </h2>
          <Card className="border border-accent-to/40 bg-gradient-to-br from-accent-from/15 to-accent-to/15 p-3">
            <ul className="flex flex-wrap gap-2">
              {upNext.map((sp) => (
                <li
                  key={sp.id}
                  className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5"
                >
                  <span className="text-sm font-semibold text-ink">
                    {sp.player.name}
                  </span>
                  <CategoryBadge category={sp.player.category} size="sm" />
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* Waiting list */}
      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="font-heading text-sm font-semibold text-ink/70">
            Waiting list
          </h2>
          {canManage && (
            <AddToSessionDialog sessionId={session.id} candidates={candidates} />
          )}
        </div>
        {waiting.length === 0 ? (
          <p className="px-1 py-4 text-center text-sm text-ink/50">
            No one waiting.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 pb-2">
            {rest.length === 0 && upNext.length > 0 && (
              <p className="px-1 text-xs text-ink/45">
                Everyone waiting is up next.
              </p>
            )}
            {rest.map((sp, i) => (
              <li
                key={sp.id}
                className="glass-inner flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-heading text-xs font-bold text-ink/40">
                    {i + 5}
                  </span>
                  <span className="font-medium text-ink">{sp.player.name}</span>
                </div>
                <CategoryBadge category={sp.player.category} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
      </div>
    </div>
  );
}
