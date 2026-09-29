/**
 * ══════════════════════════════════════════════════════════════════════════════════
 * FIELD MAPPING WARNING — read before touching mapVroduxProperty below.
 *
 * The exact JSON field names Vrodux's /properties endpoint returns are NOT confirmed.
 * Everything in `mapVroduxProperty` is a best-effort guess built from domain context
 * (see docs/ARCHITECTURE.md §7.2): a "listing" is a building/property combined with one
 * unit, with fields like name/address/city/emirate/developer/description at the
 * building level and purpose/type/bedrooms/area/price at the unit level, price given
 * both as a raw number and a fuzzy human label (e.g. "700k(rented till 29 Feb 2026)").
 *
 * DO NOT rely on this mapping being correct against the real API. Before pulling real
 * data in production: get a real sample payload from the Vrodux/Softaxis team, or call
 * fetchVroduxProperties with a real test apiKey once one exists, and update the field
 * names in `readField` calls below to match. Everything else in this file (upsert
 * orchestration, delisting, error handling) is not guesswork and doesn't need to wait.
 * ══════════════════════════════════════════════════════════════════════════════════
 */

import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { PropertyType } from "@prisma/client";
import { fetchVroduxProperties, VroduxUnauthorizedError, type VroduxProperty } from "./listing-sync-client";

/** Tries several plausible field names in order — see the warning above. */
function readField(raw: VroduxProperty, ...keys: string[]): unknown {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key];
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    // Handles fuzzy labels like "700k" / "1.2M" alongside plain numbers/currency strings.
    const cleaned = value.replace(/,/g, "").trim();
    const kOrM = cleaned.match(/^([\d.]+)\s*([km])$/i);
    if (kOrM) {
      const n = Number(kOrM[1]);
      return kOrM[2].toLowerCase() === "m" ? n * 1_000_000 : n * 1_000;
    }
    const n = Number(cleaned.replace(/[^\d.]/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

const PROPERTY_TYPE_MAP: Record<string, PropertyType> = {
  apartment: "APARTMENT",
  flat: "APARTMENT",
  villa: "VILLA",
  townhouse: "TOWNHOUSE",
  penthouse: "PENTHOUSE",
  duplex: "DUPLEX",
  plot: "PLOT",
  land: "PLOT",
  office: "OFFICE",
  retail: "RETAIL",
  shop: "RETAIL",
  warehouse: "WAREHOUSE",
  "labor camp": "LABOR_CAMP",
  building: "BUILDING",
};

function mapPropertyType(raw: string | undefined): PropertyType {
  if (!raw) return "OTHER";
  return PROPERTY_TYPE_MAP[raw.trim().toLowerCase()] ?? "OTHER";
}

function mapPurposeToListingType(raw: string | undefined): "SALE" | "RENT" {
  return raw?.toLowerCase().includes("rent") ? "RENT" : "SALE";
}

type MappedListing = {
  vroduxPropertyId: string;
  title: string;
  description?: string;
  propertyType: PropertyType;
  listingType: "SALE" | "RENT";
  bedrooms?: number;
  areaSqft?: number;
  priceAed?: number;
  rawPriceLabel?: string;
  cityName: string;
  emirate: string;
  images: string[];
};

function mapVroduxProperty(raw: VroduxProperty): MappedListing | null {
  const id = asString(readField(raw, "id", "propertyId", "unitId"));
  if (!id) return null; // can't track/delist something with no stable id

  const buildingName = asString(readField(raw, "name", "buildingName", "propertyName", "title"));
  const address = asString(readField(raw, "address", "addressLine"));
  const cityName = asString(readField(raw, "city")) ?? "Dubai";
  const emirate = asString(readField(raw, "emirate", "state")) ?? "Dubai";
  const description = asString(readField(raw, "description", "notes"));

  const purpose = asString(readField(raw, "purpose", "listingType", "category"));
  const propertyTypeRaw = asString(readField(raw, "propertyType", "type", "unitType"));
  const bedrooms = asNumber(readField(raw, "bedrooms", "beds"));
  const areaSqft = asNumber(readField(raw, "area", "areaSqft", "size"));

  const priceRaw = readField(raw, "price", "priceAed", "amount");
  const priceLabel = asString(readField(raw, "priceLabel", "priceText"));
  const priceAed = asNumber(priceRaw) ?? asNumber(priceLabel);

  const images = readField(raw, "images", "photos");
  const imageUrls = Array.isArray(images) ? images.filter((u): u is string => typeof u === "string") : [];

  const title = [buildingName, propertyTypeRaw, bedrooms ? `${bedrooms}BR` : undefined]
    .filter(Boolean)
    .join(" — ") || `Property in ${cityName}`;

  return {
    vroduxPropertyId: id,
    title,
    description: description ?? address,
    propertyType: mapPropertyType(propertyTypeRaw),
    listingType: mapPurposeToListingType(purpose),
    bedrooms,
    areaSqft,
    priceAed,
    rawPriceLabel: priceLabel ?? (typeof priceRaw === "string" ? priceRaw : undefined),
    cityName,
    emirate,
    images: imageUrls,
  };
}

/** Vrodux image URLs are signed and expire — never cache/store one beyond the pull that
 * returned it. We store whatever the latest pull gave us and just overwrite on the next
 * pull; we never treat a stored URL as long-lived. */
async function resolveArea(cityName: string, emirate: string) {
  const slug = slugify(cityName) || "dubai";
  return db.area.upsert({
    where: { slug },
    update: {},
    create: { slug, name: cityName, city: cityName, emirate },
  });
}

/** Synced listings need an Agent to attach to (Listing.agentId is required) but arrive
 * with no specific Qasro agent — attributed to the agency's own admin agent, the one
 * created at self-serve registration (see agencies/actions.ts registerAgency). */
async function resolveSyncOwnerAgent(agencyId: string) {
  const admin = await db.agent.findFirst({
    where: { agencyId, user: { role: "AGENCY_ADMIN" } },
    orderBy: { createdAt: "asc" },
  });
  if (admin) return admin;
  return db.agent.findFirst({ where: { agencyId }, orderBy: { createdAt: "asc" } });
}

export type SyncResult = { pulled: number; upserted: number; delisted: number };

/** Pulls, upserts, and delists one agency's Vrodux-synced listings. Never throws for
 * ordinary transient failures — caller (the cron route) records the outcome on the
 * VroduxConnection row instead, per docs/ARCHITECTURE.md §7.2. */
export async function syncAgencyListings(connectionId: string): Promise<SyncResult> {
  const connection = await db.vroduxConnection.findUnique({ where: { id: connectionId } });
  if (!connection || connection.status !== "CONNECTED" || connection.reconnectNeeded) {
    return { pulled: 0, upserted: 0, delisted: 0 };
  }
  if (!connection.apiKey || !connection.listingsApiBaseUrl) {
    return { pulled: 0, upserted: 0, delisted: 0 };
  }

  const pullStartedAt = new Date();

  try {
    const properties = await fetchVroduxProperties(connection.listingsApiBaseUrl, connection.apiKey);
    const owner = await resolveSyncOwnerAgent(connection.agencyId);
    if (!owner) {
      await recordPullOutcome(connectionId, "error", "No agent exists to attribute synced listings to.");
      return { pulled: properties.length, upserted: 0, delisted: 0 };
    }

    let upserted = 0;
    for (const raw of properties) {
      const mapped = mapVroduxProperty(raw);
      if (!mapped) continue;
      await upsertSyncedListing(connection.agencyId, connectionId, owner.id, mapped, pullStartedAt);
      upserted++;
    }

    const delisted = await delistMissing(connectionId, pullStartedAt);

    await recordPullOutcome(connectionId, "ok");
    return { pulled: properties.length, upserted, delisted };
  } catch (err) {
    if (err instanceof VroduxUnauthorizedError) {
      await db.vroduxConnection.update({
        where: { id: connectionId },
        data: { reconnectNeeded: true },
      });
      await recordPullOutcome(connectionId, "reconnect_needed", err.message);
      return { pulled: 0, upserted: 0, delisted: 0 };
    }

    await recordPullOutcome(connectionId, "error", err instanceof Error ? err.message : "unknown error");
    return { pulled: 0, upserted: 0, delisted: 0 };
  }
}

async function recordPullOutcome(connectionId: string, status: string, error?: string): Promise<void> {
  await db.vroduxConnection.update({
    where: { id: connectionId },
    data: { lastPulledAt: new Date(), lastPullStatus: status, lastPullError: error ?? null },
  });
}

async function upsertSyncedListing(
  agencyId: string,
  connectionId: string,
  agentId: string,
  mapped: MappedListing,
  seenAt: Date,
): Promise<void> {
  const area = await resolveArea(mapped.cityName, mapped.emirate);

  const existing = await db.vroduxSyncedListing.findUnique({
    where: { connectionId_vroduxPropertyId: { connectionId, vroduxPropertyId: mapped.vroduxPropertyId } },
    include: { listing: true },
  });

  const priceField =
    mapped.listingType === "RENT" ? { askingRentAedYear: mapped.priceAed } : { askingPriceAed: mapped.priceAed };

  if (existing) {
    await db.property.update({
      where: { id: existing.listing.propertyId },
      data: {
        type: mapped.propertyType,
        bedrooms: mapped.bedrooms,
        areaSqft: mapped.areaSqft,
        areaId: area.id,
      },
    });
    await db.listing.update({
      where: { id: existing.listingId },
      data: {
        title: mapped.title,
        description: mapped.description,
        type: mapped.listingType,
        status: "ACTIVE",
        images: mapped.images,
        ...priceField,
      },
    });
    await db.vroduxSyncedListing.update({
      where: { id: existing.id },
      data: { lastSeenAt: seenAt, rawPriceLabel: mapped.rawPriceLabel },
    });
    return;
  }

  const property = await db.property.create({
    data: {
      type: mapped.propertyType,
      bedrooms: mapped.bedrooms,
      areaSqft: mapped.areaSqft,
      areaId: area.id,
    },
  });

  const listing = await db.listing.create({
    data: {
      propertyId: property.id,
      title: mapped.title,
      description: mapped.description,
      type: mapped.listingType,
      status: "ACTIVE",
      images: mapped.images,
      agentId,
      agencyId,
      ...priceField,
    },
  });

  await db.vroduxSyncedListing.create({
    data: {
      connectionId,
      vroduxPropertyId: mapped.vroduxPropertyId,
      listingId: listing.id,
      lastSeenAt: seenAt,
      rawPriceLabel: mapped.rawPriceLabel,
    },
  });
}

/** A synced listing not seen in the latest pull means the agency un-published it on
 * Vrodux (or it no longer exists) — withdraw it on Qasro too rather than leaving it
 * live forever (docs/ARCHITECTURE.md §7.2). We keep the join row (rather than deleting
 * it) so if the same property reappears later we reactivate the same Listing instead
 * of creating a duplicate. */
async function delistMissing(connectionId: string, pullStartedAt: Date): Promise<number> {
  const stale = await db.vroduxSyncedListing.findMany({
    where: { connectionId, lastSeenAt: { lt: pullStartedAt } },
    include: { listing: true },
  });

  for (const row of stale) {
    if (row.listing.status !== "WITHDRAWN") {
      await db.listing.update({ where: { id: row.listingId }, data: { status: "WITHDRAWN" } });
    }
  }

  return stale.length;
}

/** Entry point for the scheduled sync (see /api/cron/vrodux-sync). */
export async function syncAllConnectedAgencies(): Promise<Record<string, SyncResult>> {
  const connections = await db.vroduxConnection.findMany({
    where: { status: "CONNECTED", reconnectNeeded: false },
    select: { id: true },
  });

  const results: Record<string, SyncResult> = {};
  for (const { id } of connections) {
    results[id] = await syncAgencyListings(id);
  }
  return results;
}
