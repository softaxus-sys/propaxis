import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge, DemoDataBadge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "New Projects" };

const STATUS_LABEL: Record<string, string> = {
  ANNOUNCED: "Announced",
  OFF_PLAN: "Off-plan",
  UNDER_CONSTRUCTION: "Under construction",
  READY: "Ready",
};

export default async function NewProjectsPage() {
  const projects = await db.project.findMany({
    include: { area: true, developer: true, _count: { select: { units: true } } },
    orderBy: { launchDate: "desc" },
  });

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <h1 className="text-2xl font-semibold text-ink-950">New &amp; off-plan projects</h1>
          <p className="mt-1 text-sm text-sand-600">Upcoming launches and off-plan inventory from UAE developers.</p>

          {projects.length === 0 ? (
            <div className="mt-16 rounded-2xl border border-dashed border-sand-300 bg-white py-16 text-center">
              <p className="text-sand-600">No projects published yet.</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link key={project.id} href={`/new-projects/${project.slug}`}>
                  <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
                    <div className="flex h-32 items-end justify-between bg-gradient-to-br from-bronze-500 to-bronze-300 p-4">
                      <Badge variant="dark">{STATUS_LABEL[project.status]}</Badge>
                      {project.isDemoData && <DemoDataBadge className="bg-white/90" />}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <h3 className="font-semibold text-ink-950">{project.name}</h3>
                      <p className="text-sm text-sand-600">
                        {project.area.name} · {project.developer.name}
                      </p>
                      <p className="mt-auto text-sm font-semibold text-ink-950">
                        {project.startingPriceAed ? (
                          <>Starting from {formatAed(Number(project.startingPriceAed), { compact: true })}</>
                        ) : (
                          "Price on request"
                        )}
                      </p>
                      <p className="text-xs text-sand-500">{project._count.units} unit types listed</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
