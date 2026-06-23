import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { HourglassIcon } from "@/components/icons";
import { EndSessionButton } from "../../EndSessionButton";
import { CourtCard, type CourtData } from "../CourtCard";
import { SessionQueuePanel, type QueuePlayer } from "../SessionQueuePanel";
import { RealtimeSync } from "../RealtimeSync";
import { AutoInit } from "../AutoInit";
import { loadLiveSession, groupGamePlayers } from "@/lib/data/liveSession";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageGameplay } from "@/lib/auth/roles";
import { type Category } from "@/lib/categories";

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

/**
 * Live dashboard. A date-titled header with a live indicator + tier legend,
 * a responsive grid of court cards (real diagrams + matchups + timers), and a
 * full-height sticky right panel (Up next + waiting list). All reconstructed
 * from the DB so it stays in sync across devices via RealtimeSync. AutoInit
 * fills the courts via the engine on first load.
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
  const dateTitle = DATE_FMT.format(new Date(session.created_at));

  // Build court view models. Group game_players by game_id once (O(n)) rather
  // than re-filtering the whole array per team per court.
  const playerById = new Map(sessionPlayers.map((sp) => [sp.player_id, sp.player]));
  const gpByGame = groupGamePlayers(gamePlayers);
  const courts: CourtData[] = games
    .slice()
    .sort((a, b) => a.court_number - b.court_number)
    .map((g) => {
      const roster = gpByGame.get(g.id) ?? { a: [], b: [] };
      const team = (side: "a" | "b") =>
        roster[side].map((playerId) => {
          const p = playerById.get(playerId);
          return {
            id: playerId,
            name: p?.name ?? "—",
            category: (p?.category ?? "beginner") as Category,
          };
        });
      return {
        court: g.court_number,
        gameId: g.id,
        status: g.status,
        startedAt: g.started_at,
        teamA: { players: team("a") },
        teamB: { players: team("b") },
      };
    });

  const liveCount = courts.filter((c) => c.status === "in_progress").length;

  // Waiting list ordered by queue position; up-next = front 4.
  const waiting: QueuePlayer[] = sessionPlayers
    .filter((sp) => sp.state === "waiting")
    .sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0))
    .map((sp) => ({
      id: sp.player_id,
      name: sp.player.name,
      category: sp.player.category,
    }));
  const upNext = waiting.slice(0, 4);
  const rest = waiting.slice(4);

  const needsInit = games.length === 0 && waiting.length >= 4;

  return (
    <div className="lg:flex lg:h-[calc(100dvh-1.5rem)] lg:flex-col lg:overflow-hidden">
      <RealtimeSync sessionId={session.id} />
      <AutoInit sessionId={session.id} needsInit={needsInit && canManage} />

      {/* Two equal-height columns: courts (header pinned on top, list scrolls)
          + the full-height queue panel (flush with the SideNav band). */}
      <div className="lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-stretch lg:gap-6 lg:overflow-hidden">
        {/* ── Left column: header + scrolling courts ── */}
        <div className="flex flex-col lg:h-full lg:min-h-0 lg:overflow-hidden">
          {/* Header — confined to the courts column so End session aligns above
              the courts, not stretched across the panel. */}
          <header className="flex flex-wrap items-center justify-between gap-3 px-1 pb-4 pt-2">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-ink lg:text-3xl">
                {dateTitle}
              </h1>
              <p className="mt-0.5 flex items-center gap-2 text-sm text-ink/70">
                <span>
                  {session.court_count} court{session.court_count > 1 ? "s" : ""} ·{" "}
                  {modeLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  <span className="font-medium text-ink/80">
                    {liveCount} game{liveCount === 1 ? "" : "s"} live
                  </span>
                </span>
              </p>
            </div>
            {canManage && (
              <div className="shrink-0">
                <EndSessionButton sessionId={session.id} />
              </div>
            )}
          </header>

          {/* The only scroll region within the fixed band. Negative margin +
              matching padding gives card drop-shadows room to breathe instead
              of being clipped by overflow-y-auto. */}
          <div className="no-scrollbar -mx-2 px-2 pb-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {courts.length === 0 ? (
              <Card className="flex flex-col items-center p-8 text-center" animateIn>
                <HourglassIcon size={32} className="mb-2 text-ink/65" />
                <p className="text-sm text-ink/70">
                  {waiting.length < 4
                    ? "Waiting for at least 4 players to fill a court."
                    : "Setting up the courts…"}
                </p>
              </Card>
            ) : (
              // Uniform cards: at least 320px wide, but stretch to fill the
              // available width (auto-fit collapses empty tracks; 1fr removes
              // the cap). Rows stretch to equal height. Long names truncate
              // (see MatchupRow) instead of widening a card.
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-stretch gap-4">
                {courts.map((c) => (
                  // Key by gameId (not court): when a game ends, the new pending
                  // game on that court has a fresh id, so the card remounts and
                  // any optimistic state resets to show the real next match.
                  <CourtCard
                    key={c.gameId}
                    sessionId={session.id}
                    court={c}
                    canManage={canManage}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: full-height queue panel (drops in-flow on mobile) ── */}
        <div className="mt-5 lg:mt-0 lg:h-full lg:min-h-0">
          <SessionQueuePanel
            sessionId={session.id}
            upNext={upNext}
            rest={rest}
            canManage={canManage}
          />
        </div>
      </div>
    </div>
  );
}
