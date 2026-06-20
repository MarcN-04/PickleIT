import { PageHeader } from "@/components/PageHeader";
import { LeaderboardTable } from "./LeaderboardTable";
import { getAllPlayerStats } from "@/lib/data/players";

export default async function LeaderboardPage() {
  const stats = await getAllPlayerStats();
  return (
    <div>
      <PageHeader title="Leaderboard" subtitle="Lifetime rankings" />
      <LeaderboardTable stats={stats} />
    </div>
  );
}
