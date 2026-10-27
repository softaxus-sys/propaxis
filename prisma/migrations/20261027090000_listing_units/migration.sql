-- CreateTable
CREATE TABLE "listing_units" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "vroduxUnitId" TEXT NOT NULL,
    "unitNumber" TEXT,
    "propertyType" "PropertyType" NOT NULL,
    "rentPerYearAed" DECIMAL(14,2),
    "salePriceAed" DECIMAL(14,2),
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "areaSqft" DOUBLE PRECISION,
    "floor" INTEGER,
    "furnishing" TEXT,
    "view" TEXT,
    "parking" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_units_listingId_active_idx" ON "listing_units"("listingId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "listing_units_listingId_vroduxUnitId_key" ON "listing_units"("listingId", "vroduxUnitId");

-- AddForeignKey
ALTER TABLE "listing_units" ADD CONSTRAINT "listing_units_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
