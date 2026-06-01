/*
  Warnings:

  - You are about to drop the column `type` on the `RealEstateListing` table. All the data in the column will be lost.
  - The `status` column on the `RealEstateListing` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[userId,itemId,itemType]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `RealEstateListing` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `PropertyInquiry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `listingType` to the `RealEstateListing` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `propertyType` on the `RealEstateListing` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'VILLA', 'HOUSE', 'STUDIO', 'LAND', 'OFFICE', 'SHOP');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "PropertyInquiry" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "RealEstateListing" DROP COLUMN "type",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "listingType" "ListingType" NOT NULL,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "slug" TEXT,
DROP COLUMN "propertyType",
ADD COLUMN     "propertyType" "PropertyType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_itemId_itemType_key" ON "Favorite"("userId", "itemId", "itemType");

-- CreateIndex
CREATE INDEX "PropertyInquiry_listingId_idx" ON "PropertyInquiry"("listingId");

-- CreateIndex
CREATE INDEX "PropertyInquiry_userId_idx" ON "PropertyInquiry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RealEstateListing_slug_key" ON "RealEstateListing"("slug");

-- CreateIndex
CREATE INDEX "RealEstateListing_categoryId_idx" ON "RealEstateListing"("categoryId");

-- CreateIndex
CREATE INDEX "RealEstateListing_status_idx" ON "RealEstateListing"("status");

-- CreateIndex
CREATE INDEX "RealEstateListing_price_idx" ON "RealEstateListing"("price");

-- CreateIndex
CREATE INDEX "RealEstateListing_city_idx" ON "RealEstateListing"("city");

-- CreateIndex
CREATE INDEX "RealEstateListing_createdAt_idx" ON "RealEstateListing"("createdAt");
