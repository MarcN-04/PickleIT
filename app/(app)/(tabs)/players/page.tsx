import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui";
import { RosterList } from "./RosterList";
import { getPlayers, getAllPlayerStats } from "@/lib/data/players";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageGameplay } from "@/lib/auth/roles";
import type { PlayerStats } from "@/types/database";

export default async function PlayersPage() {
  const [players, stats, profile] = await Promise.all([
    getPlayers(),
    getAllPlayerStats(),
    getCurrentProfile(),
  ]);

  const statsById: Record<string, PlayerStats> = Object.fromEntries(
    stats.map((s) => [s.player_id, s])
  );

  const canEdit = canManageGameplay(profile?.role);

  return (
    <div className="px-4">
      <PageHeader
        title="Players"
        subtitle={`${players.length} in the roster`}
        action={
          canEdit ? (
            <Link href="/players/new">
              <Button size="sm">+ Add</Button>
            </Link>
          ) : undefined
        }
      />
      <RosterList players={players} statsById={statsById} />
    </div>
  );
}
