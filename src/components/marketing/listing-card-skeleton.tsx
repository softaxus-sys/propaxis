import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors ListingCard's actual layout (h-44 photo + title/area/specs) so the
 * loading state doesn't visually jump once real cards swap in. */
export function ListingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </Card>
  );
}
