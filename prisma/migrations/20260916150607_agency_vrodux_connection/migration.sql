-- AlterTable
ALTER TABLE "agencies" ADD COLUMN     "vroduxApiKey" TEXT,
ADD COLUMN     "vroduxConnectedAt" TIMESTAMP(3),
ADD COLUMN     "vroduxTenantId" TEXT;
