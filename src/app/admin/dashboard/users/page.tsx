import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/modules/auth/rbac";
import { ADMIN_NAV as NAV } from "@/components/dashboard/admin-nav";
import type { Role } from "@prisma/client";

const ROLE_VARIANT: Record<Role, "neutral" | "accent" | "success" | "info" | "dark"> = {
  USER: "neutral",
  AGENT: "info",
  AGENCY_ADMIN: "accent",
  DEVELOPER: "dark",
  ADMIN: "success",
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!requireRole(session.user.role as never, ["ADMIN"])) redirect("/dashboard");

  const users = await db.user.findMany({
    include: {
      agent: { include: { agency: true } },
      developerMemberships: { include: { developer: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <DashboardShell userName={session.user.name ?? ""} roleLabel="Admin" nav={NAV}>
      <h1 className="text-2xl font-semibold text-ink-950">All users ({users.length})</h1>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-50 text-left text-sand-600">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Profile</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const developerProfile = user.developerMemberships[0]?.developer;
              return (
                <tr key={user.id} className="border-b border-sand-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-950">{user.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sand-700">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_VARIANT[user.role]}>{user.role.replaceAll("_", " ")}</Badge>
                    {user.agent && !user.agent.isVerified && (
                      <span className="ms-2 text-xs text-sand-500">(unverified)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sand-700">
                    {user.agent ? (
                      <Link href={`/agents/${user.agent.slug}`} className="text-bronze-600 hover:underline">
                        Agent profile
                      </Link>
                    ) : null}
                    {user.agent?.agency && (
                      <>
                        {" · "}
                        <Link href={`/agencies/${user.agent.agency.slug}`} className="text-bronze-600 hover:underline">
                          {user.agent.agency.name}
                        </Link>
                      </>
                    )}
                    {developerProfile && (
                      <Link href={`/developers/${developerProfile.slug}`} className="text-bronze-600 hover:underline">
                        {developerProfile.name}
                      </Link>
                    )}
                    {!user.agent && !developerProfile && <span className="text-sand-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sand-500">{user.createdAt.toLocaleDateString()}</td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sand-500">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </DashboardShell>
  );
}
