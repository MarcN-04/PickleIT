"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button } from "@/components/ui";
import { GameTimer } from "@/components/GameTimer";
import { ClockIcon } from "@/components/icons";
import { CourtDiagram } from "../CourtDiagram";
import { MatchupRow, type MatchupTeam } from "./MatchupRow";
import { recordWinner, startGame } from "@/lib/data/liveSessionActions";
import type { GameStatus, TeamSide } from "@/types/database";

export type CourtTeam = MatchupTeam;

export type CourtData = {
  court: number;
  gameId: string;
  status: GameStatus;
  startedAt: string;
  teamA: CourtTeam;
  teamB: CourtTeam;
};

/**
 * One court: a real court diagram with the two 2v2 teams placed on it, the
 * matchup row beneath, a persistent timer chip, and the Start Game / Game over
 * control. Tapping Game over opens winner-select; tapping the winning team
 * records the result.
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
    <Card className="flex flex-col gap-3 p-4" animateIn>
      {/* Header: court name + timer chip */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-ink">
          Court {court.court}
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-ink/70">
          <ClockIcon size={14} />
          {isAwaitingStart ? (
            <span
              className="font-heading text-xs font-semibold tabular-nums"
              aria-label="Game time"
            >
              --:--
            </span>
          ) : (
            <GameTimer startedAt={court.startedAt} />
          )}
        </span>
      </div>

      {/* Real court diagram — fixed height so every card is identical
          regardless of card width or name length. */}
      <div className="h-44">
        <CourtDiagram
          teamA={court.teamA.players}
          teamB={court.teamB.players}
        />
      </div>

      {/* Matchup row (tappable team halves while picking a winner) */}
      <MatchupRow
        teamA={court.teamA}
        teamB={court.teamB}
        picking={picking}
        disabled={isPending}
        onPickA={picking ? () => pick("a") : undefined}
        onPickB={picking ? () => pick("b") : undefined}
      />

      {error && (
        <p role="alert" className="text-center text-xs text-red-700">
          {error}
        </p>
      )}

      {canManage && (
        <div>
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
