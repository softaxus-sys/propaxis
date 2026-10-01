import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE_URL = "https://www.qasro.com";

// Without this, Next treats this as fully static (built once at deploy time) since it
// has no per-request APIs — a new listing or CMS page wouldn't appear in the sitemap
// until the next deploy. Hourly ISR is a reasonable balance against hitting the DB on
// every crawler request.
export const revalidate = 3600;

/**
 * Single dynamic sitemap — fine at current URL volume. Next's sitemap.ts caps out
 * around 50,000 URLs per file; once this gets anywhere near that (see
 * docs/seo-architecture.md), switch to generateSitemaps() for a proper sitemap index
 * rather than letting this file silently truncate.
 *
 * Only ever includes what's actually indexable: ACTIVE listings, verified
 * agents/agencies, and published+non-noindex CMS guides — never drafts, admin/dashboard
 * routes, or withdrawn listings. lastmod only set where it reflects a real content
 * update (updatedAt), never fabricated.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/buy`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/rent`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/commercial`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/new-projects`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/agents`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/agencies`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/developers`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/areas`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/insights`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/valuation`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/investment-calculator`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/for-professionals`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/list-your-property`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/vrodux`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/guides`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.1 },
  ];

  // Sequential, not Promise.all: seven concurrent connections intermittently exceeded
  // Neon's pooler limit during build-time static generation (observed directly —
  // failures moved to a different model each retry, the signature of a connection-
  // count race, not a real outage). This route isn't latency-sensitive (hourly ISR,
  // never blocks a user request), so there's no cost to being sequential here.
  const listings = await db.listing.findMany({ where: { status: "ACTIVE" }, select: { id: true, updatedAt: true } });
  const agents = await db.agent.findMany({ where: { isVerified: true }, select: { slug: true, updatedAt: true } });
  const agencies = await db.agency.findMany({ where: { isVerified: true }, select: { slug: true, updatedAt: true } });
  const developers = await db.developer.findMany({ select: { slug: true, updatedAt: true } });
  const areas = await db.area.findMany({ select: { slug: true, updatedAt: true } });
  const projects = await db.project.findMany({ select: { slug: true, updatedAt: true } });
  const guides = await db.cmsPage.findMany({
    where: { type: "ARTICLE", status: "PUBLISHED", noindex: false },
    select: { slug: true, updatedAt: true },
  });

  return [
    ...staticPages,
    ...listings.map((l) => ({ url: `${SITE_URL}/property/${l.id}`, lastModified: l.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...agents.map((a) => ({ url: `${SITE_URL}/agents/${a.slug}`, lastModified: a.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...agencies.map((a) => ({ url: `${SITE_URL}/agencies/${a.slug}`, lastModified: a.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...developers.map((d) => ({ url: `${SITE_URL}/developers/${d.slug}`, lastModified: d.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...areas.map((a) => ({ url: `${SITE_URL}/areas/${a.slug}`, lastModified: a.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...projects.map((p) => ({ url: `${SITE_URL}/new-projects/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...guides.map((g) => ({ url: `${SITE_URL}/guides/${g.slug}`, lastModified: g.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
