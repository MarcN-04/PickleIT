"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Card, Input, Button, Chip } from "@/components/ui";
import { CATEGORIES, CATEGORY_META, type Category } from "@/lib/categories";
import type { PlayerFormResult } from "@/lib/data/playerActions";
import type { Player } from "@/types/database";

type Props = {
  action: (
    prev: PlayerFormResult | undefined,
    formData: FormData
  ) => Promise<PlayerFormResult>;
  player?: Player; // present when editing
  submitLabel?: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

/**
 * Add/edit player form. Shared by the "Add new player" and "Edit" routes.
 * On success, navigates back to the roster (or the player's profile when editing).
 */
export function PlayerForm({ action, player, submitLabel = "Save player" }: Props) {
  const router = useRouter();
  const [category, setCategory] = useState<Category>(
    player?.category ?? "beginner"
  );

  const [state, formAction] = useFormState<PlayerFormResult | undefined, FormData>(
    async (prev, formData) => {
      const result = await action(prev, formData);
      if (result?.ok) {
        router.push(player ? `/players/${result.playerId}` : "/players");
        router.refresh();
      }
      return result;
    },
    undefined
  );

  return (
    <Card className="p-5" animateIn>
      <form action={formAction} className="flex flex-col gap-4">
        {/* category is controlled via chips; mirror it into a hidden field */}
        <input type="hidden" name="category" value={category} />

        <Input
          label="Name"
          name="name"
          defaultValue={player?.name ?? ""}
          placeholder="Player name"
          required
          autoFocus={!player}
        />

        <Input
          label="Age (optional)"
          name="age"
          type="number"
          inputMode="numeric"
          min={0}
          max={120}
          defaultValue={player?.age ?? ""}
          placeholder="—"
        />

        <div className="flex flex-col gap-2">
          <span className="px-1 text-xs font-medium text-ink/70">Category</span>
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

        {state && !state.ok && (
          <p
            role="alert"
            className="rounded-2xl bg-red-50/80 px-3 py-2 text-sm text-red-700"
          >
            {state.error}
          </p>
        )}

        <SubmitButton label={submitLabel} />
      </form>
    </Card>
  );
}
