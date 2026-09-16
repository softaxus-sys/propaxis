"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function canManageOpportunity(userId: string, role: string, opportunityId: string): Promise<boolean> {
  const opportunity = await db.opportunity.findUnique({
    where: { id: opportunityId },
    include: { lead: { include: { agent: true } } },
  });
  if (!opportunity) return false;
  if (opportunity.lead.agent?.userId === userId) return true;
  if (role === "ADMIN") return true;
  if (role === "AGENCY_ADMIN") {
    const ownAgent = await db.agent.findUnique({ where: { userId } });
    return !!ownAgent?.agencyId && ownAgent.agencyId === opportunity.lead.agent?.agencyId;
  }
  return false;
}

const createDealSchema = z.object({
  opportunityId: z.string().min(1),
  finalValueAed: z.coerce.number().min(0).optional(),
});

/** Only makes sense once an Opportunity has reached CLOSED_WON. */
export async function createDeal(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const parsed = createDealSchema.safeParse({
    opportunityId: formData.get("opportunityId"),
    finalValueAed: formData.get("finalValueAed") || undefined,
  });
  if (!parsed.success) return;
  if (!(await canManageOpportunity(session.user.id, session.user.role, parsed.data.opportunityId))) return;

  await db.deal.create({
    data: {
      opportunityId: parsed.data.opportunityId,
      finalValueAed: parsed.data.finalValueAed,
      status: "OPEN",
    },
  });

  revalidatePath("/agent/dashboard/pipeline");
  revalidatePath("/agency/dashboard/pipeline");
}

const updateDealStatusSchema = z.object({
  dealId: z.string().min(1),
  status: z.enum(["OPEN", "WON", "LOST"]),
  finalValueAed: z.coerce.number().min(0).optional(),
});

export async function updateDealStatus(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const parsed = updateDealStatusSchema.safeParse({
    dealId: formData.get("dealId"),
    status: formData.get("status"),
    finalValueAed: formData.get("finalValueAed") || undefined,
  });
  if (!parsed.success) return;

  const deal = await db.deal.findUnique({ where: { id: parsed.data.dealId } });
  if (!deal) return;
  if (!(await canManageOpportunity(session.user.id, session.user.role, deal.opportunityId))) return;

  const isClosing = parsed.data.status !== "OPEN";
  await db.deal.update({
    where: { id: deal.id },
    data: {
      status: parsed.data.status,
      finalValueAed: parsed.data.finalValueAed ?? deal.finalValueAed,
      closedAt: isClosing ? new Date() : null,
    },
  });

  revalidatePath("/agent/dashboard/pipeline");
  revalidatePath("/agency/dashboard/pipeline");
}
