/**
 * One-off: merge the per-UNIT listings an earlier Vrodux sync created back into ONE
 * listing per Vrodux property (building), with the units as ListingUnit rows.
 *
 * Old synced rows were keyed `${vroduxPropertyId}:${vroduxUnitId}` (see git history of
 * modules/vrodux-integration/listing-sync.ts), so the original property id IS stored and
 * grouping is exact: connection + the part before the colon. No fuzzy name/city matching
 * is done; instead, groups that look inconsistent are REPORTED and left untouched.
 *
 *   npx tsx scripts/merge-vrodux-unit-listings.ts            # dry run (default), changes nothing
 *   npx tsx scripts/merge-vrodux-unit-listings.ts --apply    # perform the merge
 *
 * Safe to re-run: merged rows no longer carry a colon key, so a second run finds nothing.
 * Run it after the listing_units migration is applied. If the new sync already ran and
 * created a building-level listing for a property, that listing is the survivor.
 *
 * Per group: the survivor gains one ListingUnit per legacy listing (carrying over unit
 * number, beds/baths/area, price, active state); leads, viewings and saved-property
 * rows of the other listings are moved to the survivor; the other listings (and their
 * now-orphan Property rows) are deleted. Floor/furnishing/view/parking were never
 * stored, so they fill in on the next sync. The next sync also normalises the
 * survivor's title, cover images and Property fields.
 */
import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";

const db = new PrismaClient();
const APPLY = process.argv.includes("--apply");

type LegacyRow = Prisma.VroduxSyncedListingGetPayload<{
  include: { listing: { include: { property: { include: { building: true } } } } };
}>;

function splitKey(key: string): { propertyId: string; unitId: string } | null {
  const i = key.indexOf(":");
  if (i <= 0 || i === key.length - 1) return null;
  return { propertyId: key.slice(0, i), unitId: key.slice(i + 1) };
}

async function main() {
  console.log(APPLY ? "APPLY mode — changes will be written.\n" : "DRY RUN — nothing will be changed (pass --apply to merge).\n");

  const rows: LegacyRow[] = await db.vroduxSyncedListing.findMany({
    where: { vroduxPropertyId: { contains: ":" } },
    include: { listing: { include: { property: { include: { building: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  const unsure: string[] = [];
  const groups = new Map<string, { connectionId: string; propertyId: string; rows: (LegacyRow & { unitId: string })[] }>();
  for (const row of rows) {
    const parts = splitKey(row.vroduxPropertyId);
    if (!parts) {
      unsure.push(`row ${row.id} (listing ${row.listingId}): unparseable key "${row.vroduxPropertyId}" — left untouched`);
      continue;
    }
    const key = `${row.connectionId}|${parts.propertyId}`;
    const g = groups.get(key) ?? { connectionId: row.connectionId, propertyId: parts.propertyId, rows: [] };
    g.rows.push({ ...row, unitId: parts.unitId });
    groups.set(key, g);
  }

  let merged = 0;
  let listingsRemoved = 0;
  for (const g of groups.values()) {
    const label = `connection ${g.connectionId} / Vrodux property ${g.propertyId}`;

    // Consistency checks — anything odd is reported, never merged silently.
    const agencyIds = new Set(g.rows.map((r) => r.listing.agencyId));
    const expectedBuilding = `vrodux-${g.propertyId}`;
    const wrongBuilding = g.rows.filter((r) => r.listing.property.building?.slug !== expectedBuilding);
    const areas = new Set(g.rows.map((r) => r.listing.property.areaId));
    if (agencyIds.size > 1 || wrongBuilding.length > 0 || areas.size > 1) {
      unsure.push(
        `${label}: ${g.rows.length} listings but ${agencyIds.size} agencies / ${areas.size} areas / ${wrongBuilding.length} not in building "${expectedBuilding}" — left untouched`,
      );
      continue;
    }

    // Survivor: an already-created building-level listing if the new sync ran first,
    // otherwise the oldest legacy listing.
    const existingBuildingRow = await db.vroduxSyncedListing.findUnique({
      where: { connectionId_vroduxPropertyId: { connectionId: g.connectionId, vroduxPropertyId: g.propertyId } },
    });
    const survivorListingId = existingBuildingRow?.listingId ?? g.rows[0].listingId;
    const survivorIsLegacy = !existingBuildingRow;
    const others = g.rows.filter((r) => r.listingId !== survivorListingId);

    console.log(
      `${label}: ${g.rows.length} unit listings → 1 (survivor ${survivorListingId}${survivorIsLegacy ? ", oldest legacy" : ", existing building listing"}); ${others.length} listing(s) to remove`,
    );
    if (!APPLY) {
      merged++;
      listingsRemoved += others.length;
      continue;
    }

    await db.$transaction(
      async (tx) => {
        // 1. Units from every legacy listing (survivor's own included).
        for (const r of g.rows) {
          const l = r.listing;
          const data = {
            unitNumber: l.property.unitNumber,
            propertyType: l.property.type,
            rentPerYearAed: l.type === "RENT" ? l.askingRentAedYear : null,
            salePriceAed: l.type === "SALE" ? l.askingPriceAed : null,
            bedrooms: l.property.bedrooms,
            bathrooms: l.property.bathrooms,
            areaSqft: l.property.areaSqft,
            active: l.status === "ACTIVE",
            lastSeenAt: r.lastSeenAt,
          };
          await tx.listingUnit.upsert({
            where: { listingId_vroduxUnitId: { listingId: survivorListingId, vroduxUnitId: r.unitId } },
            update: {},
            create: { listingId: survivorListingId, vroduxUnitId: r.unitId, ...data },
          });
        }

        // 2. Move dependants off the listings being removed, then remove them.
        const survivor = await tx.listing.findUniqueOrThrow({ where: { id: survivorListingId } });
        for (const r of others) {
          await tx.lead.updateMany({ where: { listingId: r.listingId }, data: { listingId: survivorListingId } });
          await tx.viewing.updateMany({ where: { listingId: r.listingId }, data: { listingId: survivorListingId } });

          const propertyId = r.listing.propertyId;
          const existingSaves = new Set(
            (await tx.savedProperty.findMany({ where: { propertyId: survivor.propertyId }, select: { userId: true } })).map((s) => s.userId),
          );
          const saves = await tx.savedProperty.findMany({ where: { propertyId } });
          for (const s of saves) {
            if (existingSaves.has(s.userId)) await tx.savedProperty.delete({ where: { id: s.id } });
            else {
              await tx.savedProperty.update({ where: { id: s.id }, data: { propertyId: survivor.propertyId } });
              existingSaves.add(s.userId);
            }
          }

          await tx.listing.delete({ where: { id: r.listingId } }); // cascades the sync row and units
          const stillUsed =
            (await tx.listing.count({ where: { propertyId } })) +
            (await tx.transaction.count({ where: { propertyId } })) +
            (await tx.rentalTransaction.count({ where: { propertyId } })) +
            (await tx.valuation.count({ where: { propertyId } })) +
            (await tx.propertyHistory.count({ where: { propertyId } })) +
            (await tx.verification.count({ where: { propertyId } }));
          if (stillUsed === 0) await tx.property.delete({ where: { id: propertyId } });
        }

        // 3. Make the survivor a building-level listing.
        const units = await tx.listingUnit.findMany({ where: { listingId: survivorListingId, active: true } });
        const rents = units.filter((u) => u.rentPerYearAed !== null).map((u) => Number(u.rentPerYearAed));
        const sales = units.filter((u) => u.salePriceAed !== null).map((u) => Number(u.salePriceAed));
        const building = g.rows[0].listing.property.building;
        await tx.listing.update({
          where: { id: survivorListingId },
          data: {
            title: building?.name ?? survivor.title,
            type: rents.length >= sales.length ? "RENT" : "SALE",
            askingRentAedYear: rents.length ? Math.min(...rents) : null,
            askingPriceAed: sales.length ? Math.min(...sales) : null,
            ...(units.length > 0 ? { status: "ACTIVE" as const } : {}),
          },
        });
        if (units.length > 1) {
          await tx.property.update({
            where: { id: survivor.propertyId },
            data: { bedrooms: null, bathrooms: null, areaSqft: null, unitNumber: null },
          });
        }
        if (survivorIsLegacy) {
          await tx.vroduxSyncedListing.update({
            where: { listingId: survivorListingId },
            data: { vroduxPropertyId: g.propertyId },
          });
        }
      },
      { timeout: 60_000 },
    );
    merged++;
    listingsRemoved += others.length;
  }

  console.log(`\n${APPLY ? "Merged" : "Would merge"} ${merged} building(s); ${APPLY ? "removed" : "would remove"} ${listingsRemoved} duplicate listing(s).`);
  if (unsure.length > 0) {
    console.log(`\n${unsure.length} group(s) NOT merged — review manually:`);
    for (const line of unsure) console.log(`  - ${line}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
