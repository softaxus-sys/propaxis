import { cn } from "@/lib/utils";

/** Pulsing placeholder block — the building piece for route-level loading.tsx
 * skeletons. Sits on the sand palette so it reads as "loading," not as an error. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-sand-200", className)} />;
}
