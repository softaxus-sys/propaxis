"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function getOwnAgencyId(userId: string) {
  const agent = await db.agent.findUnique({ where: { userId } });
  return agent?.agencyId ?? null;
}

const connectSchema = z.object({
  vroduxWebhookUrl: z.string().url().max(500),
});

export type ConnectVroduxState = { error?: string; success?: boolean };

/** Connects this agency's own VRODUX tenant via its lead-intake webhook URL — the
 * same mechanism VRODUX exposes for Property Finder/Bayut/web forms. Per-agency, not
 * global; see docs/ARCHITECTURE.md §7. */
export async function connectVrodux(_prev: ConnectVroduxState, formData: FormData): Promise<ConnectVroduxState> {
  const session = await auth();
  if (!session?.user || !["AGENCY_ADMIN", "ADMIN"].includes(session.user.role)) {
    return { error: "You don't have permission to do this." };
  }

  const agencyId = await getOwnAgencyId(session.user.id);
  if (!agencyId) return { error: "No agency is linked to this account." };

  const parsed = connectSchema.safeParse({
    vroduxWebhookUrl: formData.get("vroduxWebhookUrl"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please enter a valid webhook URL." };

  await db.agency.update({
    where: { id: agencyId },
    data: {
      vroduxWebhookUrl: parsed.data.vroduxWebhookUrl,
      vroduxConnectedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "agency.vrodux_connected",
      entityType: "Agency",
      entityId: agencyId,
    },
  });

  revalidatePath("/agency/dashboard/vrodux");
  return { success: true };
}

export async function disconnectVrodux(formData: FormData) {
  const session = await auth();
  if (!session?.user || !["AGENCY_ADMIN", "ADMIN"].includes(session.user.role)) return;

  const agencyId = await getOwnAgencyId(session.user.id);
  if (!agencyId) return;
  if (formData.get("agencyId") !== agencyId) return;

  await db.agency.update({
    where: { id: agencyId },
    data: { vroduxWebhookUrl: null, vroduxConnectedAt: null },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "agency.vrodux_disconnected",
      entityType: "Agency",
      entityId: agencyId,
    },
  });

  revalidatePath("/agency/dashboard/vrodux");
}
