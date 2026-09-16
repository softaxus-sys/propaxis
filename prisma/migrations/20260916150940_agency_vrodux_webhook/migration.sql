/*
  Warnings:

  - You are about to drop the column `vroduxApiKey` on the `agencies` table. All the data in the column will be lost.
  - You are about to drop the column `vroduxTenantId` on the `agencies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "agencies" DROP COLUMN "vroduxApiKey",
DROP COLUMN "vroduxTenantId",
ADD COLUMN     "vroduxWebhookUrl" TEXT;
