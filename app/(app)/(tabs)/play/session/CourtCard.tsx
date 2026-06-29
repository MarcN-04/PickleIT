"use client";

import { useOptimistic, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button } from "@/components/ui";
import { GameTimer } from "@/components/GameTimer";
import { ClockIcon } from "@/components/icons";
import { CourtDiagram } from "../CourtDiagram";
import { MatchupRow, type MatchupTeam } from "./MatchupRow";
import { recordWinner, startGame } from "@/lib/data/liveSessionActions";
import { markLocalMutation } from "./localMutation";
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

  // Optimistic overlay describing the in-flight intent. The base value is
  // always derived from props (the DB source of truth), so when a transition
  // resolves the overlay is discarded automatically: on success the fresh
  // server props already reflect the change (no flicker); on error the props
  // are unchanged, so we revert to exactly the previous DB state. The optimistic
  // state therefore can never desync from the DB — it is presentation-only and
  // strictly shorter-lived than the transition.
  type Optimistic = { kind: "starting" } | { kind: "recording"; winner: TeamSide };
  const [optimistic, applyOptimistic] = useOptimistic<Optimistic | null>(null);

  const effectiveStatus: GameStatus =
    optimistic?.kind === "starting" ? "in_progress" : court.status;
  const isAwaitingStart = effectiveStatus === "pending";
  // While optimistically starting, show the timer running from this instant.
  const startedAt =
    optimistic?.kind === "starting" && court.status === "pending"
      ? new Date().toISOString()
      : court.startedAt;
  const isRecording = optimistic?.kind === "recording";
  const recordingWinner = isRecording ? optimistic.winner : null;

  function pick(winner: TeamSide) {
    setError(null);
    startTransition(async () => {
      // Show "recording…" / the chosen winner before the round-trip settles.
      applyOptimistic({ kind: "recording", winner });
      markLocalMutation();
      const res = await recordWinner(sessionId, court.court, winner);
      if (res?.error) setError(res.error);
      else setPicking(false);
    });
  }

  function start() {
    setError(null);
    startTransition(async () => {
      // Show the started/running state before the round-trip settles.
      applyOptimistic({ kind: "starting" });
      markLocalMutation();
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
            <GameTimer startedAt={startedAt} />
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
        picking={picking && !isRecording}
        disabled={isPending}
        winner={recordingWinner}
        onPickA={picking && !isRecording ? () => pick("a") : undefined}
        onPickB={picking && !isRecording ? () => pick("b") : undefined}
      />

      {error && (
        <p role="alert" className="text-center text-xs text-red-700">
          {error}
        </p>
      )}

      {canManage && (
        <div>
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                key="recording"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-ink/70"
                role="status"
                aria-live="polite"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent-to" />
                Recording Team {recordingWinner === "a" ? "A" : "B"} win…
              </motion.div>
            ) : isAwaitingStart ? (
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
