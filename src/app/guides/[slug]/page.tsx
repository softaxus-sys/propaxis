import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { getPublishedPageBySlug } from "@/modules/cms/queries";
import { renderCmsBody, plainTextExcerpt } from "@/modules/cms/render";

const SITE_URL = "https://www.qasro.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug, "ARTICLE");
  if (!page) return {};

  const title = page.seoTitle || page.title;
  const description = page.seoDescription || page.excerpt || plainTextExcerpt(page.body);
  const canonical = page.canonicalUrl || `${SITE_URL}/guides/${page.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: page.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: page.ogTitle || title,
      description: page.ogDescription || description,
      url: canonical,
      type: "article",
      images: page.ogImageUrl ? [page.ogImageUrl] : undefined,
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug, "ARTICLE");
  if (!page) notFound();

  const html = renderCmsBody(page.body);
  const canonical = page.canonicalUrl || `https://www.qasro.com/guides/${page.slug}`;

  // Article structured data — only fields backed by real content (no invented
  // ratings/reviews/author credentials, per docs/seo-architecture.md §E).
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.seoDescription || page.excerpt || undefined,
    datePublished: page.publishedAt?.toISOString(),
    dateModified: page.updatedAt.toISOString(),
    mainEntityOfPage: canonical,
    publisher: { "@type": "Organization", name: "Qasro.com" },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.qasro.com/" },
      { "@type": "ListItem", position: 2, name: "Guides", item: "https://www.qasro.com/guides" },
      { "@type": "ListItem", position: 3, name: page.title, item: canonical },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-16">
        <Container className="max-w-2xl">
          <nav className="flex gap-2 text-sm text-sand-600">
            <Link href="/" className="hover:text-ink-950">
              Home
            </Link>
            <span>/</span>
            <Link href="/guides" className="hover:text-ink-950">
              Guides
            </Link>
          </nav>

          <h1 className="mt-4 text-2xl font-semibold text-ink-950">{page.title}</h1>
          {page.excerpt && <p className="mt-2 text-sm text-sand-600">{page.excerpt}</p>}
          <p className="mt-2 text-xs text-sand-500">
            Updated {page.updatedAt.toLocaleDateString("en-AE", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div
            className="mt-8 space-y-4 text-sm leading-relaxed text-sand-700
              [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink-950
              [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink-950
              [&_p]:leading-relaxed [&_a]:text-bronze-600 [&_a]:underline [&_a]:underline-offset-4
              [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:mt-1
              [&_blockquote]:border-s-2 [&_blockquote]:border-bronze-300 [&_blockquote]:ps-4 [&_blockquote]:italic
              [&_img]:rounded-xl [&_table]:w-full [&_th]:text-start [&_th]:text-ink-950"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </Container>
      </main>
      <SiteFooter />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    </>
  );
}
