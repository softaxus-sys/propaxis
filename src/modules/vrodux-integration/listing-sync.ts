/**
 * Field mapping for Vrodux's /properties response — CONFIRMED against a real payload
 * from erp.vrodux.com on 2026-09-30 (agency cmumxxxdd0000kz040swh8fz5), not guesswork.
 * See the shape documented at the top of listing-sync-client.ts.
 *
 * One Vrodux "property" is a BUILDING that can contain several vacant units
 * (`property.units`). It maps to ONE Qasro Listing, with its units as child
 * ListingUnit rows:
 *   Vrodux property  → Qasro Building + one Property + one Listing (the card/page)
 *   Vrodux unit      → ListingUnit on that listing, keyed by the Vrodux unit id
 * (An earlier version made a Property + Listing per unit, so a building with 8 vacant
 * apartments showed up as 8 listings — scripts/merge-vrodux-unit-listings.ts folds
 * those legacy rows back into one.)
 *
 * Image URLs are RELATIVE and signed+expiring (`?exp=...&sig=...`) — we host-prefix
 * them for storage but never treat a stored URL as long-lived; a fresh pull always
 * overwrites them with whatever Vrodux currently signs.
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
  vroduxUnitId: string;
  unitNumber?: string;
  propertyType: PropertyType;
  rentPerYearAed?: number;
  salePriceAed?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  floor?: number;
  furnishing?: string;
  view?: string;
  parking?: number;
};

/** A unit is only publishable with a usable price — rentPerYear and/or salePrice above
 * 0 (a unit can be either, or both). One with neither is skipped rather than shown
 * with a blank/zero price. */
function mapVroduxUnit(property: VroduxProperty, unit: VroduxUnit): MappedUnit | null {
  if (!unit.id) return null;

  const salePriceAed = typeof unit.salePrice === "number" && unit.salePrice > 0 ? unit.salePrice : undefined;
  const rentPerYearAed = typeof unit.rentPerYear === "number" && unit.rentPerYear > 0 ? unit.rentPerYear : undefined;
  if (salePriceAed === undefined && rentPerYearAed === undefined) return null;

  return {
    vroduxUnitId: unit.id,
    unitNumber: unit.unitNumber ?? undefined,
    propertyType: mapPropertyType(unit.unitType, property.propertyType),
    rentPerYearAed,
    salePriceAed,
    bedrooms: unit.bedrooms ?? undefined,
    bathrooms: unit.bathrooms ?? undefined,
    areaSqft: unit.area && unit.area > 0 ? unit.area : undefined,
    floor: typeof unit.floor === "number" ? Math.round(unit.floor) : undefined,
    furnishing: unit.furnishing?.trim() || undefined,
    view: unit.view?.trim() || undefined,
    parking: unit.parking ?? undefined,
  };
}

/** What the Listing row itself carries for a building: its title, cover and headline
 * price (the lowest unit price per type). Listing.type is the type with more units
 * (rent wins ties) — search and the card look at the units themselves, so this only
 * drives the badge and consumers that predate units. */
function summarizeBuildingListing(property: VroduxProperty, units: MappedUnit[]) {
  const rents = units.filter((u) => u.rentPerYearAed !== undefined);
  const sales = units.filter((u) => u.salePriceAed !== undefined);
  const listingType: "SALE" | "RENT" = rents.length >= sales.length ? "RENT" : "SALE";

  const minRent = rents.length ? Math.min(...rents.map((u) => u.rentPerYearAed as number)) : null;
  const minSale = sales.length ? Math.min(...sales.map((u) => u.salePriceAed as number)) : null;

  // `images` is the newer field name, `imageUrls` the one confirmed on 2026-09-30.
  const images = (property.images ?? property.imageUrls ?? []).map(toAbsoluteImageUrl);

  return {
    title: property.name?.trim() || `Vrodux property ${property.reference ?? property.id}`,
    description: property.description?.trim() || undefined,
    listingType,
    askingRentAedYear: minRent,
    askingPriceAed: minSale,
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

    // upserted counts listings (buildings), not units.
    let upserted = 0;
    for (const property of properties) {
      if (!property.id) continue;
      const area = await resolveArea(property.city?.trim() || "Dubai", property.emirate?.trim() || "Dubai");
      const building = await resolveBuilding(property, area.id);
      const units = (property.units ?? []).map((u) => mapVroduxUnit(property, u)).filter((u): u is MappedUnit => !!u);

      await upsertSyncedBuildingListing(
        connection.agencyId,
        connectionId,
        owner.id,
        building.id,
        area.id,
        property,
        units,
        pullStartedAt,
      );
      upserted++;
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

/** One Vrodux property → one Listing (+ its Property and join row), with the vacant
 * units reconciled as child rows. Matching is on the Vrodux property id and, inside it,
 * the Vrodux unit id, so re-running never duplicates anything. */
async function upsertSyncedBuildingListing(
  agencyId: string,
  connectionId: string,
  agentId: string,
  buildingId: string,
  areaId: string,
  property: VroduxProperty,
  units: MappedUnit[],
  seenAt: Date,
): Promise<void> {
  const summary = summarizeBuildingListing(property, units);
  // A single-unit building should read as a normal single listing, so the unit's own
  // specs go on the Property; a multi-unit one has no single bedroom count.
  const single = units.length === 1 ? units[0] : undefined;
  const propertyData = {
    type: single ? single.propertyType : mapPropertyType(null, property.propertyType),
    bedrooms: single?.bedrooms ?? null,
    bathrooms: single?.bathrooms ?? null,
    areaSqft: single?.areaSqft ?? null,
    unitNumber: single?.unitNumber ?? null,
    addressLine: property.address?.trim() || null,
    areaId,
    buildingId,
  };
  // No vacant, priced units → nothing to show; keep the row (the property is still in
  // the feed) but hide it until units come back.
  const status = units.length > 0 ? ("ACTIVE" as const) : ("WITHDRAWN" as const);
  const listingData = {
    title: summary.title,
    description: summary.description,
    type: summary.listingType,
    status,
    images: summary.images,
    askingRentAedYear: summary.askingRentAedYear,
    askingPriceAed: summary.askingPriceAed,
  };

  const existing = await db.vroduxSyncedListing.findUnique({
    where: { connectionId_vroduxPropertyId: { connectionId, vroduxPropertyId: property.id } },
    include: { listing: true },
  });

  let listingId: string;
  if (existing) {
    listingId = existing.listingId;
    await db.property.update({ where: { id: existing.listing.propertyId }, data: propertyData });
    await db.listing.update({ where: { id: listingId }, data: listingData });
    await db.vroduxSyncedListing.update({ where: { id: existing.id }, data: { lastSeenAt: seenAt } });
  } else {
    const created = await db.property.create({ data: propertyData });
    const listing = await db.listing.create({
      data: {
        ...listingData,
        propertyId: created.id,
        agentId,
        agencyId,
        // Matches what a manually-published listing gets (listings/actions.ts) — without
        // this, every synced listing sorts last in every publishedAt-desc query (search,
        // homepage featured, agent/area pages), since null sorts after any real date.
        publishedAt: new Date(),
      },
    });
    listingId = listing.id;
    await db.vroduxSyncedListing.create({
      data: { connectionId, vroduxPropertyId: property.id, listingId, lastSeenAt: seenAt },
    });
  }

  for (const unit of units) {
    const data = {
      unitNumber: unit.unitNumber ?? null,
      propertyType: unit.propertyType,
      rentPerYearAed: unit.rentPerYearAed ?? null,
      salePriceAed: unit.salePriceAed ?? null,
      bedrooms: unit.bedrooms ?? null,
      bathrooms: unit.bathrooms ?? null,
      areaSqft: unit.areaSqft ?? null,
      floor: unit.floor ?? null,
      furnishing: unit.furnishing ?? null,
      view: unit.view ?? null,
      parking: unit.parking ?? null,
      active: true,
      lastSeenAt: seenAt,
    };
    await db.listingUnit.upsert({
      where: { listingId_vroduxUnitId: { listingId, vroduxUnitId: unit.vroduxUnitId } },
      update: data,
      create: { listingId, vroduxUnitId: unit.vroduxUnitId, ...data },
    });
  }

  // Units that left the feed are hidden, not deleted, so one that comes back reuses its row.
  await db.listingUnit.updateMany({
    where: { listingId, active: true, lastSeenAt: { lt: seenAt } },
    data: { active: false },
  });
}

/** A synced listing not seen in the latest pull means the agency un-published the
 * property on Vrodux (or it no longer exists) — withdraw it and hide its units on Qasro
 * too rather than leaving it live forever (docs/ARCHITECTURE.md §7.2). We keep the join
 * row (rather than deleting it) so if the same property reappears later we reactivate
 * the same Listing instead of creating a duplicate. */
async function delistMissing(connectionId: string, pullStartedAt: Date): Promise<number> {
  const stale = await db.vroduxSyncedListing.findMany({
    where: { connectionId, lastSeenAt: { lt: pullStartedAt } },
    include: { listing: true },
  });

  for (const row of stale) {
    if (row.listing.status !== "WITHDRAWN") {
      await db.listing.update({ where: { id: row.listingId }, data: { status: "WITHDRAWN" } });
    }
    await db.listingUnit.updateMany({ where: { listingId: row.listingId, active: true }, data: { active: false } });
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
