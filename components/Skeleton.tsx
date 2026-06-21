import { cn } from "@/lib/cn";

/** A single shimmering placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-glass bg-white/70",
        className
      )}
      aria-hidden="true"
    />
  );
}

/**
 * Generic tab loading skeleton — a title placeholder plus a few glass rows.
 * Rendered instantly by each tab's loading.tsx while the server streams data,
 * so navigation paints immediately instead of blocking on Supabase.
 */
export function TabSkeleton({
  title,
  rows = 6,
}: {
  title?: string;
  rows?: number;
}) {
  return (
    <div className="pt-2">
      <div className="px-1 pb-4">
        {title ? (
          <h1 className="font-heading text-2xl font-bold tracking-tight text-ink lg:text-3xl">
            {title}
          </h1>
        ) : (
          <Skeleton className="h-8 w-40" />
        )}
        <Skeleton className="mt-2 h-4 w-28" />
      </div>

      <Skeleton className="mb-4 h-11 w-full max-w-sm rounded-full" />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-[58px] w-full" />
        ))}
      </div>
    </div>
  );
}
