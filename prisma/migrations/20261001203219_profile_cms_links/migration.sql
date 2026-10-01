-- AlterTable
ALTER TABLE "agencies" ADD COLUMN     "cmsPageId" TEXT;

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "cmsPageId" TEXT;

-- AlterTable
ALTER TABLE "developers" ADD COLUMN     "cmsPageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "agencies_cmsPageId_key" ON "agencies"("cmsPageId");

-- CreateIndex
CREATE UNIQUE INDEX "agents_cmsPageId_key" ON "agents"("cmsPageId");

-- CreateIndex
CREATE UNIQUE INDEX "developers_cmsPageId_key" ON "developers"("cmsPageId");

-- AddForeignKey
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_cmsPageId_fkey" FOREIGN KEY ("cmsPageId") REFERENCES "cms_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_cmsPageId_fkey" FOREIGN KEY ("cmsPageId") REFERENCES "cms_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "developers" ADD CONSTRAINT "developers_cmsPageId_fkey" FOREIGN KEY ("cmsPageId") REFERENCES "cms_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
