"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Panel,
  Card,
  Button,
  Chip,
  Toggle,
  CategoryBadge,
  Input,
} from "@/components/ui";
import { CATEGORIES } from "@/lib/categories";
import { popIn, staggerContainer } from "@/lib/motion";

/**
 * /style — design-system reference page.
 * A living catalog of every primitive + motion preset. Used during development
 * to keep the bespoke glassmorphism look consistent. Not part of the user flow.
 */
export default function StyleGuide() {
  const [court, setCourt] = useState(2);
  const [mode, setMode] = useState<"balance" | "king">("balance");
  const [realtime, setRealtime] = useState(true);

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <header className="mb-8">
        <p className="font-heading text-xs uppercase tracking-widest text-ink/40">
          PickleIT
        </p>
        <h1 className="font-heading text-3xl font-bold text-ink">
          Design system
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Glassmorphism primitives, color tokens, and motion presets.
        </p>
      </header>

      {/* Color tokens */}
      <Section title="Color tokens">
        <div className="flex flex-wrap gap-3">
          <Swatch
            label="Primary"
            sub="#149655 → #0e7a44"
            className="bg-gradient-to-br from-primary-from to-primary-to text-white"
          />
          <Swatch
            label="Accent"
            sub="#c4e637 → #9bc416"
            className="bg-gradient-to-br from-accent-from to-accent-to text-ink"
          />
          <Swatch label="Ink" sub="#14291d" className="bg-ink text-white" />
        </div>
      </Section>

      {/* Glass surfaces */}
      <Section title="Glass surfaces">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card animateIn>
            <h3 className="font-heading font-semibold">Card (20px)</h3>
            <p className="mt-1 text-sm text-ink/60">
              Frosted translucent surface with inner top highlight.
            </p>
          </Card>
          <Panel size="lg" animateIn className="p-5">
            <h3 className="font-heading font-semibold">Panel · lg (28px)</h3>
            <p className="mt-1 text-sm text-ink/60">For hero / dense panels.</p>
            <div className="glass-inner mt-3 p-3 text-sm">
              <span className="font-medium text-ink">
                Inner surface (denser)
              </span>{" "}
              <span className="text-ink/60">— used for dashboard rows.</span>
            </div>
          </Panel>
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons (pill)">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="accent">Accent (win)</Button>
          <Button variant="glass">Glass</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      {/* Chips & selection */}
      <Section title="Chips & selection">
        <div className="mb-3 flex flex-wrap gap-2">
          {[1, 2, 3].map((n) => (
            <Chip key={n} selected={court === n} onClick={() => setCourt(n)}>
              {n} court{n > 1 ? "s" : ""}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip selected={mode === "balance"} onClick={() => setMode("balance")}>
            Balance
          </Chip>
          <Chip
            selected={mode === "king"}
            onClick={() => setMode("king")}
            accentWhenSelected
          >
            King of the court
          </Chip>
        </div>
      </Section>

      {/* Toggle */}
      <Section title="Toggle">
        <Toggle
          checked={realtime}
          onChange={setRealtime}
          label={`Realtime sync ${realtime ? "on" : "off"}`}
        />
      </Section>

      {/* Category badges */}
      <Section title="Category badges">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <CategoryBadge key={c} category={c} />
          ))}
        </div>
      </Section>

      {/* Inputs */}
      <Section title="Inputs">
        <div className="grid max-w-sm gap-3">
          <Input label="Player name" name="name" placeholder="e.g. Jordan" />
          <Input label="Age" name="age" type="number" placeholder="Optional" />
        </div>
      </Section>

      {/* Motion */}
      <Section title="Motion · staggered pop-in">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap gap-2"
        >
          {["Pop", "in", "with", "overshoot", "easing"].map((w) => (
            <motion.span
              key={w}
              variants={popIn}
              className="rounded-full bg-white/70 px-3 py-1.5 text-sm font-medium text-ink"
            >
              {w}
            </motion.span>
          ))}
        </motion.div>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-9">
      <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-ink/50">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({
  label,
  sub,
  className,
}: {
  label: string;
  sub: string;
  className: string;
}) {
  return (
    <div
      className={`flex min-w-[120px] flex-col rounded-glass px-4 py-3 shadow-glass ${className}`}
    >
      <span className="font-heading text-sm font-semibold">{label}</span>
      <span className="text-[11px] opacity-80">{sub}</span>
    </div>
  );
}
