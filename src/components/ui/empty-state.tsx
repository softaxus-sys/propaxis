import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared "nothing here yet" treatment — used wherever a list can legitimately be
 * empty (a new area with no listings, a search with no matches) so it reads as an
 * intentional, designed state rather than a blank space that looks broken. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-sand-300 bg-white px-6 py-16 text-center", className)}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sand-100 text-sand-500">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-4 text-base font-medium text-ink-950">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-sand-600">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
