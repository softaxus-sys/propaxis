import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ListingCardSkeleton } from "@/components/marketing/listing-card-skeleton";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-80" />

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>

          <Skeleton className="mt-10 h-5 w-56" />
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
