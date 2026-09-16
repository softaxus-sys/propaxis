/**
 * Local development seed data. Every row is explicitly flagged `isDemoData: true`
 * (or is a seed-only account) — this is illustrative UAE-shaped data for building
 * and testing against, never real listings/transactions. See docs/ARCHITECTURE.md §6.
 */
import { PrismaClient, PropertyType, ListingType, ListingStatus, CompletionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // ---- Areas ----------------------------------------------------------
  const marina = await db.area.upsert({
    where: { slug: "dubai-marina" },
    update: {},
    create: { slug: "dubai-marina", name: "Dubai Marina", city: "Dubai", lat: 25.0805, lng: 55.1403 },
  });
  const downtown = await db.area.upsert({
    where: { slug: "downtown-dubai" },
    update: {},
    create: { slug: "downtown-dubai", name: "Downtown Dubai", city: "Dubai", lat: 25.1972, lng: 55.2744 },
  });
  const businessBay = await db.area.upsert({
    where: { slug: "business-bay" },
    update: {},
    create: { slug: "business-bay", name: "Business Bay", city: "Dubai", lat: 25.1859, lng: 55.2734 },
  });
  const jvc = await db.area.upsert({
    where: { slug: "jvc" },
    update: {},
    create: { slug: "jvc", name: "Jumeirah Village Circle", city: "Dubai", lat: 25.0587, lng: 55.2107 },
  });
  const palm = await db.area.upsert({
    where: { slug: "palm-jumeirah" },
    update: {},
    create: { slug: "palm-jumeirah", name: "Palm Jumeirah", city: "Dubai", lat: 25.1124, lng: 55.139 },
  });
  const ranches = await db.area.upsert({
    where: { slug: "arabian-ranches" },
    update: {},
    create: { slug: "arabian-ranches", name: "Arabian Ranches", city: "Dubai", lat: 25.0396, lng: 55.2708 },
  });

  // ---- Developer & Buildings -------------------------------------------
  const developer = await db.developer.upsert({
    where: { slug: "meridian-properties" },
    update: {},
    create: {
      slug: "meridian-properties",
      name: "Meridian Properties",
      description: "Demo developer profile for seed data.",
      isVerified: true,
      isDemoData: true,
    },
  });

  const marinaTower = await db.building.upsert({
    where: { slug: "marina-promenade" },
    update: {},
    create: {
      slug: "marina-promenade",
      name: "Marina Promenade",
      areaId: marina.id,
      developerId: developer.id,
      totalFloors: 32,
      yearBuilt: 2012,
      amenities: ["Gym", "Pool", "Covered Parking", "24/7 Security"],
      isDemoData: true,
    },
  });

  // ---- Agency, Agent, User ---------------------------------------------
  const agency = await db.agency.upsert({
    where: { slug: "horizon-realty" },
    update: {},
    create: {
      slug: "horizon-realty",
      name: "Horizon Realty",
      description: "Demo agency profile for seed data.",
      isVerified: true,
      isDemoData: true,
    },
  });

  const agentUser = await db.user.upsert({
    where: { email: "agent@propaxis.dev" },
    update: {},
    create: {
      name: "Sara Al Mansoori",
      email: "agent@propaxis.dev",
      passwordHash,
      role: "AGENT",
    },
  });

  const agent = await db.agent.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: {
      userId: agentUser.id,
      slug: "sara-al-mansoori",
      bio: "Demo agent profile — specialises in Dubai Marina and Downtown Dubai.",
      languages: ["en", "ar"],
      agencyId: agency.id,
      isVerified: true,
      isDemoData: true,
    },
  });

  const agencyAdminUser = await db.user.upsert({
    where: { email: "agency-admin@propaxis.dev" },
    update: {},
    create: { name: "Omar Hassan", email: "agency-admin@propaxis.dev", passwordHash, role: "AGENCY_ADMIN" },
  });
  await db.agent.upsert({
    where: { userId: agencyAdminUser.id },
    update: {},
    create: {
      userId: agencyAdminUser.id,
      slug: "omar-hassan",
      bio: "Demo agency admin profile for Horizon Realty.",
      languages: ["en", "ar"],
      agencyId: agency.id,
      isVerified: true,
      isDemoData: true,
    },
  });

  await db.user.upsert({
    where: { email: "demo@propaxis.dev" },
    update: {},
    create: { name: "Demo User", email: "demo@propaxis.dev", passwordHash, role: "USER" },
  });

  const adminUser = await db.user.upsert({
    where: { email: "admin@propaxis.dev" },
    update: {},
    create: { name: "Admin", email: "admin@propaxis.dev", passwordHash, role: "ADMIN" },
  });
  await db.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: { userId: adminUser.id },
  });

  const developerUser = await db.user.upsert({
    where: { email: "developer@propaxis.dev" },
    update: {},
    create: { name: "Layla Khan", email: "developer@propaxis.dev", passwordHash, role: "DEVELOPER" },
  });
  await db.developerTeamMember.upsert({
    where: { userId_developerId: { userId: developerUser.id, developerId: developer.id } },
    update: {},
    create: { userId: developerUser.id, developerId: developer.id },
  });

  // ---- Properties + Listings --------------------------------------------
  type Seed = {
    areaId: string;
    buildingId?: string;
    type: PropertyType;
    bedrooms: number;
    bathrooms: number;
    areaSqft: number;
    title: string;
    listingType: ListingType;
    askingPriceAed?: number;
    askingRentAedYear?: number;
  };

  const seeds: Seed[] = [
    { areaId: marina.id, buildingId: marinaTower.id, type: "APARTMENT", bedrooms: 2, bathrooms: 3, areaSqft: 1420, title: "2BR Apartment, Marina Promenade", listingType: "SALE", askingPriceAed: 2450000 },
    { areaId: jvc.id, type: "TOWNHOUSE", bedrooms: 3, bathrooms: 4, areaSqft: 2100, title: "3BR Townhouse, District 11", listingType: "SALE", askingPriceAed: 1980000 },
    { areaId: businessBay.id, type: "APARTMENT", bedrooms: 0, bathrooms: 1, areaSqft: 480, title: "Studio, Business Bay Tower", listingType: "RENT", askingRentAedYear: 62000 },
    { areaId: ranches.id, type: "VILLA", bedrooms: 4, bathrooms: 5, areaSqft: 3600, title: "4BR Villa, Sector G", listingType: "RENT", askingRentAedYear: 245000 },
    { areaId: downtown.id, type: "APARTMENT", bedrooms: 1, bathrooms: 2, areaSqft: 810, title: "1BR Apartment, Burj Views", listingType: "SALE", askingPriceAed: 1650000 },
    { areaId: palm.id, type: "PENTHOUSE", bedrooms: 4, bathrooms: 5, areaSqft: 4200, title: "4BR Penthouse, Palm Signature", listingType: "SALE", askingPriceAed: 9800000 },
    { areaId: marina.id, type: "APARTMENT", bedrooms: 1, bathrooms: 1, areaSqft: 720, title: "1BR Apartment, Marina Heights", listingType: "RENT", askingRentAedYear: 78000 },
    { areaId: jvc.id, type: "APARTMENT", bedrooms: 2, bathrooms: 2, areaSqft: 1150, title: "2BR Apartment, Circle Mall Vicinity", listingType: "SALE", askingPriceAed: 1120000 },
  ];

  for (const s of seeds) {
    const property = await db.property.create({
      data: {
        type: s.type,
        areaId: s.areaId,
        buildingId: s.buildingId,
        bedrooms: s.bedrooms,
        bathrooms: s.bathrooms,
        areaSqft: s.areaSqft,
        completion: CompletionStatus.READY,
        isDemoData: true,
      },
    });

    await db.listing.create({
      data: {
        propertyId: property.id,
        type: s.listingType,
        status: ListingStatus.ACTIVE,
        title: s.title,
        description: "Seed listing for local development — not a real property offer.",
        askingPriceAed: s.askingPriceAed,
        askingRentAedYear: s.askingRentAedYear,
        agentId: agent.id,
        agencyId: agency.id,
        amenities: ["Balcony", "Built-in wardrobes", "Central A/C"],
        publishedAt: new Date(),
        isDemoData: true,
      },
    });

    if (s.listingType === "SALE" && s.askingPriceAed) {
      await db.transaction.create({
        data: {
          propertyId: property.id,
          priceAed: s.askingPriceAed * 0.97,
          transactionDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120),
          source: "demo-seed",
          isDemoData: true,
        },
      });
    }
    if (s.listingType === "RENT" && s.askingRentAedYear) {
      await db.rentalTransaction.create({
        data: {
          propertyId: property.id,
          annualRentAed: s.askingRentAedYear * 0.98,
          contractStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200),
          source: "demo-seed",
          isDemoData: true,
        },
      });
    }
  }

  // ---- Market metrics -----------------------------------------------------
  const metricAreas = [
    { area: marina, pricePerSqft: 1780, rent: 78000, yield: 6.1 },
    { area: downtown, pricePerSqft: 2340, rent: 95000, yield: 5.4 },
    { area: businessBay, pricePerSqft: 1650, rent: 62000, yield: 6.4 },
    { area: jvc, pricePerSqft: 980, rent: 48000, yield: 7.2 },
    { area: palm, pricePerSqft: 3120, rent: 140000, yield: 4.8 },
    { area: ranches, pricePerSqft: 1240, rent: 150000, yield: 5.6 },
  ];

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth() - 3, 1);

  for (const m of metricAreas) {
    await db.marketMetric.create({
      data: {
        areaId: m.area.id,
        periodStart,
        periodEnd,
        avgPricePerSqftAed: m.pricePerSqft,
        avgAnnualRentAed: m.rent,
        grossRentalYieldPct: m.yield,
        transactionVolume: Math.floor(200 + Math.random() * 800),
        priceChangePct: Number((Math.random() * 6 - 2).toFixed(1)),
        isDemoData: true,
      },
    });
  }

  // ---- Project (off-plan) ---------------------------------------------
  const project = await db.project.upsert({
    where: { slug: "meridian-bay-residences" },
    update: {},
    create: {
      slug: "meridian-bay-residences",
      name: "Meridian Bay Residences",
      description: "Demo off-plan project for seed data.",
      status: "UNDER_CONSTRUCTION",
      areaId: businessBay.id,
      developerId: developer.id,
      startingPriceAed: 980000,
      handoverDate: new Date(periodEnd.getFullYear() + 1, 11, 1),
      amenities: ["Infinity pool", "Co-working lounge", "Kids play area"],
      paymentPlan: [
        { milestone: "On booking", percent: 10 },
        { milestone: "During construction", percent: 50 },
        { milestone: "On handover", percent: 40 },
      ],
      isDemoData: true,
    },
  });

  await db.unit.createMany({
    data: [
      { projectId: project.id, unitType: "Studio", bedrooms: 0, bathrooms: 1, areaSqft: 450, priceAed: 750000, availability: "AVAILABLE" },
      { projectId: project.id, unitType: "1BR", bedrooms: 1, bathrooms: 2, areaSqft: 780, priceAed: 1150000, availability: "AVAILABLE" },
      { projectId: project.id, unitType: "2BR", bedrooms: 2, bathrooms: 3, areaSqft: 1200, priceAed: 1680000, availability: "RESERVED" },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
