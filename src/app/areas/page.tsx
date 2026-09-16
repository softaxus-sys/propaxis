import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { DemoDataBadge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";
import { listAreas } from "@/modules/areas/queries";

export const metadata: Metadata = { title: "Areas" };

export default async function AreasPage() {
  const areas = await listAreas();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <h1 className="text-2xl font-semibold text-ink-950">Explore areas</h1>
          <p className="mt-1 text-sm text-sand-600">Price trends and inventory across Dubai&apos;s communities.</p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {areas.map((area) => (
              <Link key={area.slug} href={`/areas/${area.slug}`}>
                <Card className="p-4 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-ink-950">{area.name}</h3>
                    {area.latestMetric?.isDemoData && <DemoDataBadge />}
                  </div>
                  <p className="mt-3 text-xs text-sand-600">{area.listingCount.toLocaleString()} listings</p>
                  {area.latestMetric?.avgPricePerSqftAed && (
                    <p className="mt-1 text-sm font-semibold text-ink-950">
                      {formatAed(Number(area.latestMetric.avgPricePerSqftAed))}{" "}
                      <span className="font-normal text-sand-600">/ sqft</span>
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
