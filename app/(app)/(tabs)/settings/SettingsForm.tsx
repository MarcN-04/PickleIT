"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Chip, Input, Button } from "@/components/ui";
import { updateSettings } from "@/lib/data/settingsActions";
import type { AppSettings, PairingMode } from "@/types/database";

/**
 * Admin-editable app defaults: default pairing mode + court count (pre-selected
 * at session creation) and category display labels.
 */
export function SettingsForm({ settings }: { settings: AppSettings }) {
  const router = useRouter();
  const [mode, setMode] = useState<PairingMode>(settings.default_pairing_mode);
  const [courts, setCourts] = useState(settings.default_court_count);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    formData.set("default_pairing_mode", mode);
    formData.set("default_court_count", String(courts));
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateSettings(formData);
      if ("error" in res) setError(res.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <Card className="p-5" animateIn>
      <h2 className="mb-3 font-heading text-sm font-bold text-ink">Defaults</h2>
      <form action={onSubmit} className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-ink/70">
            Default court count
          </p>
          <div className="flex gap-2">
            {[1, 2, 3].map((n) => (
              <Chip key={n} selected={courts === n} onClick={() => setCourts(n)}>
                {n}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-ink/70">
            Default pairing mode
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip
              selected={mode === "balance"}
              onClick={() => setMode("balance")}
            >
              Balance
            </Chip>
            <Chip
              selected={mode === "king_of_the_court"}
              onClick={() => setMode("king_of_the_court")}
              accentWhenSelected
            >
              King of the court
            </Chip>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-ink/70">
            Category labels (display only)
          </p>
          <Input name="label_beginner" defaultValue={settings.label_beginner} />
          <Input
            name="label_intermediate"
            defaultValue={settings.label_intermediate}
          />
          <Input name="label_pro" defaultValue={settings.label_pro} />
        </div>

        {error && (
          <p role="alert" className="rounded-2xl bg-red-50/80 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {saved && (
          <p className="rounded-2xl bg-cat-beginner px-3 py-2 text-sm text-cat-beginnerInk">
            Saved.
          </p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save defaults"}
        </Button>
      </form>
    </Card>
  );
}
