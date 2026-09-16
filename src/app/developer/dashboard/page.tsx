import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/modules/auth/rbac";

const NAV = [{ href: "/developer/dashboard", label: "Projects" }];

export default async function DeveloperDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["DEVELOPER", "ADMIN"])) redirect("/dashboard");

  const membership = await db.developerTeamMember.findFirst({
    where: { userId: session.user.id },
    include: { developer: true },
  });

  if (!membership) {
    return (
      <DashboardShell userName={session.user.name ?? ""} roleLabel="Developer" nav={NAV}>
        <p className="text-sm text-sand-600">No developer company is linked to this account yet.</p>
      </DashboardShell>
    );
  }

  const [projects, leads] = await Promise.all([
    db.project.findMany({
      where: { developerId: membership.developerId },
      include: { area: true, units: true },
      orderBy: { createdAt: "desc" },
    }),
    db.lead.findMany({
      where: { project: { developerId: membership.developerId } },
      include: { customer: true, project: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Developer" nav={NAV}>
      <h1 className="text-2xl font-semibold text-ink-950">{membership.developer.name}</h1>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">Projects</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{projects.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">Total unit types</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">
            {projects.reduce((sum, p) => sum + p.units.length, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-sand-500">Off-plan leads</p>
          <p className="mt-1 text-xl font-semibold text-ink-950">{leads.length}</p>
        </Card>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-ink-950">Projects</h2>
      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-50 text-left text-sand-600">
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Area</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Units</th>
              <th className="px-4 py-3 font-medium">Available</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-sand-100 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/new-projects/${project.slug}`} className="font-medium text-ink-950 hover:text-bronze-500">
                    {project.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sand-700">{project.area.name}</td>
                <td className="px-4 py-3">
                  <Badge variant="neutral">{project.status.replaceAll("_", " ")}</Badge>
                </td>
                <td className="px-4 py-3 text-sand-700">{project.units.length}</td>
                <td className="px-4 py-3 text-sand-700">
                  {project.units.filter((u) => u.availability === "AVAILABLE").length}
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sand-500">
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <h2 className="mt-10 text-lg font-semibold text-ink-950">Recent leads</h2>
      <Card className="mt-4 divide-y divide-sand-100">
        {leads.length === 0 && <p className="p-4 text-sm text-sand-600">No leads yet.</p>}
        {leads.map((lead) => (
          <div key={lead.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-medium text-ink-950">{lead.customer.name ?? lead.customer.email}</p>
              <p className="text-sand-600">{lead.project?.name}</p>
            </div>
            <Badge variant="neutral">{lead.status}</Badge>
          </div>
        ))}
      </Card>
    </DashboardShell>
  );
}
