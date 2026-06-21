import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui";
import { SignOutButton } from "@/components/SignOutButton";
import { SettingsForm } from "./SettingsForm";
import { UserManagement } from "./UserManagement";
import { getCurrentProfile } from "@/lib/auth/session";
import { ROLE_LABEL, isAdmin } from "@/lib/auth/roles";
import { getAppSettings, getAllProfiles } from "@/lib/data/settings";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const admin = isAdmin(profile.role);
  const [settings, profiles] = await Promise.all([
    getAppSettings(),
    admin ? getAllProfiles() : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Settings" />

      {/*
        Admin sees wide 2-col panels (defaults + users); a non-admin only has the
        account/info cards, so we cap those to a single readable column instead
        of stretching three sparse cards across the whole width.
      */}
      <div className={admin ? "flex flex-col gap-4" : "flex max-w-2xl flex-col gap-4"}>
        {/* Account */}
        <Card className="flex items-center justify-between p-5" animateIn>
          <div>
            <p className="text-base font-semibold text-ink">{profile.username}</p>
            <p className="text-sm text-ink/70">{ROLE_LABEL[profile.role]}</p>
          </div>
          <SignOutButton variant="glass" />
        </Card>

        {/* Admin: defaults + user management, side by side on desktop */}
        {admin && (
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <SettingsForm settings={settings} />
            <UserManagement profiles={profiles} currentUserId={profile.id} />
          </div>
        )}

        {/* Data & backup */}
        <Card className="p-5">
          <h2 className="mb-1.5 font-heading text-base font-bold text-ink">
            Data &amp; backup
          </h2>
          <p className="text-sm leading-relaxed text-ink/70">
            All data lives in your Supabase project. To back up or export, use the
            Supabase dashboard → Table editor → Export, or the SQL editor. Player
            stats and history persist across sessions automatically.
          </p>
        </Card>

        {/* About */}
        <Card className="p-5">
          <h2 className="mb-1.5 font-heading text-base font-bold text-ink">
            About
          </h2>
          <p className="text-sm text-ink/70">
            PickleIT · v0.1.0 — automated, fair pickleball rotation.
          </p>
        </Card>
      </div>
    </div>
  );
}
