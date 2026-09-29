-- CreateEnum
CREATE TYPE "VroduxConnectionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED');

-- CreateTable
CREATE TABLE "vrodux_oauth_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "state" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vrodux_oauth_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vrodux_connections" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "status" "VroduxConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "apiKey" TEXT,
    "listingsApiBaseUrl" TEXT,
    "connectedAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "reconnectNeeded" BOOLEAN NOT NULL DEFAULT false,
    "lastPulledAt" TIMESTAMP(3),
    "lastPullStatus" TEXT,
    "lastPullError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vrodux_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vrodux_synced_listings" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "vroduxPropertyId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "rawPriceLabel" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vrodux_synced_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vrodux_oauth_codes_code_key" ON "vrodux_oauth_codes"("code");

-- CreateIndex
CREATE INDEX "vrodux_oauth_codes_expiresAt_idx" ON "vrodux_oauth_codes"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "vrodux_connections_agencyId_key" ON "vrodux_connections"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "vrodux_synced_listings_listingId_key" ON "vrodux_synced_listings"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "vrodux_synced_listings_connectionId_vroduxPropertyId_key" ON "vrodux_synced_listings"("connectionId", "vroduxPropertyId");

-- AddForeignKey
ALTER TABLE "vrodux_connections" ADD CONSTRAINT "vrodux_connections_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vrodux_synced_listings" ADD CONSTRAINT "vrodux_synced_listings_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "vrodux_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vrodux_synced_listings" ADD CONSTRAINT "vrodux_synced_listings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
