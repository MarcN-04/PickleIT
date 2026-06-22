/**
 * Player skill categories — the single source of truth shared by badges,
 * forms, the roster grouping, and (later) the rotation engine's skill weights.
 */
export type Category = "beginner" | "intermediate" | "pro";

export const CATEGORIES: Category[] = ["beginner", "intermediate", "pro"];

/** Base skill weight used by the rotation engine (Beginner 1 / Inter 2 / Pro 3). */
export const SKILL_WEIGHT: Record<Category, number> = {
  beginner: 1,
  intermediate: 2,
  pro: 3,
};

/**
 * Display + styling config per category. Tints are soft and calm, with
 * readable dark text — class names map to tokens in tailwind.config.ts.
 */
export const CATEGORY_META: Record<
  Category,
  { label: string; bg: string; text: string; dot: string; order: number }
> = {
  beginner: {
    label: "Beginner",
    bg: "bg-cat-beginner",
    text: "text-cat-beginnerInk",
    // Solid, legible dot (the darker "ink" tone) for label-less tier markers.
    dot: "bg-cat-beginnerInk",
    order: 0,
  },
  intermediate: {
    label: "Intermediate",
    bg: "bg-cat-intermediate",
    text: "text-cat-intermediateInk",
    dot: "bg-cat-intermediateInk",
    order: 1,
  },
  pro: {
    label: "Pro",
    bg: "bg-cat-pro",
    text: "text-cat-proInk",
    dot: "bg-cat-proInk",
    order: 2,
  },
};
