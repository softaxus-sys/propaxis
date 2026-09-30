/**
 * Field mapping for Vrodux's /properties response — CONFIRMED against a real payload
 * from erp.vrodux.com on 2026-09-30 (agency cmumxxxdd0000kz040swh8fz5), not guesswork.
 * See the shape documented at the top of listing-sync-client.ts.
 *
 * One Vrodux "property" is a BUILDING that can contain several units (`property.units`)
 * — e.g. one tower with a handful of published apartments — not a flat one-row-per-
 * listing shape. That maps onto this schema's existing Building → Property → Listing
 * hierarchy far better than treating each Vrodux property as one Qasro Property would:
 *   Vrodux property  → Qasro Building (the physical tower/building)
 *   Vrodux unit      → Qasro Property (the physical unit) + Listing (the commercial offer)
 *
 * Image URLs (`imageUrls`) are RELATIVE and signed+expiring (`?exp=...&sig=...`) — we
 * host-prefix them for storage but never treat a stored URL as long-lived; a fresh pull
 * always overwrites them with whatever Vrodux currently signs.
 */

import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { PropertyType } from "@prisma/client";
import {
  fetchVroduxProperties,
  vroduxApiHost,
  VroduxUnauthorizedError,
  type VroduxProperty,
  type VroduxUnit,
} from "./listing-sync-client";

function toAbsoluteImageUrl(url: string): string {
  return url.startsWith("http") ? url : `${vroduxApiHost()}${url}`;
}

const UNIT_TYPE_MAP: Record<string, PropertyType> = {
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

function mapPropertyType(unitType: string | null | undefined, propertyType: string | null | undefined): PropertyType {
  const fromUnit = unitType ? UNIT_TYPE_MAP[unitType.trim().toLowerCase()] : undefined;
  if (fromUnit) return fromUnit;
  const fromProperty = propertyType ? UNIT_TYPE_MAP[propertyType.trim().toLowerCase()] : undefined;
  return fromProperty ?? "OTHER";
}

type MappedUnit = {
  vroduxPropertyId: string; // `${property.id}:${unit.id}` — see upsertSyncedListing
  title: string;
  description?: string;
  propertyType: PropertyType;
  listingType: "SALE" | "RENT";
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  unitNumber?: string;
  priceAed?: number;
  cityName: string;
  emirate: string;
  addressLine?: string;
  images: string[];
};

/** One Vrodux unit only becomes a listing if it has a usable price — a unit with
 * neither a sale price nor a rent set isn't something we can publish as a priced
 * listing, so it's skipped rather than synced with a blank/zero price. */
function mapVroduxUnit(property: VroduxProperty, unit: VroduxUnit): MappedUnit | null {
  if (!unit.id) return null;

  const salePrice = typeof unit.salePrice === "number" && unit.salePrice > 0 ? unit.salePrice : undefined;
  const rent = typeof unit.rentPerYear === "number" && unit.rentPerYear > 0 ? unit.rentPerYear : undefined;
  if (salePrice === undefined && rent === undefined) return null;

  const listingType: "SALE" | "RENT" = salePrice !== undefined ? "SALE" : "RENT";
  const priceAed = listingType === "SALE" ? salePrice : rent;

  const buildingName = property.name?.trim();
  const titleParts = [buildingName, unit.unitType, unit.bedrooms ? `${unit.bedrooms}BR` : undefined].filter(Boolean);
  const title = titleParts.length ? titleParts.join(" — ") : `Unit ${unit.unitNumber ?? unit.id}`;

  const images = (property.imageUrls ?? []).map(toAbsoluteImageUrl);

  return {
    vroduxPropertyId: `${property.id}:${unit.id}`,
    title,
    description: property.description?.trim() || undefined,
    propertyType: mapPropertyType(unit.unitType, property.propertyType),
    listingType,
    bedrooms: unit.bedrooms ?? undefined,
    bathrooms: unit.bathrooms ?? undefined,
    areaSqft: unit.area && unit.area > 0 ? unit.area : undefined,
    unitNumber: unit.unitNumber ?? undefined,
    priceAed,
    cityName: property.city?.trim() || "Dubai",
    emirate: property.emirate?.trim() || "Dubai",
    addressLine: property.address?.trim() || undefined,
    images,
  };
}

async function resolveArea(cityName: string, emirate: string) {
  const slug = slugify(cityName) || "dubai";
  return db.area.upsert({
    where: { slug },
    update: {},
    create: { slug, name: cityName, city: cityName, emirate },
  });
}

/** Keyed on Vrodux's own property id (globally unique, stable) rather than on name —
 * two different towers can share a name, and a tower can be renamed on Vrodux's side
 * without us losing track of it. */
async function resolveBuilding(property: VroduxProperty, areaId: string) {
  const slug = `vrodux-${property.id}`;
  const name = property.name?.trim() || `Vrodux property ${property.reference ?? property.id}`;
  return db.building.upsert({
    where: { slug },
    update: { name, areaId },
    create: { slug, name, areaId },
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
export type SyncTrigger = "cron" | "sync_now" | "manual";

/** Pulls, upserts, and delists one agency's Vrodux-synced listings. Never throws for
 * ordinary transient failures — caller (the cron/sync-now routes) reads the outcome off
 * the VroduxConnection row instead, per docs/ARCHITECTURE.md §7.2.
 *
 * `trigger` is recorded on the connection row purely for diagnosis — it's the
 * difference between "sync-now never got called" and "sync-now ran fine but Vrodux's
 * own /properties response wasn't updated yet" being directly queryable instead of
 * requiring log archaeology (see the field's comment in schema.prisma). */
export async function syncAgencyListings(connectionId: string, trigger: SyncTrigger = "manual"): Promise<SyncResult> {
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
      await recordPullOutcome(connectionId, "error", trigger, "No agent exists to attribute synced listings to.");
      return { pulled: properties.length, upserted: 0, delisted: 0 };
    }

    let upserted = 0;
    for (const property of properties) {
      const area = await resolveArea(property.city?.trim() || "Dubai", property.emirate?.trim() || "Dubai");
      const building = await resolveBuilding(property, area.id);

      for (const unit of property.units ?? []) {
        const mapped = mapVroduxUnit(property, unit);
        if (!mapped) continue;
        await upsertSyncedListing(connection.agencyId, connectionId, owner.id, building.id, area.id, mapped, pullStartedAt);
        upserted++;
      }
    }

    const delisted = await delistMissing(connectionId, pullStartedAt);

    await recordPullOutcome(connectionId, "ok", trigger);
    console.log(
      `[vrodux-sync] agency=${connection.agencyId} trigger=${trigger} pulled=${properties.length} upserted=${upserted} delisted=${delisted}`,
    );
    return { pulled: properties.length, upserted, delisted };
  } catch (err) {
    if (err instanceof VroduxUnauthorizedError) {
      await db.vroduxConnection.update({
        where: { id: connectionId },
        data: { reconnectNeeded: true },
      });
      await recordPullOutcome(connectionId, "reconnect_needed", trigger, err.message);
      return { pulled: 0, upserted: 0, delisted: 0 };
    }

    await recordPullOutcome(connectionId, "error", trigger, err instanceof Error ? err.message : "unknown error");
    return { pulled: 0, upserted: 0, delisted: 0 };
  }
}

async function recordPullOutcome(connectionId: string, status: string, trigger: SyncTrigger, error?: string): Promise<void> {
  await db.vroduxConnection.update({
    where: { id: connectionId },
    data: { lastPulledAt: new Date(), lastPullStatus: status, lastPullTrigger: trigger, lastPullError: error ?? null },
  });
}

async function upsertSyncedListing(
  agencyId: string,
  connectionId: string,
  agentId: string,
  buildingId: string,
  areaId: string,
  mapped: MappedUnit,
  seenAt: Date,
): Promise<void> {
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
        bathrooms: mapped.bathrooms,
        areaSqft: mapped.areaSqft,
        unitNumber: mapped.unitNumber,
        addressLine: mapped.addressLine,
        areaId,
        buildingId,
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
        askingPriceAed: null,
        askingRentAedYear: null,
        ...priceField,
      },
    });
    await db.vroduxSyncedListing.update({ where: { id: existing.id }, data: { lastSeenAt: seenAt } });
    return;
  }

  const property = await db.property.create({
    data: {
      type: mapped.propertyType,
      bedrooms: mapped.bedrooms,
      bathrooms: mapped.bathrooms,
      areaSqft: mapped.areaSqft,
      unitNumber: mapped.unitNumber,
      addressLine: mapped.addressLine,
      areaId,
      buildingId,
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
    },
  });
}

/** A synced listing not seen in the latest pull means the agency un-published it on
 * Vrodux (or it no longer exists) — withdraw it on Qasro too rather than leaving it
 * live forever (docs/ARCHITECTURE.md §7.2). We keep the join row (rather than deleting
 * it) so if the same unit reappears later we reactivate the same Listing instead of
 * creating a duplicate. */
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

/** Entry point for the scheduled sync (see /api/cron/vrodux-sync) and the on-demand
 * one (/api/internal/agencies/{id}/sync-now calls syncAgencyListings directly). */
export async function syncAllConnectedAgencies(): Promise<Record<string, SyncResult>> {
  const connections = await db.vroduxConnection.findMany({
    where: { status: "CONNECTED", reconnectNeeded: false },
    select: { id: true },
  });

  const results: Record<string, SyncResult> = {};
  for (const { id } of connections) {
    results[id] = await syncAgencyListings(id, "cron");
  }
  return results;
}
