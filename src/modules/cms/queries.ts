import { db } from "@/lib/db";
import type { CmsPageStatus, CmsPageType } from "@prisma/client";

/** Public read path — only ever returns a page that's actually live. Scheduled,
 * draft, in-review, approved-but-unpublished, and archived pages are all excluded by
 * design, not just by convention at the call site. */
export async function getPublishedPageBySlug(slug: string, type?: CmsPageType) {
  return db.cmsPage.findFirst({
    where: { slug, status: "PUBLISHED", ...(type ? { type } : {}) },
  });
}

export async function listCmsPages(filters: {
  status?: CmsPageStatus;
  type?: CmsPageType;
  authorId?: string;
  search?: string;
}) {
  return db.cmsPage.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.authorId ? { authorId: filters.authorId } : {}),
      ...(filters.search
        ? { OR: [{ title: { contains: filters.search, mode: "insensitive" } }, { slug: { contains: filters.search, mode: "insensitive" } }] }
        : {}),
    },
    include: { author: { select: { name: true } }, reviewer: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCmsPageById(id: string) {
  return db.cmsPage.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true } },
      revisions: { orderBy: { createdAt: "desc" }, include: { savedBy: { select: { name: true } } } },
      // Whichever entity (if any) currently links to this page — only one of these
      // will ever be non-null, matching the page's own `type`.
      area: { select: { id: true } },
      agency: { select: { id: true } },
      agent: { select: { id: true } },
      developer: { select: { id: true } },
      project: { select: { id: true } },
    },
  });
}

/** For the entity pickers (COMMUNITY/AGENCY_PROFILE/AGENT_PROFILE/DEVELOPER_PROFILE/
 * PROJECT) in the CMS editor — see docs/cms-specification.md §C. */
export async function listAreasForLinking() {
  return db.area.findMany({ select: { id: true, name: true, city: true }, orderBy: { name: "asc" } });
}
export async function listAgenciesForLinking() {
  return db.agency.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}
export async function listAgentsForLinking() {
  return db.agent.findMany({ select: { id: true, user: { select: { name: true } } }, orderBy: { user: { name: "asc" } } });
}
export async function listDevelopersForLinking() {
  return db.developer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}
export async function listProjectsForLinking() {
  return db.project.findMany({ select: { id: true, name: true, developer: { select: { name: true } } }, orderBy: { name: "asc" } });
}

/** All five entity picker lists at once, pre-shaped for CmsPageForm's
 * `entityOptionsByType` prop — the one call both admin content routes need. */
export async function listEntityOptionsByType() {
  const [areas, agencies, agents, developers, projects] = await Promise.all([
    listAreasForLinking(),
    listAgenciesForLinking(),
    listAgentsForLinking(),
    listDevelopersForLinking(),
    listProjectsForLinking(),
  ]);

  return {
    COMMUNITY: areas.map((a) => ({ id: a.id, label: `${a.name}, ${a.city}` })),
    AGENCY_PROFILE: agencies.map((a) => ({ id: a.id, label: a.name })),
    AGENT_PROFILE: agents.map((a) => ({ id: a.id, label: a.user.name ?? "(unnamed agent)" })),
    DEVELOPER_PROFILE: developers.map((d) => ({ id: d.id, label: d.name })),
    PROJECT: projects.map((p) => ({ id: p.id, label: `${p.name} — ${p.developer.name}` })),
  };
}

export async function cmsDashboardCounts() {
  const [draft, inReview, scheduled, published] = await Promise.all([
    db.cmsPage.count({ where: { status: "DRAFT" } }),
    db.cmsPage.count({ where: { status: "IN_REVIEW" } }),
    db.cmsPage.count({ where: { status: "SCHEDULED" } }),
    db.cmsPage.count({ where: { status: "PUBLISHED" } }),
  ]);
  return { draft, inReview, scheduled, published };
}

export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await db.cmsPage.findUnique({ where: { slug }, select: { id: true } });
  return !existing || existing.id === excludeId;
}

/** Looks up a recorded redirect for an exact path (e.g. "/guides/old-slug") — see
 * docs/seo-architecture.md §6. Call this before returning notFound() on any route
 * whose path could have been recorded in the Redirect table. */
export async function getRedirectFor(path: string) {
  return db.redirect.findUnique({ where: { fromPath: path } });
}
