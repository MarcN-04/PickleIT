import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card, CategoryBadge, Button } from "@/components/ui";
import { getSession, getSessionPlayers } from "@/lib/data/sessions";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageGameplay } from "@/lib/auth/roles";
import { EndSessionButton } from "../../EndSessionButton";

/**
 * Live session view — PLACEHOLDER.
 * Phase 7 adds the rotation engine; Phase 8 turns this into the real live
 * dashboard (courts, teams, timer, winner select) with Realtime sync.
 * For now it confirms enrollment: the session settings + enrolled roster.
 */
export default async function LiveSessionPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession(params.id);
  if (!session) notFound();
  if (session.status === "ended") redirect(`/play/summary/${session.id}`);

  const [sps, profile] = await Promise.all([
    getSessionPlayers(session.id),
    getCurrentProfile(),
  ]);
  const canManage = canManageGameplay(profile?.role);

  const modeLabel =
    session.pairing_mode === "balance" ? "Balance" : "King of the court";

  return (
    <div className="px-4">
      <PageHeader
        title={session.name}
        subtitle={`${session.court_count} court${
          session.court_count > 1 ? "s" : ""
        } · ${modeLabel}`}
        action={canManage ? <EndSessionButton sessionId={session.id} /> : undefined}
      />

      <Card className="mb-4 p-4 text-center" animateIn>
        <p className="text-sm text-ink/60">
          Session started with{" "}
          <span className="font-semibold text-ink">{sps.length} players</span>.
          The live dashboard (courts, teams, timer, winner select) is built in
          the next phase.
        </p>
      </Card>

      <h2 className="mb-2 px-1 font-heading text-sm font-semibold text-ink/70">
        Enrolled players
      </h2>
      <ul className="flex flex-col gap-2 pb-2">
        {sps
          .slice()
          .sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0))
          .map((sp) => (
            <li
              key={sp.id}
              className="glass-inner flex items-center justify-between px-4 py-3"
            >
              <span className="font-medium text-ink">{sp.player.name}</span>
              <CategoryBadge category={sp.player.category} size="sm" />
            </li>
          ))}
      </ul>
    </div>
  );
}
