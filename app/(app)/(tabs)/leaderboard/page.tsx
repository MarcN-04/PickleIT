import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui";

/** Placeholder — the full leaderboard is built in Phase 9. */
export default function LeaderboardPage() {
  return (
    <div className="px-4">
      <PageHeader title="Leaderboard" subtitle="Rankings" />
      <Card className="p-8 text-center" animateIn>
        <div className="mb-2 text-3xl" aria-hidden>
          🏆
        </div>
        <p className="text-sm text-ink/60">Rankings arrive in a later phase.</p>
      </Card>
    </div>
  );
}
