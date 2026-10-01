import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ListingCard } from "@/components/marketing/listing-card";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge, DemoDataBadge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/server";
import { renderCmsBody } from "@/modules/cms/render";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const agency = await db.agency.findUnique({ where: { slug }, select: { name: true, description: true, cmsPage: true } });
  if (!agency) return {};

  const cms = agency.cmsPage?.status === "PUBLISHED" ? agency.cmsPage : null;

  return {
    title: cms?.seoTitle || `${agency.name} — Real Estate Agency`,
    description:
      cms?.seoDescription ||
      agency.description?.slice(0, 160) ||
      `${agency.name} is a real estate agency on Qasro. Browse their active listings in the UAE.`,
    alternates: { canonical: cms?.canonicalUrl || `https://www.qasro.com/agencies/${slug}` },
  };
}

export default async function AgencyProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [agency, dict] = await Promise.all([
    db.agency.findUnique({
      where: { slug },
      include: {
        agents: { include: { user: true } },
        listings: {
          where: { status: "ACTIVE" },
          include: { property: { include: { area: true } }, agent: { include: { user: true } }, agency: true },
          take: 9,
        },
        cmsPage: true,
      },
    }),
    getDictionary(),
  ]);
  if (!agency) notFound();

  const cmsHtml = agency.cmsPage?.status === "PUBLISHED" ? renderCmsBody(agency.cmsPage.body) : null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink-950">{agency.name}</h1>
            {agency.isVerified && <Badge variant="success">{dict.property.verified}</Badge>}
            {agency.isDemoData && <DemoDataBadge label={dict.common.demoData} />}
          </div>
          {agency.description && <p className="mt-2 max-w-2xl text-sm text-sand-600">{agency.description}</p>}

          {cmsHtml && (
            <div
              className="mt-6 max-w-2xl space-y-4 text-sm leading-relaxed text-sand-700
                [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink-950
                [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink-950
                [&_a]:text-bronze-600 [&_a]:underline [&_a]:underline-offset-4
                [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:mt-1"
              dangerouslySetInnerHTML={{ __html: cmsHtml }}
            />
          )}

          <h2 className="mt-10 text-lg font-semibold text-ink-950">{dict.nav.agents}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agency.agents.map((agent) => (
              <Link key={agent.slug} href={`/agents/${agent.slug}`}>
                <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-950 text-sm font-semibold text-white">
                    {agent.user.name?.[0] ?? "A"}
                  </div>
                  <span className="text-sm font-medium text-ink-950">{agent.user.name}</span>
                </Card>
              </Link>
            ))}
          </div>

          <h2 className="mt-10 text-lg font-semibold capitalize text-ink-950">{dict.agencies.listingsLabel}</h2>
          {agency.listings.length === 0 ? (
            <p className="mt-4 text-sm text-sand-600">{dict.agents.noActiveListings}</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {agency.listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} dict={dict} />
              ))}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
