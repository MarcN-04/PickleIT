import { Card } from "@/components/ui";
import { HourglassIcon } from "@/components/icons";
import { SignOutButton } from "@/components/SignOutButton";
import { getCurrentProfile } from "@/lib/auth/session";
import { isPending } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

/**
 * Shown to signed-in users who haven't been assigned a role yet.
 * Approved users are redirected away.
 */
export default async function PendingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!isPending(profile.role)) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 py-12">
      <Card className="w-full p-7 text-center" animateIn>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/70 text-ink/60 shadow-glass">
          <HourglassIcon size={26} />
        </div>
        <h1 className="font-heading text-xl font-bold text-ink">
          Waiting for approval
        </h1>
        <p className="mt-2 text-sm text-ink/65">
          You&apos;re signed in as{" "}
          <span className="font-semibold text-ink">{profile.username}</span>. An
          Admin needs to assign you a role before you can use PickleIT. Check
          back soon.
        </p>
        <div className="mt-6 flex justify-center">
          <SignOutButton variant="glass" />
        </div>
      </Card>
    </main>
  );
}
