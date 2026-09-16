import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge, DemoDataBadge } from "@/components/ui/badge";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Developers" };

export default async function DevelopersPage() {
  const developers = await db.developer.findMany({
    include: { _count: { select: { projects: true, buildings: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <h1 className="text-2xl font-semibold text-ink-950">Developers</h1>
          <p className="mt-1 text-sm text-sand-600">Developers building across the UAE.</p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {developers.map((dev) => (
              <Link key={dev.slug} href={`/developers/${dev.slug}`}>
                <Card className="p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink-950">{dev.name}</h3>
                    {dev.isVerified && <Badge variant="success">Verified</Badge>}
                    {dev.isDemoData && <DemoDataBadge />}
                  </div>
                  <p className="mt-2 text-xs text-sand-500">
                    {dev._count.projects} projects · {dev._count.buildings} buildings
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
