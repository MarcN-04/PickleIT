"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, CategoryBadge } from "@/components/ui";
import { GameTimer } from "@/components/GameTimer";
import { ClockIcon } from "@/components/icons";
import { recordWinner, startGame } from "@/lib/data/liveSessionActions";
import type { Category } from "@/lib/categories";
import type { GameStatus, TeamSide } from "@/types/database";

export type CourtTeam = {
  players: Array<{ id: string; name: string; category: Category }>;
};

export type CourtData = {
  court: number;
  gameId: string;
  status: GameStatus;
  startedAt: string;
  teamA: CourtTeam;
  teamB: CourtTeam;
};

/**
 * One court: the two 2v2 teams, the persistent timer, and a Game over button
 * that opens winner-select. Tapping the winning team records the result.
 */
export function CourtCard({
  sessionId,
  court,
  canManage,
}: {
  sessionId: string;
  court: CourtData;
  canManage: boolean;
}) {
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isAwaitingStart = court.status === "pending";

  function pick(winner: TeamSide) {
    setError(null);
    startTransition(async () => {
      const res = await recordWinner(sessionId, court.court, winner);
      if (res?.error) setError(res.error);
      else setPicking(false);
    });
  }

  function start() {
    setError(null);
    startTransition(async () => {
      const res = await startGame(sessionId, court.court);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <Card className="p-4" animateIn>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-ink">
          Court {court.court}
        </h3>
        <span className="flex items-center gap-1 text-ink/70">
          <ClockIcon size={15} />
          {isAwaitingStart ? (
            <span
              className="font-heading text-sm font-semibold tabular-nums text-ink/70"
              aria-label="Game time"
            >
              --:--
            </span>
          ) : (
            <GameTimer startedAt={court.startedAt} />
          )}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
        <TeamPanel
          team={court.teamA}
          highlight={picking}
          onPick={picking ? () => pick("a") : undefined}
          disabled={isPending}
        />
        <div className="flex items-center justify-center">
          <span className="font-heading text-xs font-bold text-ink/65">VS</span>
        </div>
        <TeamPanel
          team={court.teamB}
          highlight={picking}
          onPick={picking ? () => pick("b") : undefined}
          disabled={isPending}
          alignRight
        />
      </div>

      {error && (
        <p role="alert" className="mt-2 text-center text-xs text-red-700">
          {error}
        </p>
      )}

      {canManage && (
        <div className="mt-3">
          <AnimatePresence mode="wait">
            {isAwaitingStart ? (
              <motion.div
                key="start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={start}
                  disabled={isPending}
                >
                  Start Game
                </Button>
              </motion.div>
            ) : picking ? (
              <motion.div
                key="picking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-xs text-ink/70">Tap the winning team</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPicking(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  variant="accent"
                  size="lg"
                  fullWidth
                  onClick={() => setPicking(true)}
                >
                  Game Over
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}

function TeamPanel({
  team,
  highlight,
  onPick,
  disabled,
  alignRight = false,
}: {
  team: CourtTeam;
  highlight: boolean;
  onPick?: () => void;
  disabled?: boolean;
  alignRight?: boolean;
}) {
  const content = (
    <div
      className={`flex flex-col gap-1.5 rounded-glass p-3 ${
        highlight
          ? "border border-accent-to bg-gradient-to-br from-accent-from/20 to-accent-to/20"
          : "glass-inner"
      } ${alignRight ? "items-end text-right" : "items-start"}`}
    >
      {team.players.map((p) => (
        <div
          key={p.id}
          className={`flex items-center gap-2 ${alignRight ? "flex-row-reverse" : ""}`}
        >
          <span className="text-sm font-semibold text-ink">{p.name}</span>
          <CategoryBadge category={p.category} size="sm" />
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
        className="text-left transition-transform active:scale-95 disabled:opacity-60"
      >
        {content}
      </button>
    );
  }
  return content;
}
