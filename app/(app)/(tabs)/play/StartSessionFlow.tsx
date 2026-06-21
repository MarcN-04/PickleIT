"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Chip } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { CATEGORIES, CATEGORY_META, type Category } from "@/lib/categories";
import { popIn, staggerContainer } from "@/lib/motion";
import { startSession } from "@/lib/data/sessionActions";
import { ScaleIcon, CrownIcon } from "@/components/icons";
import { SessionPreview } from "./SessionPreview";
import { SessionSummaryPanel } from "./SessionSummaryPanel";
import { PlayerCard } from "./PlayerCard";
import type { Player, PairingMode } from "@/types/database";

type Props = {
  players: Player[];
  defaultCourtCount: number;
  defaultPairingMode: PairingMode;
};

const MODE_LABEL: Record<PairingMode, string> = {
  balance: "Balance",
  king_of_the_court: "King of the court",
};

const MODE_BLURB: Record<PairingMode, string> = {
  balance: "Everyone rotates fairly; teams are balanced each game.",
  king_of_the_court: "Winners hold the court (split + new challengers); losers re-queue.",
};

const MODE_ICON: Record<PairingMode, typeof ScaleIcon> = {
  balance: ScaleIcon,
  king_of_the_court: CrownIcon,
};

const STEPS = [
  { n: 1 as const, label: "Courts & pairing" },
  { n: 2 as const, label: "Players" },
];

/** Slim two-step progress marker. Reflects the current step; emerald for done/active. */
function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <ol className="mb-6 flex items-center gap-3" aria-label="Setup progress">
      {STEPS.map(({ n, label }, i) => {
        const active = n === step;
        const done = n < step;
        return (
          <li
            key={n}
            aria-current={active ? "step" : undefined}
            className="flex items-center gap-3"
          >
            <span className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                  active || done
                    ? "border-primary bg-gradient-to-r from-primary-from to-primary-to text-white"
                    : "border-ink/20 text-ink/55"
                }`}
              >
                {n}
              </span>
              <span
                className={`font-heading text-sm font-semibold ${
                  active ? "text-ink" : "text-ink/55"
                }`}
              >
                {label}
              </span>
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={`hidden h-px w-8 sm:block ${
                  done ? "bg-primary/50" : "bg-ink/15"
                }`}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Two-step session setup:
 *   1. Courts + pairing mode
 *   2. Select players (grouped, with counts + add walk-in)
 * Then persists via the startSession action, which redirects to the live session.
 */
export function StartSessionFlow({
  players,
  defaultCourtCount,
  defaultPairingMode,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [courtCount, setCourtCount] = useState(defaultCourtCount);
  const [mode, setMode] = useState<PairingMode>(defaultPairingMode);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const grouped = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        cat,
        players: players
          .filter((p) => p.category === cat)
          .sort((a, b) => a.name.localeCompare(b.name)),
      })),
    [players]
  );

  const totalPlayers = players.length;
  const enough = selected.size >= 4;
  const selectedPlayers = useMemo(
    () => players.filter((p) => selected.has(p.id)),
    [players, selected]
  );

  const addWalkIn = (id: string) =>
    setSelected((prev) => new Set(prev).add(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null);
    const ids = [...selected];
    if (ids.length < 4) {
      setError("Select at least 4 players to start.");
      return;
    }
    const fd = new FormData();
    fd.set("court_count", String(courtCount));
    fd.set("pairing_mode", mode);
    fd.set("player_ids", JSON.stringify(ids));
    startTransition(async () => {
      const res = await startSession(fd);
      if (res?.error) setError(res.error);
      // success path redirects server-side
    });
  }

  return (
    <div
      className={
        step === 1
          ? "lg:flex lg:h-[calc(100dvh-1.5rem)] lg:flex-col lg:overflow-hidden"
          : undefined
      }
    >
      <PageHeader
        title={step === 1 ? "Start a session" : "Who's here today?"}
        subtitle={
          step === 1
            ? "Set your courts and how players pair up."
            : "Tap the players who showed up — pick at least 4 to start."
        }
      />

      <StepIndicator step={step} />

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -8 }}
            className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:items-stretch lg:overflow-hidden"
          >
            {/* Left column — controls + CTA (button pinned inside the card) */}
            <motion.div variants={popIn} className="flex h-full min-h-0 flex-col">
              <Card className="flex h-full min-h-0 flex-col gap-5 overflow-hidden p-6">
                <div>
                  <h2 className="mb-3 font-heading text-sm font-semibold text-ink/70">
                    How many courts?
                  </h2>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((n) => (
                      <Chip
                        key={n}
                        selected={courtCount === n}
                        onClick={() => setCourtCount(n)}
                      >
                        {n} court{n > 1 ? "s" : ""}
                      </Chip>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-ink/65">
                    4 players per court ·{" "}
                    <span className="font-semibold text-ink">
                      up to {courtCount * 4} players
                    </span>
                  </p>
                </div>

                <div className="border-t border-white/60 pt-5">
                  <h2 className="mb-3 font-heading text-sm font-semibold text-ink/70">
                    Pairing mode
                  </h2>
                  <div className="flex flex-col gap-3">
                    {(["balance", "king_of_the_court"] as PairingMode[]).map(
                      (m) => {
                        const Icon = MODE_ICON[m];
                        const isSel = mode === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            aria-pressed={isSel}
                            className={`flex items-start gap-3 rounded-glass border p-3 text-left transition-shadow ${
                              isSel
                                ? "border-primary/40 bg-gradient-to-r from-primary-from/10 to-primary-to/10 shadow-glow-primary"
                                : "border-white/70 bg-white/70 hover:bg-white/85"
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                isSel
                                  ? "bg-gradient-to-br from-primary-from to-primary-to text-white"
                                  : "bg-white/70 text-ink/60"
                              }`}
                              aria-hidden
                            >
                              <Icon size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="font-heading text-sm font-semibold text-ink">
                                {MODE_LABEL[m]}
                              </div>
                              <div className="mt-0.5 text-xs text-ink/70">
                                {MODE_BLURB[m]}
                              </div>
                            </div>
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                isSel ? "border-primary" : "border-ink/25"
                              }`}
                              aria-hidden
                            >
                              {isSel && (
                                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                              )}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <Button
                  size="lg"
                  fullWidth
                  onClick={() => setStep(2)}
                  className="mt-auto"
                >
                  Next · select players
                </Button>
              </Card>
            </motion.div>

            {/* Right column — live preview */}
            <motion.div variants={popIn} className="flex h-full min-h-0 flex-col">
              <SessionPreview courtCount={courtCount} mode={mode} />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            variants={popIn}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -8 }}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-6"
          >
            {/* Left — scrolling player list */}
            <div className="flex flex-col gap-6">
              {totalPlayers === 0 ? (
                <Card className="flex flex-col items-center gap-2 py-12 text-center">
                  <p className="font-heading text-base font-semibold text-ink">
                    No players yet
                  </p>
                  <p className="text-sm text-ink/70">
                    Add a walk-in to get this session started.
                  </p>
                </Card>
              ) : (
                grouped.map(({ cat, players: group }) => {
                  const selectedInGroup = group.filter((p) =>
                    selected.has(p.id)
                  ).length;
                  if (group.length === 0) return null;
                  const odd = group.length % 2 === 1;
                  return (
                    <section key={cat}>
                      <div className="mb-3 flex items-center justify-between px-1">
                        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold text-ink/70">
                          <span
                            className={`h-2 w-2 rounded-full ${CATEGORY_META[cat].bg}`}
                            aria-hidden
                          />
                          {CATEGORY_META[cat].label}
                        </h2>
                        <span className="rounded-full bg-white/60 px-2.5 py-0.5 text-xs text-ink/65">
                          <span className="font-semibold text-ink">
                            {selectedInGroup}
                          </span>{" "}
                          of {group.length} in
                        </span>
                      </div>
                      <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="grid auto-rows-fr gap-3 sm:grid-cols-2"
                      >
                        {group.map((p, i) => {
                          const lastOdd = odd && i === group.length - 1;
                          return (
                            <motion.div
                              key={p.id}
                              variants={popIn}
                              className={lastOdd ? "sm:col-span-2" : ""}
                            >
                              <PlayerCard
                                player={p}
                                selected={selected.has(p.id)}
                                onToggle={() => toggle(p.id)}
                              />
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    </section>
                  );
                })
              )}
            </div>

            {/* Right — full-height summary sidebar (stacks below on mobile) */}
            <div className="mt-6 lg:mt-0">
              <SessionSummaryPanel
                selectedPlayers={selectedPlayers}
                courtCount={courtCount}
                mode={mode}
                enough={enough}
                isPending={isPending}
                error={error}
                onAddWalkIn={addWalkIn}
                onBack={() => setStep(1)}
                onStart={submit}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
