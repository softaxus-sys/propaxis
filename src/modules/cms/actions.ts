"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { isSlugAvailable } from "./queries";
import { uploadImage, StorageNotConfiguredError, InvalidImageError } from "@/lib/storage";

async function requireAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Not authorized.");
  return session.user;
}

/** Called directly from the editor's image-upload button (not a full form submit —
 * see src/components/admin/image-url-field.tsx), so it returns a result object rather
 * than throwing, matching the shape that client code is checking. */
export async function uploadCmsImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin(); // throws if not admin — acceptable here since this is an explicit admin-only action invoked from an authenticated admin page, not a public form

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided." };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage({ buffer, mimeType: file.type, folder: "cms" });
    return { url };
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) return { error: "Image uploads aren't configured yet." };
    if (err instanceof InvalidImageError) return { error: err.message };
    throw err;
  }
}

const pageFieldsSchema = z.object({
  type: z.enum(["LANDING", "ARTICLE", "COMMUNITY", "BUILDING", "DEVELOPER_PROFILE", "PROJECT", "AGENCY_PROFILE", "AGENT_PROFILE"]),
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(200).optional(), // auto-derived from title when blank
  excerpt: z.string().max(300).optional(),
  body: z.string().min(1),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  noindex: z.coerce.boolean(),
  ogTitle: z.string().max(70).optional(),
  ogDescription: z.string().max(200).optional(),
  ogImageUrl: z.string().url().optional().or(z.literal("")),
  editorialNotes: z.string().max(2000).optional(),
  areaId: z.string().optional(), // only meaningful when type === COMMUNITY — see syncAreaLink
});

export type CmsFormState = { error?: string; success?: boolean; id?: string };

function readFields(formData: FormData) {
  return pageFieldsSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    excerpt: formData.get("excerpt") || undefined,
    body: formData.get("body"),
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    canonicalUrl: formData.get("canonicalUrl") || undefined,
    noindex: formData.get("noindex") === "on" || formData.get("noindex") === "true",
    ogTitle: formData.get("ogTitle") || undefined,
    ogDescription: formData.get("ogDescription") || undefined,
    ogImageUrl: formData.get("ogImageUrl") || undefined,
    editorialNotes: formData.get("editorialNotes") || undefined,
    areaId: formData.get("areaId") || undefined,
  });
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base || "page";
  let suffix = 1;
  while (!(await isSlugAvailable(slug, excludeId))) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function createCmsPage(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  const user = await requireAdmin();
  const parsed = readFields(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { slug: requestedSlug, canonicalUrl, ogImageUrl, areaId, ...rest } = parsed.data;
  const slug = await uniqueSlug(slugify(requestedSlug || rest.title));

  const page = await db.cmsPage.create({
    data: { ...rest, slug, canonicalUrl: canonicalUrl || null, ogImageUrl: ogImageUrl || null, authorId: user.id },
  });

  if (rest.type === "COMMUNITY") await syncAreaLink(page.id, areaId);

  await db.cmsPageRevision.create({
    data: { pageId: page.id, savedById: user.id, ...revisionSnapshot(page) },
  });

  await db.auditLog.create({
    data: { userId: user.id, action: "cms_page.created", entityType: "CmsPage", entityId: page.id },
  });

  revalidatePath("/admin/dashboard/content");
  redirect(`/admin/dashboard/content/${page.id}`);
}

/** Keeps Area.cmsPageId in sync with the editor's selection for a COMMUNITY page —
 * the FK lives on Area (see docs/cms-specification.md §C), so linking/relinking/
 * unlinking from the CmsPage side means updating the Area row(s), not this page. */
async function syncAreaLink(pageId: string, areaId: string | undefined): Promise<void> {
  const currentlyLinked = await db.area.findFirst({ where: { cmsPageId: pageId } });
  if (currentlyLinked && currentlyLinked.id !== areaId) {
    await db.area.update({ where: { id: currentlyLinked.id }, data: { cmsPageId: null } });
  }
  if (areaId && areaId !== currentlyLinked?.id) {
    await db.area.update({ where: { id: areaId }, data: { cmsPageId: pageId } });
  }
}

export async function updateCmsPage(id: string, _prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  const user = await requireAdmin();
  const parsed = readFields(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const existing = await db.cmsPage.findUnique({ where: { id } });
  if (!existing) return { error: "Page not found." };

  const { slug: requestedSlug, canonicalUrl, ogImageUrl, areaId, ...rest } = parsed.data;
  let slug = existing.slug;
  if (requestedSlug && slugify(requestedSlug) !== existing.slug) {
    if (!(await isSlugAvailable(slugify(requestedSlug), id))) {
      return { error: `Slug "${slugify(requestedSlug)}" is already in use.` };
    }
    // Changing a published page's slug breaks whatever already links/ranks for the
    // old one — record a redirect automatically rather than letting it 404 silently.
    if (existing.status === "PUBLISHED" && existing.type === "ARTICLE") {
      await db.redirect.upsert({
        where: { fromPath: `/guides/${existing.slug}` },
        update: { toPath: `/guides/${slugify(requestedSlug)}` },
        create: { fromPath: `/guides/${existing.slug}`, toPath: `/guides/${slugify(requestedSlug)}` },
      });
    }
    slug = slugify(requestedSlug);
  }

  // Snapshot the state BEFORE overwriting it — revisions represent past saved states.
  await db.cmsPageRevision.create({ data: { pageId: id, savedById: user.id, ...revisionSnapshot(existing) } });

  const updated = await db.cmsPage.update({
    where: { id },
    data: { ...rest, slug, canonicalUrl: canonicalUrl || null, ogImageUrl: ogImageUrl || null },
  });

  if (updated.type === "COMMUNITY") await syncAreaLink(id, areaId);
  revalidatePath("/areas"); // area pages can render linked CMS content now

  await db.auditLog.create({
    data: { userId: user.id, action: "cms_page.updated", entityType: "CmsPage", entityId: updated.id },
  });

  revalidatePath("/admin/dashboard/content");
  revalidatePath(`/admin/dashboard/content/${id}`);
  if (updated.status === "PUBLISHED" && updated.type === "ARTICLE") revalidatePath(`/guides/${updated.slug}`);

  return { success: true };
}

function revisionSnapshot(page: {
  title: string; excerpt: string | null; body: string; seoTitle: string | null; seoDescription: string | null;
  canonicalUrl: string | null; noindex: boolean; ogTitle: string | null; ogDescription: string | null; ogImageUrl: string | null;
}) {
  const { title, excerpt, body, seoTitle, seoDescription, canonicalUrl, noindex, ogTitle, ogDescription, ogImageUrl } = page;
  return { title, excerpt, body, seoTitle, seoDescription, canonicalUrl, noindex, ogTitle, ogDescription, ogImageUrl };
}

async function setStatus(id: string, status: "PUBLISHED" | "DRAFT" | "ARCHIVED" | "IN_REVIEW" | "APPROVED") {
  const user = await requireAdmin();
  const data: { status: typeof status; publishedAt?: Date | null } = { status };
  if (status === "PUBLISHED") data.publishedAt = new Date();
  if (status === "DRAFT") data.publishedAt = null;

  const page = await db.cmsPage.update({ where: { id }, data });
  await db.auditLog.create({
    data: { userId: user.id, action: `cms_page.${status.toLowerCase()}`, entityType: "CmsPage", entityId: id },
  });

  revalidatePath("/admin/dashboard/content");
  revalidatePath(`/admin/dashboard/content/${id}`);
  if (page.type === "ARTICLE") revalidatePath(`/guides/${page.slug}`);
}

export async function publishCmsPage(id: string) {
  await setStatus(id, "PUBLISHED");
}
export async function unpublishCmsPage(id: string) {
  await setStatus(id, "DRAFT");
}
export async function archiveCmsPage(id: string) {
  await setStatus(id, "ARCHIVED");
}
export async function submitForReview(id: string) {
  await setStatus(id, "IN_REVIEW");
}
export async function approveCmsPage(id: string) {
  const user = await requireAdmin();
  await db.cmsPage.update({ where: { id }, data: { status: "APPROVED", reviewerId: user.id } });
  await db.auditLog.create({
    data: { userId: user.id, action: "cms_page.approved", entityType: "CmsPage", entityId: id },
  });
  revalidatePath(`/admin/dashboard/content/${id}`);
}

export async function scheduleCmsPage(id: string, formData: FormData) {
  const user = await requireAdmin();
  const scheduledAt = formData.get("scheduledAt");
  if (typeof scheduledAt !== "string" || !scheduledAt) return;

  await db.cmsPage.update({ where: { id }, data: { status: "SCHEDULED", scheduledAt: new Date(scheduledAt) } });
  await db.auditLog.create({
    data: { userId: user.id, action: "cms_page.scheduled", entityType: "CmsPage", entityId: id, metadata: { scheduledAt } },
  });
  revalidatePath(`/admin/dashboard/content/${id}`);
}

/** Restores a page to a prior revision's content — itself snapshots the current
 * (about-to-be-overwritten) state first, so a restore can always be undone too. */
export async function restoreCmsRevision(pageId: string, revisionId: string) {
  const user = await requireAdmin();
  const [page, revision] = await Promise.all([
    db.cmsPage.findUnique({ where: { id: pageId } }),
    db.cmsPageRevision.findUnique({ where: { id: revisionId } }),
  ]);
  if (!page || !revision || revision.pageId !== pageId) return;

  await db.cmsPageRevision.create({ data: { pageId, savedById: user.id, ...revisionSnapshot(page) } });
  await db.cmsPage.update({ where: { id: pageId }, data: revisionSnapshot(revision) });
  await db.auditLog.create({
    data: { userId: user.id, action: "cms_page.restored", entityType: "CmsPage", entityId: pageId, metadata: { revisionId } },
  });

  revalidatePath(`/admin/dashboard/content/${pageId}`);
}

export async function deleteCmsPage(id: string) {
  const user = await requireAdmin();
  await db.cmsPage.delete({ where: { id } });
  await db.auditLog.create({
    data: { userId: user.id, action: "cms_page.deleted", entityType: "CmsPage", entityId: id },
  });
  revalidatePath("/admin/dashboard/content");
  redirect("/admin/dashboard/content");
}
