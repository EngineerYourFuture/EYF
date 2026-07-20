import { type HTMLAttributes } from "react";
import { cn } from "./cn";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Skeleton placeholder — spec bans spinners; use these while data loads. */
export function Skeleton({ className, ...props }: Readonly<SkeletonProps>) {
  return (
    <div
      className={cn("shimmer rounded-md bg-surface-3/70", className)}
      {...props}
    />
  );
}

/** A few stacked skeleton lines, for list/card loading. */
export function SkeletonText({ lines = 3, className }: Readonly<{ lines?: number; className?: string }>) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

/** A grid of skeleton cards. */
export function SkeletonCards({ count = 6, className }: Readonly<{ count?: number; className?: string }>) {
  return (
    <div className={cn("grid md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-6">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-3" />
          <Skeleton className="h-4 w-2/3 mt-2" />
          <Skeleton className="h-8 w-24 mt-5 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton table rows. */
export function SkeletonRows({ rows = 6, className }: Readonly<{ rows?: number; className?: string }>) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 bg-surface border border-border rounded-lg p-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
