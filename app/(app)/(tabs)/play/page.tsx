import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui";
import { PlayIcon } from "@/components/icons";
import { StartSessionFlow } from "./StartSessionFlow";
import { getPlayers } from "@/lib/data/players";
import { getActiveSession } from "@/lib/data/sessions";
import { getAppSettings } from "@/lib/data/settings";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageGameplay } from "@/lib/auth/roles";

/**
 * Play (home) tab.
 * - If a session is active -> jump straight to the live session.
 * - Else, organizers/admins see the start-session flow; viewers see a notice.
 *
 * Default court count / pairing mode come from app settings (admin-configurable).
 */
export default async function PlayPage() {
  const active = await getActiveSession();
  if (active) redirect(`/play/session/${active.id}`);

  const profile = await getCurrentProfile();
  if (!canManageGameplay(profile?.role)) {
    return (
      <div>
        <PageHeader title="Play" subtitle="No active session" />
        <Card className="flex flex-col items-center p-8 text-center" animateIn>
          <PlayIcon size={36} className="mb-2 text-primary" />
          <p className="text-sm text-ink/70">
            There&apos;s no game running right now. An organizer can start a
            session.
          </p>
        </Card>
      </div>
    );
  }

  const [players, settings] = await Promise.all([
    getPlayers(),
    getAppSettings(),
  ]);

  return (
    <StartSessionFlow
      players={players}
      defaultCourtCount={settings.default_court_count}
      defaultPairingMode={settings.default_pairing_mode}
    />
  );
}
