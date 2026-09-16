import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { DemoDataBadge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";
import { listAreas } from "@/modules/areas/queries";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Market Insights" };

export default async function InsightsPage() {
  const [areas, dict] = await Promise.all([listAreas(), getDictionary()]);
  const withMetrics = areas.filter((a) => a.latestMetric);
  const topYield = [...withMetrics].sort(
    (a, b) => Number(b.latestMetric?.grossRentalYieldPct ?? 0) - Number(a.latestMetric?.grossRentalYieldPct ?? 0),
  );

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <h1 className="text-2xl font-semibold text-ink-950">{dict.insights.pageTitle}</h1>
          <p className="mt-1 text-sm text-sand-600">{dict.insights.pageSubtitle}</p>

          {withMetrics.length === 0 ? (
            <div className="mt-16 rounded-2xl border border-dashed border-sand-300 bg-white py-16 text-center">
              <p className="text-sand-600">{dict.insights.noMetrics}</p>
            </div>
          ) : (
            <Card className="mt-8 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand-200 bg-sand-50 text-left text-sand-600">
                    <th className="px-4 py-3 font-medium">{dict.insights.areaCol}</th>
                    <th className="px-4 py-3 font-medium">{dict.insights.pricePerSqftCol}</th>
                    <th className="px-4 py-3 font-medium">{dict.insights.avgRentCol}</th>
                    <th className="px-4 py-3 font-medium">{dict.insights.yieldCol}</th>
                    <th className="px-4 py-3 font-medium">{dict.insights.trendCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {topYield.map((area) => {
                    const m = area.latestMetric!;
                    const up = Number(m.priceChangePct ?? 0) >= 0;
                    return (
                      <tr key={area.slug} className="border-b border-sand-100 last:border-0">
                        <td className="px-4 py-3">
                          <Link href={`/areas/${area.slug}`} className="font-medium text-ink-950 hover:text-bronze-500">
                            {area.name}
                          </Link>
                          {m.isDemoData && <DemoDataBadge label={dict.common.demoData} className="ms-2" />}
                        </td>
                        <td className="px-4 py-3 text-sand-700">
                          {m.avgPricePerSqftAed ? formatAed(Number(m.avgPricePerSqftAed)) : "—"}
                        </td>
                        <td className="px-4 py-3 text-sand-700">
                          {m.avgAnnualRentAed ? formatAed(Number(m.avgAnnualRentAed), { compact: true }) : "—"}
                        </td>
                        <td className="px-4 py-3 font-medium text-success">
                          {m.grossRentalYieldPct ? `${Number(m.grossRentalYieldPct)}%` : "—"}
                        </td>
                        <td className={`px-4 py-3 ${up ? "text-success" : "text-danger"}`}>
                          <span className="flex items-center gap-1">
                            {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {m.priceChangePct ? `${Number(m.priceChangePct)}%` : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
