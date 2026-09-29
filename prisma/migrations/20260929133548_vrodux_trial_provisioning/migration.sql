-- CreateEnum
CREATE TYPE "VroduxTrialStatus" AS ENUM ('NONE', 'PROVISIONING', 'ACTIVE', 'FAILED');

-- AlterTable
ALTER TABLE "agencies" ADD COLUMN     "vroduxTrialEndsAt" TIMESTAMP(3),
ADD COLUMN     "vroduxTrialStartedAt" TIMESTAMP(3),
ADD COLUMN     "vroduxTrialStatus" "VroduxTrialStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "vroduxTrialTenantId" TEXT;
