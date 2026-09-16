"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { can } from "@/modules/auth/rbac";

const reviewSchema = z.object({
  propertyId: z.string().min(1),
  decision: z.enum(["VERIFIED", "REJECTED"]),
});

export async function reviewVerification(formData: FormData) {
  const session = await auth();
  if (!can(session?.user?.role as never, "verification:review")) return;

  const parsed = reviewSchema.safeParse({
    propertyId: formData.get("propertyId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return;

  await db.verification.upsert({
    where: { propertyId: parsed.data.propertyId },
    update: { status: parsed.data.decision, verifiedAt: new Date(), verifiedBy: session!.user.id },
    create: {
      propertyId: parsed.data.propertyId,
      status: parsed.data.decision,
      source: "PROPAXIS_AGENT",
      confidenceScore: parsed.data.decision === "VERIFIED" ? 0.9 : 0.2,
      verifiedAt: new Date(),
      verifiedBy: session!.user.id,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session!.user.id,
      action: "verification.reviewed",
      entityType: "Property",
      entityId: parsed.data.propertyId,
      metadata: { decision: parsed.data.decision },
    },
  });

  revalidatePath("/admin/dashboard");
}

const reviewAgentSchema = z.object({
  agentId: z.string().min(1),
  decision: z.enum(["true", "false"]),
});

/** Approve/reject a self-registered agent — see registerAgent's comment for context. */
export async function reviewAgentVerification(formData: FormData) {
  const session = await auth();
  if (!can(session?.user?.role as never, "verification:review")) return;

  const parsed = reviewAgentSchema.safeParse({
    agentId: formData.get("agentId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return;

  const isVerified = parsed.data.decision === "true";
  await db.agent.update({ where: { id: parsed.data.agentId }, data: { isVerified } });

  await db.auditLog.create({
    data: {
      userId: session!.user.id,
      action: "agent.verification_reviewed",
      entityType: "Agent",
      entityId: parsed.data.agentId,
      metadata: { isVerified },
    },
  });

  revalidatePath("/admin/dashboard");
}

const reviewAgencySchema = z.object({
  agencyId: z.string().min(1),
  decision: z.enum(["true", "false"]),
});

/** Approve/reject a self-registered agency — see registerAgency's comment for context. */
export async function reviewAgencyVerification(formData: FormData) {
  const session = await auth();
  if (!can(session?.user?.role as never, "verification:review")) return;

  const parsed = reviewAgencySchema.safeParse({
    agencyId: formData.get("agencyId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return;

  const isVerified = parsed.data.decision === "true";
  await db.agency.update({ where: { id: parsed.data.agencyId }, data: { isVerified } });

  await db.auditLog.create({
    data: {
      userId: session!.user.id,
      action: "agency.verification_reviewed",
      entityType: "Agency",
      entityId: parsed.data.agencyId,
      metadata: { isVerified },
    },
  });

  revalidatePath("/admin/dashboard");
}
