"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Input, Button, Chip } from "@/components/ui";
import { CATEGORIES, CATEGORY_META, type Category } from "@/lib/categories";
import { createPlayer } from "@/lib/data/playerActions";

/**
 * Inline "Add new player" for walk-ins during selection. Creates the player in
 * the roster (so they persist for future sessions) and reports the new id so
 * the caller can auto-select them into today's session.
 */
export function AddWalkInDialog({ onAdded }: { onAdded: (id: string) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [category, setCategory] = useState<Category>("beginner");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setAge("");
    setCategory("beginner");
    setError(null);
  }

  function save() {
    setError(null);
    if (!name.trim()) {
      setError("Enter a name.");
      return;
    }
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("age", age);
    fd.set("category", category);
    startTransition(async () => {
      const res = await createPlayer(undefined, fd);
      if (res.ok) {
        onAdded(res.playerId);
        router.refresh(); // pull the new player into the roster lists
        setOpen(false);
        reset();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <Button variant="glass" size="sm" onClick={() => setOpen(true)}>
        + Walk-in
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/20 p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isPending && setOpen(false)}
          >
            <motion.div
              className="glass w-full max-w-md rounded-glass-lg p-5"
              initial={{ y: 24, scale: 0.97, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 24, scale: 0.97, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 font-heading text-lg font-bold text-ink">
                Add walk-in player
              </h2>
              <div className="flex flex-col gap-3">
                <Input
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Player name"
                  autoFocus
                />
                <Input
                  label="Age (optional)"
                  type="number"
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="—"
                />
                <div className="flex flex-col gap-2">
                  <span className="px-1 text-xs font-medium text-ink/70">
                    Category
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <Chip
                        key={c}
                        selected={category === c}
                        onClick={() => setCategory(c)}
                      >
                        {CATEGORY_META[c].label}
                      </Chip>
                    ))}
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-2xl bg-red-50/80 px-3 py-2 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}

                <div className="mt-1 flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button fullWidth onClick={save} disabled={isPending}>
                    {isPending ? "Adding…" : "Add & select"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
