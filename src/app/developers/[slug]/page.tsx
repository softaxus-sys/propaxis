import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge, DemoDataBadge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils";
import { db } from "@/lib/db";

export default async function DeveloperProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const developer = await db.developer.findUnique({
    where: { slug },
    include: { projects: { include: { area: true } } },
  });
  if (!developer) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-sand-50 py-10">
        <Container>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink-950">{developer.name}</h1>
            {developer.isVerified && <Badge variant="success">Verified</Badge>}
            {developer.isDemoData && <DemoDataBadge />}
          </div>
          {developer.description && <p className="mt-2 max-w-2xl text-sm text-sand-600">{developer.description}</p>}

          <h2 className="mt-10 text-lg font-semibold text-ink-950">Projects</h2>
          {developer.projects.length === 0 ? (
            <p className="mt-4 text-sm text-sand-600">No projects published yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {developer.projects.map((project) => (
                <Link key={project.slug} href={`/new-projects/${project.slug}`}>
                  <Card className="p-5 transition-shadow hover:shadow-md">
                    <h3 className="font-semibold text-ink-950">{project.name}</h3>
                    <p className="mt-1 text-sm text-sand-600">{project.area.name}</p>
                    <p className="mt-3 text-sm font-medium text-ink-950">
                      {project.startingPriceAed
                        ? `From ${formatAed(Number(project.startingPriceAed), { compact: true })}`
                        : "Price on request"}
                    </p>
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
