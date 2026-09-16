import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { DemoDataBadge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";
import { listAreas } from "@/modules/areas/queries";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

export async function AreasGrid({ dict }: { dict: Dictionary }) {
  const areas = await listAreas();
  if (areas.length === 0) return null;

  return (
    <section className="bg-sand-50 py-16">
      <Container>
        <h2 className="text-2xl font-semibold text-ink-950">{dict.home.areasTitle}</h2>
        <p className="mt-1 text-sm text-sand-600">{dict.home.areasSubtitle}</p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {areas.slice(0, 6).map((area) => (
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
    </section>
  );
}
