"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

const registerAgentSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().max(40).optional(),
  ridNumber: z.string().min(3).max(60),
  agencyId: z.string().min(1),
});

export type RegisterAgentState = { error?: string; success?: boolean };

/**
 * Self-serve agent sign-up. Mirrors how Property Finder/Bayut require every agent to
 * be affiliated with an already-registered agency — an agent can't sign up "floating"
 * without picking one. New accounts land unverified; an admin approves them from the
 * verification queue before they can publish listings (see listings/actions.ts and
 * docs/ARCHITECTURE.md §8/§14 discussion). This is a lightweight stand-in for the real
 * RERA/DLD broker-card check those platforms perform — PropAxis has no such
 * integration, so verification here is a manual admin review, not a regulatory one.
 */
export async function registerAgent(_prev: RegisterAgentState, formData: FormData): Promise<RegisterAgentState> {
  const parsed = registerAgentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    ridNumber: formData.get("ridNumber"),
    agencyId: formData.get("agencyId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, phone, ridNumber, agencyId } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const agency = await db.agency.findUnique({ where: { id: agencyId } });
  if (!agency) {
    return { error: "Please select a valid agency." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const baseSlug = slugify(name) || "agent";
  const slug = await uniqueAgentSlug(baseSlug);

  await db.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: "AGENT",
      agent: {
        create: {
          slug,
          ridNumber,
          agencyId: agency.id,
          isVerified: false,
        },
      },
    },
  });

  return { success: true };
}

async function uniqueAgentSlug(base: string): Promise<string> {
  let slug = base;
  let suffix = 1;
  while (await db.agent.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}
