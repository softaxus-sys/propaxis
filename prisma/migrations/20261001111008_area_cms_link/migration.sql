-- AlterTable
ALTER TABLE "areas" ADD COLUMN     "cmsPageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "areas_cmsPageId_key" ON "areas"("cmsPageId");

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_cmsPageId_fkey" FOREIGN KEY ("cmsPageId") REFERENCES "cms_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
