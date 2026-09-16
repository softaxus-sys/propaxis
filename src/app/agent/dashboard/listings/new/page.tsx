import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NewListingForm } from "@/components/dashboard/new-listing-form";
import { requireRole } from "@/modules/auth/rbac";

export default async function NewListingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["AGENT", "AGENCY_ADMIN", "ADMIN"])) redirect("/dashboard");

  const areas = await db.area.findMany({ orderBy: { name: "asc" } });

  return (
    <DashboardShell
      userName={session.user.name ?? ""}
      roleLabel="Agent"
      nav={[
        { href: "/agent/dashboard", label: "Listings" },
        { href: "/agent/dashboard/leads", label: "Leads" },
      ]}
    >
      <h1 className="text-2xl font-semibold text-ink-950">New listing</h1>
      <div className="mt-6 max-w-xl">
        <NewListingForm areas={areas.map((a) => ({ id: a.id, name: a.name }))} />
      </div>
    </DashboardShell>
  );
}
