"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { can } from "@/modules/auth/rbac";
import { uploadImage, StorageNotConfiguredError, InvalidImageError } from "@/lib/storage";

const createListingSchema = z.object({
  title: z.string().min(4).max(160),
  description: z.string().max(4000).optional(),
  type: z.enum(["SALE", "RENT"]),
  propertyType: z.enum([
    "APARTMENT",
    "VILLA",
    "TOWNHOUSE",
    "PENTHOUSE",
    "DUPLEX",
    "PLOT",
    "OFFICE",
    "RETAIL",
    "WAREHOUSE",
  ]),
  areaId: z.string().min(1),
  bedrooms: z.coerce.number().int().min(0).default(0),
  bathrooms: z.coerce.number().int().min(0).default(0),
  areaSqft: z.coerce.number().min(0).optional(),
  askingPriceAed: z.coerce.number().min(0).optional(),
  askingRentAedYear: z.coerce.number().min(0).optional(),
});

export type CreateListingState = { error?: string; success?: boolean };

export async function createListing(_prev: CreateListingState, formData: FormData): Promise<CreateListingState> {
  const session = await auth();
  if (!can(session?.user?.role as never, "listing:create")) {
    return { error: "You don't have permission to create listings." };
  }

  const agent = await db.agent.findUnique({ where: { userId: session!.user.id } });
  if (!agent) return { error: "No agent profile found for this account." };
  if (!agent.isVerified) {
    return { error: "Your agent profile is still pending verification. You'll be able to publish listings once an admin approves it." };
  }

  const parsed = createListingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    propertyType: formData.get("propertyType"),
    areaId: formData.get("areaId"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    areaSqft: formData.get("areaSqft") || undefined,
    askingPriceAed: formData.get("askingPriceAed") || undefined,
    askingRentAedYear: formData.get("askingRentAedYear") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  // Native multi-file <input> entries come through formData.getAll() — a form with no
  // file selected still yields one empty (size 0, name "") File, filtered out here so
  // existing listing creation with no photos behaves exactly as before.
  const imageFiles = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const MAX_IMAGES = 12;
  if (imageFiles.length > MAX_IMAGES) {
    return { error: `Please upload at most ${MAX_IMAGES} photos.` };
  }

  const images: string[] = [];
  for (const file of imageFiles) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await uploadImage({ buffer, mimeType: file.type, folder: "listings" });
      images.push(url);
    } catch (err) {
      if (err instanceof StorageNotConfiguredError) {
        return { error: "Photo uploads aren't available right now — please contact support." };
      }
      if (err instanceof InvalidImageError) {
        return { error: `${file.name || "One of your photos"}: ${err.message}` };
      }
      throw err;
    }
  }

  const property = await db.property.create({
    data: {
      type: data.propertyType,
      areaId: data.areaId,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      areaSqft: data.areaSqft,
    },
  });

  await db.listing.create({
    data: {
      propertyId: property.id,
      type: data.type,
      status: "ACTIVE",
      title: data.title,
      description: data.description,
      askingPriceAed: data.type === "SALE" ? data.askingPriceAed : undefined,
      askingRentAedYear: data.type === "RENT" ? data.askingRentAedYear : undefined,
      agentId: agent.id,
      agencyId: agent.agencyId,
      publishedAt: new Date(),
      images,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session!.user.id,
      action: "listing.created",
      entityType: "Listing",
      entityId: property.id,
    },
  });

  revalidatePath("/agent/dashboard");
  return { success: true };
}

const updateStatusSchema = z.object({
  listingId: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "UNDER_OFFER", "RENTED", "SOLD", "EXPIRED", "WITHDRAWN"]),
});

export async function updateListingStatus(formData: FormData) {
  const session = await auth();
  if (!can(session?.user?.role as never, "listing:publish")) return;

  const parsed = updateStatusSchema.safeParse({
    listingId: formData.get("listingId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const listing = await db.listing.findUnique({ where: { id: parsed.data.listingId } });
  if (!listing) return;

  const agent = await db.agent.findUnique({ where: { userId: session!.user.id } });
  const isOwner = agent?.id === listing.agentId;
  const isAgencyAdmin = session!.user.role === "AGENCY_ADMIN" && agent?.agencyId === listing.agencyId;
  const isAdmin = session!.user.role === "ADMIN";
  if (!isOwner && !isAgencyAdmin && !isAdmin) return;

  await db.listing.update({ where: { id: parsed.data.listingId }, data: { status: parsed.data.status } });
  await db.auditLog.create({
    data: {
      userId: session!.user.id,
      action: "listing.status_changed",
      entityType: "Listing",
      entityId: listing.id,
      metadata: { from: listing.status, to: parsed.data.status },
    },
  });

  revalidatePath("/agent/dashboard");
  revalidatePath("/agency/dashboard");
}
