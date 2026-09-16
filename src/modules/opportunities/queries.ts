import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const opportunityInclude = {
  lead: {
    include: {
      customer: true,
      listing: { include: { property: { include: { area: true } } } },
      project: true,
      agent: { include: { user: true } },
    },
  },
  deal: true,
} satisfies Prisma.OpportunityInclude;

export type PipelineOpportunity = Prisma.OpportunityGetPayload<{ include: typeof opportunityInclude }>;

async function getPipeline(leadWhere: Prisma.LeadWhereInput) {
  const [leadsWithoutOpportunity, opportunities] = await Promise.all([
    db.lead.findMany({
      where: { ...leadWhere, opportunity: null, status: { in: ["QUALIFIED", "VIEWING_SCHEDULED", "NEGOTIATING"] } },
      include: { customer: true, listing: true, project: true },
      orderBy: { createdAt: "desc" },
    }),
    db.opportunity.findMany({
      where: { lead: leadWhere },
      include: opportunityInclude,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const byStage: Record<string, PipelineOpportunity[]> = {
    QUALIFICATION: [],
    VIEWING: [],
    NEGOTIATION: [],
    OFFER: [],
    CLOSED_WON: [],
    CLOSED_LOST: [],
  };
  for (const opp of opportunities) byStage[opp.stage].push(opp);

  return { leadsWithoutOpportunity, byStage };
}

export function getPipelineForAgent(agentId: string) {
  return getPipeline({ agentId });
}

export function getPipelineForAgency(agencyId: string) {
  return getPipeline({ agent: { agencyId } });
}
