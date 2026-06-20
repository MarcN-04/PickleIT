import { redirect } from "next/navigation";
import { Card, Button } from "@/components/ui";
import { SignOutButton } from "@/components/SignOutButton";
import { getCurrentProfile } from "@/lib/auth/session";
import { isPending } from "@/lib/auth/roles";
import { ROLE_LABEL } from "@/lib/auth/roles";
import Link from "next/link";

/**
 * Authenticated home. The full Play flow + bottom tab bar arrive in later
 * phases; for now this confirms auth + role and links to what exists.
 */
export default async function Home() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (isPending(profile.role)) redirect("/pending");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-5 py-12">
      <Card className="p-7 text-center" animateIn>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-from to-primary-to text-2xl shadow-glass-lift">
          <span aria-hidden>🥒</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink">
          Hi, {profile.username}
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Signed in as{" "}
          <span className="font-semibold text-primary">
            {ROLE_LABEL[profile.role]}
          </span>
          .
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link href="/style">
            <Button variant="glass" fullWidth>
              View design system
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-[11px] uppercase tracking-wide text-ink/40">
          Phase 4 · Auth + roles · tabs come next
        </p>
      </Card>

      <div className="flex justify-center">
        <SignOutButton />
      </div>
    </main>
  );
}
