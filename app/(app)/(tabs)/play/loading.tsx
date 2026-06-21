import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="pt-2">
      <div className="px-1 pb-4">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-ink lg:text-3xl">
          Play
        </h1>
        <Skeleton className="mt-2 h-4 w-32" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
      <Skeleton className="mt-4 h-12 w-full rounded-full" />
    </div>
  );
}
