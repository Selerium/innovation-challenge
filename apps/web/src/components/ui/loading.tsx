"use client";

import type { ReactNode } from "react";
import { Loader2Icon, InboxIcon, AlertTriangleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Full-page / top-level loading spinner
export function PageLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2Icon className="size-6 animate-spin" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

// Compact inline spinner for sections
export function InlineLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
      <Loader2Icon className="size-4 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

// Pulsing placeholder block (use for skeletons)
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

// Card-shaped skeleton for lists / dashboard grids
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-secondary p-5", className)}>
      <Skeleton className="mb-3 h-4 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/2" />
    </div>
  );
}

// Skeleton row for tables/lists
export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-border bg-secondary p-12 text-center", className)}>
      {icon ?? <InboxIcon className="mb-3 size-8 text-muted-foreground" />}
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong while loading this page.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center", className)}>
      <AlertTriangleIcon className="mb-3 size-8 text-destructive" />
      <p className="font-medium text-foreground">Unable to load</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Try again
        </button>
      )}
    </div>
  );
}
