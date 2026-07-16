-- CreateTable
CREATE TABLE "ProfessionalSpaceListing" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
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

    CONSTRAINT "ProfessionalSpaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfessionalSpaceListing_categoryId_idx" ON "ProfessionalSpaceListing"("categoryId");

-- CreateIndex
CREATE INDEX "ProfessionalSpaceListing_city_idx" ON "ProfessionalSpaceListing"("city");

-- CreateIndex
CREATE INDEX "ProfessionalSpaceListing_isActive_idx" ON "ProfessionalSpaceListing"("isActive");

-- CreateIndex
CREATE INDEX "ProfessionalSpaceListing_createdAt_idx" ON "ProfessionalSpaceListing"("createdAt");

-- AddForeignKey
ALTER TABLE "ProfessionalSpaceListing" ADD CONSTRAINT "ProfessionalSpaceListing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalSpaceListing" ADD CONSTRAINT "ProfessionalSpaceListing_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
