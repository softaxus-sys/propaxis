import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge, DemoDataBadge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Agencies" };

export default async function AgenciesPage() {
  const [agencies, dict] = await Promise.all([
    db.agency.findMany({
      include: { _count: { select: { agents: true, listings: true } } },
      orderBy: { name: "asc" },
    }),
    getDictionary(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <h1 className="text-2xl font-semibold text-ink-950">{dict.agencies.pageTitle}</h1>
          <p className="mt-1 text-sm text-sand-600">{dict.agencies.pageSubtitle}</p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agencies.map((agency) => (
              <Link key={agency.slug} href={`/agencies/${agency.slug}`}>
                <Card className="p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink-950">{agency.name}</h3>
                    {agency.isVerified && <Badge variant="success">{dict.property.verified}</Badge>}
                    {agency.isDemoData && <DemoDataBadge label={dict.common.demoData} />}
                  </div>
                  <p className="mt-2 text-xs text-sand-500">
                    {agency._count.agents} {dict.agencies.agentsLabel} · {agency._count.listings}{" "}
                    {dict.agencies.listingsLabel}
                  </p>
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
