import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui";
import { PlayerForm } from "../../PlayerForm";
import { updatePlayer } from "@/lib/data/playerActions";
import { getPlayer } from "@/lib/data/players";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageGameplay } from "@/lib/auth/roles";

export default async function EditPlayerPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await getCurrentProfile();
  if (!canManageGameplay(profile?.role)) redirect(`/players/${params.id}`);

  const player = await getPlayer(params.id);
  if (!player) notFound();

  // Bind the id into the update action.
  const action = updatePlayer.bind(null, player.id);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Edit player"
        action={
          <Link href={`/players/${player.id}`}>
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </Link>
        }
      />
      <PlayerForm action={action} player={player} submitLabel="Save changes" />
    </div>
  );
}
