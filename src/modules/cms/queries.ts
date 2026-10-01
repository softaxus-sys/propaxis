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
    },
  });
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
