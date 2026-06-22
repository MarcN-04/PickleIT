import { cn } from "@/lib/cn";
import { CATEGORY_META, type Category } from "@/lib/categories";

/**
 * A small solid colored dot marking a player's skill tier — the label-less
 * counterpart to CategoryBadge. Decoded by the legend under the page header.
 */
export function TierDot({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={CATEGORY_META[category].label}
      title={CATEGORY_META[category].label}
      className={cn(
        "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
        CATEGORY_META[category].dot,
        className
      )}
    />
  );
}
