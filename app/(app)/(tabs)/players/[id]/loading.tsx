import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="pt-2">
      <div className="px-1 pb-4">
        <Skeleton className="h-8 w-44" />
      </div>
      <Skeleton className="mb-4 h-16 w-full" />
      <div className="mb-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
