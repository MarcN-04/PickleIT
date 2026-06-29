"use client";

import { TierDot } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/categories";
import type { TeamSide } from "@/types/database";

export type MatchupPlayer = { id: string; name: string; category: Category };
export type MatchupTeam = { players: MatchupPlayer[] };

/**
 * The "Team A · VS · Team B" row shown under a court diagram (and in the Up next
 * preview). Each player is a bare tier dot + name (no text badge — decoded by
 * the legend). When `onPick` handlers are supplied the team halves become
 * tappable winner-select targets.
 */
export function MatchupRow({
  teamA,
  teamB,
  picking = false,
  disabled = false,
  winner,
  onPickA,
  onPickB,
}: {
  teamA: MatchupTeam;
  teamB: MatchupTeam;
  picking?: boolean;
  disabled?: boolean;
  /** Highlight only the winning half (used for the optimistic "recording" state). */
  winner?: TeamSide | null;
  onPickA?: () => void;
  onPickB?: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
      <TeamHalf
        team={teamA}
        highlight={picking || winner === "a"}
        dim={winner === "b"}
        onPick={onPickA}
        disabled={disabled}
      />
      <div className="flex items-center justify-center">
        <span className="rounded-full bg-white/70 px-2 py-0.5 font-heading text-[11px] font-bold text-ink/65">
          VS
        </span>
      </div>
      <TeamHalf
        team={teamB}
        highlight={picking || winner === "b"}
        dim={winner === "a"}
        onPick={onPickB}
        disabled={disabled}
        alignRight
      />
    </div>
  );
}

function TeamHalf({
  team,
  highlight,
  dim = false,
  onPick,
  disabled,
  alignRight = false,
}: {
  team: MatchupTeam;
  highlight: boolean;
  dim?: boolean;
  onPick?: () => void;
  disabled?: boolean;
  alignRight?: boolean;
}) {
  const content = (
    <div
      className={cn(
        // w-full keeps both team boxes equal width; min-w-0 lets names truncate
        "flex h-full w-full min-w-0 flex-col justify-center gap-1.5 rounded-glass p-2.5 transition-opacity",
        highlight
          ? "border border-accent-to bg-gradient-to-br from-accent-from/20 to-accent-to/20"
          : "glass-inner",
        dim && "opacity-50",
        alignRight ? "items-end text-right" : "items-start"
      )}
    >
      {team.players.map((p) => (
        <div
          key={p.id}
          className={cn(
            "flex w-full min-w-0 items-center gap-1.5",
            alignRight && "flex-row-reverse"
          )}
        >
          <TierDot category={p.category} />
          <span
            title={p.name}
            className="min-w-0 flex-1 truncate text-sm font-semibold text-ink"
          >
            {p.name}
          </span>
        </div>
      ))}
    </div>
  );

  if (onPick) {
    return (
      <button
        type="button"
        onClick={onPick}
        disabled={disabled}
        className={cn(
          "flex w-full min-w-0 transition-transform active:scale-95 disabled:opacity-60",
          alignRight ? "text-right" : "text-left"
        )}
      >
        {content}
      </button>
    );
  }
  return content;
}
