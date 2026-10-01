import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Guides",
  description: "Buying, selling, renting and investing guides for the UAE property market, from Qasro.",
};

export default async function GuidesIndexPage() {
  const guides = await db.cmsPage.findMany({
    where: { type: "ARTICLE", status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, title: true, excerpt: true, publishedAt: true, ogImageUrl: true },
  });

  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-16">
        <Container className="max-w-3xl">
          <h1 className="text-2xl font-semibold text-ink-950">Guides</h1>
          <p className="mt-2 text-sm text-sand-600">
            Buying, selling, renting and investing in UAE real estate — grounded, practical guides.
          </p>

          {guides.length === 0 ? (
            <p className="mt-10 text-sm text-sand-500">No guides published yet.</p>
          ) : (
            <div className="mt-8 space-y-4">
              {guides.map((g) => (
                <Link key={g.slug} href={`/guides/${g.slug}`}>
                  <Card className="flex gap-4 p-5 hover:shadow-md">
                    {g.ogImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- external, user-uploaded image (Contabo)
                      <img
                        src={g.ogImageUrl}
                        alt=""
                        className="h-20 w-28 shrink-0 rounded-lg object-cover sm:h-24 sm:w-36"
                      />
                    )}
                    <div>
                      <h2 className="font-semibold text-ink-950">{g.title}</h2>
                      {g.excerpt && <p className="mt-1 text-sm text-sand-600">{g.excerpt}</p>}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
