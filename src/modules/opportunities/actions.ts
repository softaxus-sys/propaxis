"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function canManageLead(userId: string, role: string, leadId: string): Promise<boolean> {
  const lead = await db.lead.findUnique({ where: { id: leadId }, include: { agent: true } });
  if (!lead) return false;
  if (lead.agent?.userId === userId) return true;
  if (role === "ADMIN") return true;
  if (role === "AGENCY_ADMIN") {
    const ownAgent = await db.agent.findUnique({ where: { userId } });
    return !!ownAgent?.agencyId && ownAgent.agencyId === lead.agent?.agencyId;
  }
  return false;
}

const createOpportunitySchema = z.object({
  leadId: z.string().min(1),
  estValueAed: z.coerce.number().min(0).optional(),
});

export async function createOpportunity(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const parsed = createOpportunitySchema.safeParse({
    leadId: formData.get("leadId"),
    estValueAed: formData.get("estValueAed") || undefined,
  });
  if (!parsed.success) return;
  if (!(await canManageLead(session.user.id, session.user.role, parsed.data.leadId))) return;

  await db.$transaction([
    db.opportunity.create({
      data: { leadId: parsed.data.leadId, estValueAed: parsed.data.estValueAed, stage: "QUALIFICATION" },
    }),
    db.lead.update({ where: { id: parsed.data.leadId }, data: { status: "QUALIFIED" } }),
  ]);

  revalidatePath("/agent/dashboard/pipeline");
  revalidatePath("/agency/dashboard/pipeline");
}

const updateStageSchema = z.object({
  opportunityId: z.string().min(1),
  stage: z.enum(["QUALIFICATION", "VIEWING", "NEGOTIATION", "OFFER", "CLOSED_WON", "CLOSED_LOST"]),
});

export async function updateOpportunityStage(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const parsed = updateStageSchema.safeParse({
    opportunityId: formData.get("opportunityId"),
    stage: formData.get("stage"),
  });
  if (!parsed.success) return;

  const opportunity = await db.opportunity.findUnique({ where: { id: parsed.data.opportunityId } });
  if (!opportunity) return;
  if (!(await canManageLead(session.user.id, session.user.role, opportunity.leadId))) return;

  await db.opportunity.update({ where: { id: opportunity.id }, data: { stage: parsed.data.stage } });

  // OpportunityStage is finer-grained than LeadStatus — map onto the closest status
  // so the lead list stays roughly in sync with pipeline progress.
  const LEAD_STATUS_BY_STAGE = {
    QUALIFICATION: "QUALIFIED",
    VIEWING: "VIEWING_SCHEDULED",
    NEGOTIATION: "NEGOTIATING",
    OFFER: "NEGOTIATING",
    CLOSED_WON: "WON",
    CLOSED_LOST: "LOST",
  } as const;
  await db.lead.update({
    where: { id: opportunity.leadId },
    data: { status: LEAD_STATUS_BY_STAGE[parsed.data.stage] },
  });

  revalidatePath("/agent/dashboard/pipeline");
  revalidatePath("/agency/dashboard/pipeline");
}
