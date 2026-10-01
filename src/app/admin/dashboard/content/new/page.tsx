import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole } from "@/modules/auth/rbac";
import { createCmsPage } from "@/modules/cms/actions";
import { CmsPageForm } from "@/components/admin/cms-page-form";

const NAV = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/dashboard/content", label: "Content" },
];

export default async function NewCmsPagePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["ADMIN"])) redirect("/dashboard");

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Admin" nav={NAV}>
      <h1 className="text-2xl font-semibold text-ink-950">New page</h1>
      <CmsPageForm action={createCmsPage} />
    </DashboardShell>
  );
}
