import { db } from "@/lib/db";

export async function listAgents() {
  return db.agent.findMany({
    include: {
      user: true,
      agency: true,
      _count: { select: { listings: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAgentBySlug(slug: string) {
  const agent = await db.agent.findUnique({
    where: { slug },
    include: {
      user: true,
      agency: true,
      listings: {
        where: { status: "ACTIVE" },
        include: { property: { include: { area: true } } },
        orderBy: { publishedAt: "desc" },
      },
    },
  });
  return agent;
}
