import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/modules/auth/rbac";
import { listCmsPages } from "@/modules/cms/queries";
import { ADMIN_NAV as NAV } from "@/components/dashboard/admin-nav";
import type { CmsPageStatus, CmsPageType } from "@prisma/client";

const STATUS_VARIANT: Record<CmsPageStatus, "neutral" | "accent" | "success" | "info" | "dark"> = {
  DRAFT: "neutral",
  IN_REVIEW: "info",
  APPROVED: "accent",
  SCHEDULED: "info",
  PUBLISHED: "success",
  ARCHIVED: "dark",
};

export default async function CmsContentListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["ADMIN"])) redirect("/dashboard");

  const { status, type, q } = await searchParams;
  const pages = await listCmsPages({
    status: status as CmsPageStatus | undefined,
    type: type as CmsPageType | undefined,
    search: q,
  });

  const statuses: CmsPageStatus[] = ["DRAFT", "IN_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "ARCHIVED"];

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Admin" nav={NAV}>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink-950">Content</h1>
        <Link href="/admin/dashboard/content/new">
          <Button size="sm">New page</Button>
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap items-center gap-3" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search title or slug…"
          className="h-9 rounded-lg border border-sand-300 bg-white px-3 text-sm placeholder:text-sand-500 focus:border-ink-700 focus:outline-none"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-9 rounded-lg border border-sand-300 bg-white px-3 text-sm"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="outline">
          Filter
        </Button>
      </form>

      <Card className="mt-6 divide-y divide-sand-100">
        {pages.length === 0 && <p className="p-4 text-sm text-sand-600">No content matches these filters.</p>}
        {pages.map((page) => (
          <Link
            key={page.id}
            href={`/admin/dashboard/content/${page.id}`}
            className="flex items-center justify-between gap-4 p-4 text-sm hover:bg-sand-50"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-950">{page.title}</p>
              <p className="text-sand-500">
                /{page.type === "ARTICLE" ? "guides/" : ""}
                {page.slug} · {page.type} · updated {page.updatedAt.toLocaleDateString()}
                {page.author?.name ? ` by ${page.author.name}` : ""}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[page.status]}>{page.status}</Badge>
          </Link>
        ))}
      </Card>
    </DashboardShell>
  );
}
