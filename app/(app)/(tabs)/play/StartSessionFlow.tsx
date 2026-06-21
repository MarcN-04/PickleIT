"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CATEGORIES, CATEGORY_META, type Category } from "@/lib/categories";
import { popIn, staggerContainer, springSnappy, springOvershoot } from "@/lib/motion";
import { startSession } from "@/lib/data/sessionActions";
import {
  ScaleIcon,
  CrownIcon,
  CheckIcon,
  PlayIcon,
  PlayersIcon,
} from "@/components/icons";
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

/**
 * Bold two-step progress rail. Each step is a pill (number/check badge + label);
 * the connector between them is a thick track that fills emerald as you advance
 * (animated via a layoutId pill, matching the SideNav active-indicator). The
 * ACTIVE node gets a subtle emerald pulse to draw the eye. Step 1 becomes a real
 * button once done, so you can jump back. Lime stays reserved — emerald only.
 */
function StepIndicator({
  step,
  onStepClick,
}: {
  step: 1 | 2;
  onStepClick?: (n: 1) => void;
}) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Setup progress">
      {STEPS.map(({ n, label }, i) => {
        const active = n === step;
        const done = n < step;
        const complete = active || done;

        const inner = (
          <>
            <span
              className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                complete
                  ? "bg-gradient-to-br from-primary-from to-primary-to text-white shadow-glow-primary"
                  : "bg-white text-ink/70 shadow-[inset_0_0_0_1.5px_rgba(20,41,29,0.18)]"
              }`}
            >
              {/* Subtle pulse on the active node only (reduced-motion safe — it
                  only animates scale/opacity, which framer pauses on reduce). */}
              {active && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-primary/40"
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.65 }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              )}
              <AnimatePresence mode="wait" initial={false}>
                {done ? (
                  <motion.span
                    key="check"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={springSnappy}
                    className="relative flex"
                  >
                    <CheckIcon size={16} strokeWidth={2.5} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="num"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={springSnappy}
                    className="relative"
                  >
                    {n}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <span
              className={`font-heading text-xs leading-none sm:text-sm ${
                active
                  ? "font-bold text-ink"
                  : done
                    ? "font-semibold text-ink/80"
                    : "font-medium text-ink/70"
              }`}
            >
              {label}
            </span>
          </>
        );

        const pillBase =
          "relative z-0 flex items-center gap-2 rounded-full px-2.5 py-1.5 sm:px-3";

        return (
          <li
            key={n}
            aria-current={active ? "step" : undefined}
            className="flex items-center gap-2 sm:gap-3"
          >
            {done && onStepClick ? (
              <button
                type="button"
                onClick={() => onStepClick(1)}
                aria-label={`Go back to step ${n}: ${label}`}
                className={`${pillBase} bg-white/70 transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
              >
                {inner}
              </button>
            ) : (
              <span className={pillBase}>
                {active && (
                  <motion.span
                    layoutId="step-active-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary-from/12 to-primary-to/12 shadow-[inset_0_0_0_1px_rgba(20,150,85,0.25)]"
                    transition={{ type: "spring", stiffness: 500, damping: 34 }}
                  />
                )}
                {inner}
              </span>
            )}

            {/* Thick filling connector — emerald pill grows over the track.
                Visible on mobile too (narrower), so progress always shows. */}
            {i < STEPS.length - 1 && (
              <span
                className="relative h-1.5 w-8 shrink-0 overflow-hidden rounded-full bg-ink/15 sm:w-16"
                aria-hidden
              >
                {done && (
                  <motion.span
                    layoutId="step-connector-fill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-from to-primary-to"
                    transition={{ type: "spring", stiffness: 500, damping: 34 }}
                  />
                )}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Setup-flow header as a single-row context bar: an emerald icon chip + punchy
 * title/subtitle on the left, with the bold progress rail (+ "Step N of 2"
 * micro-label) aligned on the same row to the right. Wraps gracefully on
 * narrow mobile.
 */
function SetupHeader({
  title,
  subtitle,
  Icon,
  step,
  onStepClick,
}: {
  title: string;
  subtitle: string;
  Icon: (props: { size?: number }) => JSX.Element;
  step: 1 | 2;
  onStepClick?: (n: 1) => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 px-1 pb-4 pt-2 lg:justify-between">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-glass bg-gradient-to-br from-primary-from to-primary-to text-white shadow-glow-primary"
          aria-hidden
        >
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold leading-tight tracking-tight text-ink lg:text-3xl">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-ink/70">{subtitle}</p>
        </div>
      </div>
      <StepIndicator step={step} onStepClick={onStepClick} />
    </header>
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
    <div className="lg:flex lg:h-[calc(100dvh-1.5rem)] lg:flex-col lg:overflow-hidden">
      {/* Step 1 keeps the shared header/steps at the top of the band. Step 2
          moves them inside its left column so the summary panel spans the full
          band height (top + bottom flush with the SideNav). */}
      {step === 1 && (
        <SetupHeader
          title="Set up the session"
          subtitle="Pick your courts and how players pair up."
          Icon={PlayIcon}
          step={1}
        />
      )}

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
                          <motion.button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            aria-pressed={isSel}
                            whileTap={{ scale: 0.98, transition: springSnappy }}
                            className={cn(
                              "group relative flex items-start gap-3 rounded-glass border bg-white/90 p-4 text-left transition-all",
                              isSel
                                ? "border-primary bg-white shadow-glow-primary ring-1 ring-primary/30"
                                : "border-white/80 hover:border-primary/30 hover:shadow-glass"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                                isSel
                                  ? "bg-gradient-to-br from-primary-from to-primary-to text-white"
                                  : "bg-ink/5 text-ink/55"
                              )}
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
                            <motion.span
                              animate={{ scale: isSel ? 1 : 0.9 }}
                              transition={springOvershoot}
                              className={cn(
                                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-colors",
                                isSel
                                  ? "border-primary bg-primary text-white"
                                  : "border-ink/20 text-transparent group-hover:border-primary/40"
                              )}
                              aria-hidden
                            >
                              ✓
                            </motion.span>
                          </motion.button>
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
            className="lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-stretch lg:gap-6 lg:overflow-hidden"
          >
            {/* Left — header + steps pinned at top, then the scrolling list. */}
            <div className="flex flex-col lg:h-full lg:min-h-0 lg:overflow-hidden">
              <SetupHeader
                title="Who's playing?"
                subtitle="Tap everyone who showed up — at least 4 to start."
                Icon={PlayersIcon}
                step={2}
                onStepClick={() => setStep(1)}
              />

              {/* The only scroll region within the fixed band. */}
              <div className="no-scrollbar flex flex-col gap-6 pb-20 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-1">
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
                        className="grid gap-3 sm:grid-cols-2"
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
            </div>

            {/* Right — desktop full-height sidebar (flush with SideNav); on
                mobile the panel renders its own sticky action bar, so no margin. */}
            <div className="lg:h-full lg:min-h-0">
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
