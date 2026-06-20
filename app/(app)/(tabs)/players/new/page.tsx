import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui";
import { PlayerForm } from "../PlayerForm";
import { createPlayer } from "@/lib/data/playerActions";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageGameplay } from "@/lib/auth/roles";

export default async function NewPlayerPage() {
  const profile = await getCurrentProfile();
  if (!canManageGameplay(profile?.role)) redirect("/players");

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Add player"
        action={
          <Link href="/players">
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </Link>
        }
      />
      <PlayerForm action={createPlayer} submitLabel="Add player" />
    </div>
  );
}
