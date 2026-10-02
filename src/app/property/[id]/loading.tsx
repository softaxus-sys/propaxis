import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <Skeleton className="h-80 w-full rounded-2xl sm:h-[28rem]" />

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <div>
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="mt-3 h-4 w-1/3" />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
