-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "cmsPageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "projects_cmsPageId_key" ON "projects"("cmsPageId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_cmsPageId_fkey" FOREIGN KEY ("cmsPageId") REFERENCES "cms_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
