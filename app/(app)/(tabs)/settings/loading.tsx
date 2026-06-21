import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="px-1 pb-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-ink lg:text-3xl">
          Settings
        </h1>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
