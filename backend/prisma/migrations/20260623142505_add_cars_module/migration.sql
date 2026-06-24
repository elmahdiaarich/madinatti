-- CreateEnum
CREATE TYPE "CarListingType" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "CarCondition" AS ENUM ('NEW', 'USED', 'DAMAGED');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG', 'OTHER');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATIC', 'SEMI_AUTOMATIC');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'WAGON', 'VAN', 'PICKUP', 'MINIVAN', 'OTHER');

-- CreateTable
CREATE TABLE "CarListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT NOT NULL,
    "listingType" "CarListingType" NOT NULL,
    "condition" "CarCondition" NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER,
    "fuelType" "FuelType" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "bodyType" "BodyType" NOT NULL,
    "color" TEXT,
    "doors" INTEGER,
    "seats" INTEGER,
    "engineSize" DOUBLE PRECISION,
    "horsePower" INTEGER,
    "price" DECIMAL(65,30) NOT NULL,
    "isNegotiable" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT,
    "region" TEXT,
    "location" TEXT NOT NULL,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "contactPhone" TEXT,
    "images" JSONB,
    "features" JSONB,
    "status" "ListingStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "boostExpiresAt" TIMESTAMP(3),
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "adminNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "deletedByOwner" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarInquiry" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CarListing_slug_key" ON "CarListing"("slug");

-- CreateIndex
CREATE INDEX "CarListing_userId_idx" ON "CarListing"("userId");

-- CreateIndex
CREATE INDEX "CarListing_categoryId_idx" ON "CarListing"("categoryId");

-- CreateIndex
CREATE INDEX "CarListing_status_idx" ON "CarListing"("status");

-- CreateIndex
CREATE INDEX "CarListing_make_idx" ON "CarListing"("make");

-- CreateIndex
CREATE INDEX "CarListing_price_idx" ON "CarListing"("price");

-- CreateIndex
CREATE INDEX "CarListing_year_idx" ON "CarListing"("year");

-- CreateIndex
CREATE INDEX "CarListing_city_idx" ON "CarListing"("city");

-- CreateIndex
CREATE INDEX "CarListing_createdAt_idx" ON "CarListing"("createdAt");

-- CreateIndex
CREATE INDEX "CarInquiry_listingId_idx" ON "CarInquiry"("listingId");

-- CreateIndex
CREATE INDEX "CarInquiry_userId_idx" ON "CarInquiry"("userId");

-- AddForeignKey
ALTER TABLE "CarListing" ADD CONSTRAINT "CarListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarListing" ADD CONSTRAINT "CarListing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarInquiry" ADD CONSTRAINT "CarInquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CarListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarInquiry" ADD CONSTRAINT "CarInquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
