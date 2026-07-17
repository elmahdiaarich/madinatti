-- Health category places for MADINATI / YourTown.
CREATE TYPE "HealthPlaceSource" AS ENUM ('GOOGLE', 'MADINATI', 'IMPORT');
CREATE TYPE "HealthPlaceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ARCHIVED');

CREATE TABLE "HealthPlace" (
    "id" TEXT NOT NULL,
    "googlePlaceId" TEXT,
    "source" "HealthPlaceSource" NOT NULL DEFAULT 'MADINATI',
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT,
    "subcategory" TEXT NOT NULL,
    "googleTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'MA',
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "phones" JSONB,
    "website" TEXT,
    "googleMapsUri" TEXT,
    "businessStatus" TEXT,
    "rating" DECIMAL(65,30),
    "userRatingCount" INTEGER,
    "regularHours" JSONB,
    "currentHours" JSONB,
    "openNow" BOOLEAN,
    "lastGoogleRefreshAt" TIMESTAMP(3),
    "status" "HealthPlaceStatus" NOT NULL DEFAULT 'PENDING',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthPlace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthPlace_googlePlaceId_key" ON "HealthPlace"("googlePlaceId");
CREATE UNIQUE INDEX "HealthPlace_slug_key" ON "HealthPlace"("slug");
CREATE INDEX "HealthPlace_googlePlaceId_idx" ON "HealthPlace"("googlePlaceId");
CREATE INDEX "HealthPlace_subcategory_idx" ON "HealthPlace"("subcategory");
CREATE INDEX "HealthPlace_city_idx" ON "HealthPlace"("city");
CREATE INDEX "HealthPlace_source_idx" ON "HealthPlace"("source");
CREATE INDEX "HealthPlace_status_idx" ON "HealthPlace"("status");
CREATE INDEX "HealthPlace_isVerified_idx" ON "HealthPlace"("isVerified");
CREATE INDEX "HealthPlace_latitude_longitude_idx" ON "HealthPlace"("latitude", "longitude");
CREATE INDEX "HealthPlace_createdAt_idx" ON "HealthPlace"("createdAt");

ALTER TABLE "HealthPlace" ADD CONSTRAINT "HealthPlace_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HealthPlace" ADD CONSTRAINT "HealthPlace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
