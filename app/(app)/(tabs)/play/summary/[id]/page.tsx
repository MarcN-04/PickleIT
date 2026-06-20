import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button } from "@/components/ui";
import { getSession } from "@/lib/data/sessions";

/**
 * End-session summary — PLACEHOLDER.
 * The full recap (games played, results) is built in Phase 9.
 */
export default async function SummaryPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession(params.id);
  if (!session) notFound();

  return (
    <div className="px-4">
      <PageHeader title="Session ended" subtitle={session.name} />
      <Card className="p-8 text-center" animateIn>
        <div className="mb-2 text-3xl" aria-hidden>
          ✅
        </div>
        <p className="mb-5 text-sm text-ink/60">
          This session is closed. The full summary (games played and results)
          arrives in a later phase.
        </p>
        <Link href="/play">
          <Button>Back to Play</Button>
        </Link>
      </Card>
    </div>
  );
}
