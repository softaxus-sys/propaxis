"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getVroduxProvider } from "@/modules/vrodux-integration/client";

const enquirySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  message: z.string().max(2000).optional(),
  listingId: z.string().optional(),
  projectId: z.string().optional(),
  agentId: z.string().optional(),
  source: z.enum(["WEBSITE_ENQUIRY", "AI_SEARCH"]).default("WEBSITE_ENQUIRY"),
});

export type EnquiryState = { error?: string; success?: boolean };

export async function submitEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const parsed = enquirySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    message: formData.get("message") || undefined,
    listingId: formData.get("listingId") || undefined,
    projectId: formData.get("projectId") || undefined,
    agentId: formData.get("agentId") || undefined,
    source: (formData.get("source") as string) || "WEBSITE_ENQUIRY",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, phone, message, listingId, projectId, agentId, source } = parsed.data;

  const customer = await db.user.upsert({
    where: { email },
    update: { name, phone: phone ?? undefined },
    create: { name, email, phone, role: "USER" },
  });

  const lead = await db.lead.create({
    data: {
      customerId: customer.id,
      listingId,
      projectId,
      agentId,
      message,
      source,
      status: "NEW",
    },
  });

  const listing = listingId
    ? await db.listing.findUnique({ where: { id: listingId }, include: { agency: true } })
    : null;
  const project = projectId ? await db.project.findUnique({ where: { id: projectId } }) : null;
  const directAgent = agentId ? await db.agent.findUnique({ where: { id: agentId }, include: { agency: true } }) : null;

  // Which agency's VRODUX tenant (if any) this lead's push is scoped to — resolved
  // from the listing's agency, or the directly-contacted agent's agency. Projects
  // belong to developers, not agencies, so a project-only enquiry has no VRODUX target.
  const agency = listing?.agency ?? directAgent?.agency ?? null;

  if (agency?.vroduxWebhookUrl) {
    try {
      const vrodux = getVroduxProvider(agency);
      const { vroduxRefId } = await vrodux.pushLead({
        externalLeadId: lead.id,
        contact: { name, email, phone },
        source: source === "AI_SEARCH" ? "PropAxis AI Search" : "PropAxis Website Enquiry",
        subject: listing?.title ?? project?.name ?? "General enquiry",
        message,
      });

      // A successful call (no throw) means the webhook accepted the lead — mark it
      // synced even if VRODUX's response didn't include a structured ref id back.
      await db.lead.update({
        where: { id: lead.id },
        data: { vroduxSyncedAt: new Date(), vroduxRefId: vroduxRefId || null },
      });
    } catch (err) {
      // Lead is already persisted in PropAxis; VRODUX sync is best-effort and can be
      // retried later without blocking the customer's enquiry from succeeding.
      console.error("[leads] VRODUX sync failed", err);
    }
  }

  return { success: true };
}

const updateLeadStatusSchema = z.object({
  leadId: z.string().min(1),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "VIEWING_SCHEDULED", "NEGOTIATING", "WON", "LOST"]),
});

export async function updateLeadStatus(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const parsed = updateLeadStatusSchema.safeParse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const lead = await db.lead.findUnique({ where: { id: parsed.data.leadId }, include: { agent: true } });
  if (!lead) return;

  const isOwner = lead.agent?.userId === session.user.id;
  const isPrivileged = ["AGENCY_ADMIN", "ADMIN"].includes(session.user.role);
  if (!isOwner && !isPrivileged) return;

  await db.lead.update({ where: { id: lead.id }, data: { status: parsed.data.status } });
  revalidatePath("/agent/dashboard");
  revalidatePath("/agency/dashboard");
}
