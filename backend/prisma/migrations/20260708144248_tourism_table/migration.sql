-- AlterEnum
ALTER TYPE "ReportTarget" ADD VALUE 'TOURISM';

-- CreateTable
CREATE TABLE "TouristicListing" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "region" TEXT,
    "location" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "images" JSONB,
    "attributes" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TouristicListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TouristicListing_slug_key" ON "TouristicListing"("slug");

-- CreateIndex
CREATE INDEX "TouristicListing_categoryId_idx" ON "TouristicListing"("categoryId");

-- CreateIndex
CREATE INDEX "TouristicListing_city_idx" ON "TouristicListing"("city");

-- CreateIndex
CREATE INDEX "TouristicListing_isActive_idx" ON "TouristicListing"("isActive");

-- CreateIndex
CREATE INDEX "TouristicListing_createdAt_idx" ON "TouristicListing"("createdAt");

-- AddForeignKey
ALTER TABLE "TouristicListing" ADD CONSTRAINT "TouristicListing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TouristicListing" ADD CONSTRAINT "TouristicListing_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
