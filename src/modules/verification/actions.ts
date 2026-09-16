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
