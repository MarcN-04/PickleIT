"use client";

import { useEffect, useState, useTransition } from "react";
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

  // Optimistic flags so the three interactions update on the click, before the
  // server responds and the page refreshes with the authoritative state.
  // - optimisticDone: a winner was tapped — stop the timer + show a "Loading
  //   next match…" placeholder immediately. Reconciles automatically because the
  //   refreshed page gives this court a NEW pending game (new gameId → remount).
  // - optimisticStartedAt: Start was tapped — run the timer from this instant
  //   until the DB started_at arrives. Cleared by the status effect below.
  const [optimisticDone, setOptimisticDone] = useState(false);
  const [optimisticStartedAt, setOptimisticStartedAt] = useState<string | null>(null);

  // Once the real DB state catches up (status flips to in_progress), drop the
  // optimistic start timestamp and recompute from the authoritative started_at.
  useEffect(() => {
    if (court.status === "in_progress") setOptimisticStartedAt(null);
  }, [court.status]);

  const isRunning = court.status === "in_progress" || optimisticStartedAt != null;
  const isAwaitingStart = court.status === "pending" && !optimisticStartedAt;
  const runningStartedAt = court.status === "in_progress" ? court.startedAt : optimisticStartedAt;

  function pick(winner: TeamSide) {
    setError(null);
    setOptimisticDone(true); // stop the timer + show "Loading next match…" now
    startTransition(async () => {
      const res = await recordWinner(sessionId, court.court, winner);
      if (res?.error) {
        setError(res.error);
        setOptimisticDone(false); // revert on failure
      } else {
        setPicking(false);
      }
    });
  }

  function start() {
    setError(null);
    setOptimisticStartedAt(new Date().toISOString()); // timer starts now
    startTransition(async () => {
      const res = await startGame(sessionId, court.court);
      if (res?.error) {
        setError(res.error);
        setOptimisticStartedAt(null); // revert on failure
      }
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
          {/* When done (winner picked) or awaiting start: no running timer.
              GameTimer unmounts here, so its interval is cleared and the
              count-up truly stops the instant the winner is tapped. */}
          {isRunning && runningStartedAt && !optimisticDone ? (
            <GameTimer startedAt={runningStartedAt} />
          ) : (
            <span
              className="font-heading text-xs font-semibold tabular-nums"
              aria-label="Game time"
            >
              --:--
            </span>
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

      {/* Matchup row (tappable team halves while picking a winner). While the
          winner is being recorded, swap in a placeholder — the real next four
          come from the server's engine result on refresh. */}
      {optimisticDone ? (
        <p className="py-3 text-center text-sm font-medium text-ink/60">
          Loading next match…
        </p>
      ) : (
        <MatchupRow
          teamA={court.teamA}
          teamB={court.teamB}
          picking={picking}
          disabled={isPending}
          onPickA={picking ? () => pick("a") : undefined}
          onPickB={picking ? () => pick("b") : undefined}
        />
      )}

      {error && (
        <p role="alert" className="text-center text-xs text-red-700">
          {error}
        </p>
      )}

      {canManage && !optimisticDone && (
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
