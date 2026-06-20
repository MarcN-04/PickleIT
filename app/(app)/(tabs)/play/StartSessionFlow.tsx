"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Chip, CategoryBadge } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { CATEGORIES, CATEGORY_META, type Category } from "@/lib/categories";
import { popIn } from "@/lib/motion";
import { startSession } from "@/lib/data/sessionActions";
import { AddWalkInDialog } from "./AddWalkInDialog";
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
    <div>
      <PageHeader
        title="Start a session"
        subtitle={step === 1 ? "Courts & pairing" : "Who's here today?"}
      />

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            variants={popIn}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto flex max-w-3xl flex-col gap-4"
          >
            <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <Card className="p-5">
              <h2 className="mb-3 font-heading text-sm font-semibold text-ink/70">
                Active courts
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
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 font-heading text-sm font-semibold text-ink/70">
                Pairing mode
              </h2>
              <div className="flex flex-col gap-3">
                {(["balance", "king_of_the_court"] as PairingMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`rounded-glass border p-3 text-left transition-shadow ${
                      mode === m
                        ? "border-primary/40 bg-gradient-to-r from-primary-from/10 to-primary-to/10 shadow-glow-primary"
                        : "border-white/70 bg-white/55 hover:bg-white/75"
                    }`}
                  >
                    <div className="font-heading text-sm font-semibold text-ink">
                      {MODE_LABEL[m]}
                    </div>
                    <div className="mt-0.5 text-xs text-ink/60">
                      {MODE_BLURB[m]}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
            </div>

            <Button fullWidth onClick={() => setStep(2)}>
              Next · select players
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            variants={popIn}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-ink/60">
                <span className="font-semibold text-ink">{selected.size}</span>{" "}
                selected
              </span>
              <AddWalkInDialog
                onAdded={(id) =>
                  setSelected((prev) => new Set(prev).add(id))
                }
              />
            </div>

            {grouped.map(({ cat, players: group }) => {
              const selectedInGroup = group.filter((p) =>
                selected.has(p.id)
              ).length;
              if (group.length === 0) return null;
              return (
                <section key={cat}>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <h2 className="font-heading text-sm font-semibold text-ink/70">
                      {CATEGORY_META[cat].label}
                    </h2>
                    <span className="text-xs text-ink/45">
                      {selectedInGroup} of {group.length}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.map((p) => {
                      const isSel = selected.has(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggle(p.id)}
                          className={`flex items-center justify-between gap-3 rounded-glass border px-4 py-3 text-left transition-shadow ${
                            isSel
                              ? "border-primary/40 bg-gradient-to-r from-primary-from/12 to-primary-to/12 shadow-glow-primary"
                              : "glass-inner border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                                isSel
                                  ? "border-primary bg-primary text-white"
                                  : "border-ink/25 text-transparent"
                              }`}
                              aria-hidden
                            >
                              ✓
                            </span>
                            <span className="font-medium text-ink">{p.name}</span>
                          </div>
                          <CategoryBadge category={p.category} size="sm" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {error && (
              <p
                role="alert"
                className="rounded-2xl bg-red-50/80 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div className="sticky bottom-24 z-10 flex gap-2 lg:bottom-4">
              <Button
                variant="glass"
                onClick={() => setStep(1)}
                disabled={isPending}
              >
                Back
              </Button>
              <Button
                fullWidth
                onClick={submit}
                disabled={isPending || selected.size < 4}
              >
                {isPending
                  ? "Starting…"
                  : `Start session · ${selected.size} player${
                      selected.size === 1 ? "" : "s"
                    }`}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
