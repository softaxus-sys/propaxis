import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/modules/auth/rbac";
import { getCmsPageById, listAreasForLinking } from "@/modules/cms/queries";
import {
  updateCmsPage,
  publishCmsPage,
  unpublishCmsPage,
  archiveCmsPage,
  submitForReview,
  approveCmsPage,
  scheduleCmsPage,
  restoreCmsRevision,
  deleteCmsPage,
} from "@/modules/cms/actions";
import { CmsPageForm } from "@/components/admin/cms-page-form";

const NAV = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/dashboard/content", label: "Content" },
];

export default async function EditCmsPagePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["ADMIN"])) redirect("/dashboard");

  const { id } = await params;
  const [page, areas] = await Promise.all([getCmsPageById(id), listAreasForLinking()]);
  if (!page) notFound();

  const updateAction = updateCmsPage.bind(null, id);

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Admin" nav={NAV}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink-950">{page.title}</h1>
            <Badge variant="neutral">{page.status}</Badge>
          </div>
          {page.status === "PUBLISHED" && page.type === "ARTICLE" && (
            <Link href={`/guides/${page.slug}`} target="_blank" className="text-sm text-bronze-600 underline underline-offset-4">
              View live →
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {page.status === "DRAFT" && (
            <form action={submitForReview.bind(null, id)}>
              <Button type="submit" size="sm" variant="outline">
                Submit for review
              </Button>
            </form>
          )}
          {page.status === "IN_REVIEW" && (
            <form action={approveCmsPage.bind(null, id)}>
              <Button type="submit" size="sm" variant="outline">
                Approve
              </Button>
            </form>
          )}
          {page.status !== "PUBLISHED" && (
            <form action={publishCmsPage.bind(null, id)}>
              <Button type="submit" size="sm">
                Publish now
              </Button>
            </form>
          )}
          {page.status === "PUBLISHED" && (
            <form action={unpublishCmsPage.bind(null, id)}>
              <Button type="submit" size="sm" variant="outline">
                Unpublish
              </Button>
            </form>
          )}
          {page.status !== "ARCHIVED" && (
            <form action={archiveCmsPage.bind(null, id)}>
              <Button type="submit" size="sm" variant="ghost">
                Archive
              </Button>
            </form>
          )}
          <form action={deleteCmsPage.bind(null, id)}>
            <Button type="submit" size="sm" variant="ghost" className="text-danger">
              Delete
            </Button>
          </form>
        </div>
      </div>

      <Card className="mt-4 flex flex-wrap items-center gap-3 p-4">
        <form action={scheduleCmsPage.bind(null, id)} className="flex items-center gap-2">
          <label className="text-sm text-sand-600">Schedule publish:</label>
          <input
            type="datetime-local"
            name="scheduledAt"
            defaultValue={page.scheduledAt ? page.scheduledAt.toISOString().slice(0, 16) : undefined}
            className="h-9 rounded-lg border border-sand-300 px-2 text-sm"
          />
          <Button type="submit" size="sm" variant="outline">
            Set
          </Button>
        </form>
        <span className="text-xs text-sand-500">
          Runs once daily via the scheduled-publish cron (Vercel Hobby's cron limit — see
          docs/cms-specification.md), not at the exact minute.
        </span>
      </Card>

      <CmsPageForm action={updateAction} page={page} areas={areas} currentAreaId={page.area?.id} />

      <h2 className="mt-10 text-lg font-semibold text-ink-950">Revision history</h2>
      <Card className="mt-4 divide-y divide-sand-100">
        {page.revisions.length === 0 && <p className="p-4 text-sm text-sand-600">No prior revisions yet.</p>}
        {page.revisions.map((rev) => (
          <div key={rev.id} className="flex items-center justify-between gap-4 p-4 text-sm">
            <div>
              <p className="text-ink-950">{rev.title}</p>
              <p className="text-sand-500">
                {rev.createdAt.toLocaleString()} {rev.savedBy?.name ? `by ${rev.savedBy.name}` : ""}
              </p>
            </div>
            <form action={restoreCmsRevision.bind(null, id, rev.id)}>
              <Button type="submit" size="sm" variant="outline">
                Restore this version
              </Button>
            </form>
          </div>
        ))}
      </Card>
    </DashboardShell>
  );
}
