import { PageHeader } from "@/components/PageHeader";
import { LeaderboardTable } from "./LeaderboardTable";
import { getAllPlayerStats } from "@/lib/data/players";

export default async function LeaderboardPage() {
  const stats = await getAllPlayerStats();
  return (
    <div className="px-4">
      <PageHeader title="Leaderboard" subtitle="Lifetime rankings" />
      <LeaderboardTable stats={stats} />
    </div>
  );
}
