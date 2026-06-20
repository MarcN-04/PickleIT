import { cn } from "@/lib/cn";
import { CATEGORY_META, type Category } from "@/lib/categories";

type CategoryBadgeProps = {
  category: Category;
  size?: "sm" | "md";
  className?: string;
};

/**
 * Soft, distinct category tint with readable dark text.
 * Beginner = soft green, Intermediate = warm amber, Pro = deep emerald/teal.
 */
export function CategoryBadge({
  category,
  size = "md",
  className,
}: CategoryBadgeProps) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        meta.bg,
        meta.text,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
