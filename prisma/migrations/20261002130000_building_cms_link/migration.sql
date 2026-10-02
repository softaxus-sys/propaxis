-- AlterTable
ALTER TABLE "buildings" ADD COLUMN     "cmsPageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "buildings_cmsPageId_key" ON "buildings"("cmsPageId");

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_cmsPageId_fkey" FOREIGN KEY ("cmsPageId") REFERENCES "cms_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
