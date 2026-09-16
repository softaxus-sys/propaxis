import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NewListingForm } from "@/components/dashboard/new-listing-form";
import { requireRole } from "@/modules/auth/rbac";
import { AGENT_NAV } from "@/components/dashboard/agent-nav";

export default async function NewListingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["AGENT", "AGENCY_ADMIN", "ADMIN"])) redirect("/dashboard");

  const agent = await db.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent?.isVerified) redirect("/agent/dashboard");

  const areas = await db.area.findMany({ orderBy: { name: "asc" } });

  return (
    <DashboardShell
      userName={session.user.name ?? ""}
      roleLabel="Agent"
      nav={AGENT_NAV}
    >
      <h1 className="text-2xl font-semibold text-ink-950">New listing</h1>
      <div className="mt-6 max-w-xl">
        <NewListingForm areas={areas.map((a) => ({ id: a.id, name: a.name }))} />
      </div>
    </DashboardShell>
  );
}
