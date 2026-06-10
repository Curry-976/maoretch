import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-foreground/5",
        className,
      )}
      aria-hidden
      {...props}
    >
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.06) 50%, transparent)",
          animation: "skeleton-shimmer 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        }}
      />
    </div>
  );
}

function SkeletonRows({
  count = 3,
  rowHeight = "h-20",
}: {
  count?: number;
  rowHeight?: string;
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`w-full ${rowHeight}`} />
      ))}
    </div>
  );
}

function SkeletonGrid({
  count = 6,
  cols = "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
}: {
  count?: number;
  cols?: string;
}) {
  return (
    <div className={`grid ${cols} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-44" />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonRows, SkeletonGrid };
