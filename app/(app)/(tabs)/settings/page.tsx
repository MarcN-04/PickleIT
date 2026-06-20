import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui";
import { SignOutButton } from "@/components/SignOutButton";
import { getCurrentProfile } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/auth/roles";

/** Placeholder — full settings + admin panel are built in Phase 9. */
export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="px-4">
      <PageHeader title="Settings" />
      <Card className="mb-4 p-5" animateIn>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-ink">{profile?.username}</p>
            <p className="text-sm text-ink/55">
              {profile ? ROLE_LABEL[profile.role] : ""}
            </p>
          </div>
          <SignOutButton variant="glass" />
        </div>
      </Card>
      <Card className="p-8 text-center">
        <p className="text-sm text-ink/60">
          Defaults, category labels, and the admin panel arrive in a later phase.
        </p>
      </Card>
    </div>
  );
}
