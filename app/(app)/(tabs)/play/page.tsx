import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui";

/** Placeholder — the full Play session flow is built in Phase 6+. */
export default function PlayPage() {
  return (
    <div className="px-4">
      <PageHeader title="Play" subtitle="Start a session" />
      <Card className="p-8 text-center" animateIn>
        <div className="mb-2 text-3xl" aria-hidden>
          🎾
        </div>
        <p className="text-sm text-ink/60">
          The session flow (start, select players, live dashboard) arrives next.
        </p>
      </Card>
    </div>
  );
}
