"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

const registerAgencySchema = z.object({
  contactName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().max(40).optional(),
  agencyName: z.string().min(2).max(160),
  ridNumber: z.string().min(3).max(60),
  website: z.string().url().optional().or(z.literal("")),
});

export type RegisterAgencyState = { error?: string; success?: boolean };

/**
 * Self-serve agency (business) sign-up. Creates the Agency and its first
 * AGENCY_ADMIN user in one step — the admin also gets an Agent profile, since
 * agency admins act as agents in our permission model (see modules/auth/rbac.ts).
 * Both land unverified; see registerAgent's comment for why (no real RERA/DLD
 * integration, just an admin review queue standing in for it).
 */
export async function registerAgency(_prev: RegisterAgencyState, formData: FormData): Promise<RegisterAgencyState> {
  const parsed = registerAgencySchema.safeParse({
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    agencyName: formData.get("agencyName"),
    ridNumber: formData.get("ridNumber"),
    website: formData.get("website") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { contactName, email, password, phone, agencyName, ridNumber, website } = parsed.data;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const agencySlug = await uniqueSlug("agency", slugify(agencyName) || "agency");
  const agentSlug = await uniqueSlug("agent", slugify(contactName) || "agent");

  await db.agency.create({
    data: {
      slug: agencySlug,
      name: agencyName,
      ridNumber,
      website: website || undefined,
      phone,
      email,
      isVerified: false,
      agents: {
        create: {
          slug: agentSlug,
          isVerified: false,
          user: {
            create: {
              name: contactName,
              email,
              phone,
              passwordHash,
              role: "AGENCY_ADMIN",
            },
          },
        },
      },
    },
  });

  return { success: true };
}

async function uniqueSlug(model: "agency" | "agent", base: string): Promise<string> {
  let slug = base;
  let suffix = 1;
  while (
    model === "agency" ? await db.agency.findUnique({ where: { slug } }) : await db.agent.findUnique({ where: { slug } })
  ) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}
