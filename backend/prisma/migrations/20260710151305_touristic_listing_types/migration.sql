-- CreateEnum
CREATE TYPE "CategoryDisplayType" AS ENUM ('PLACE', 'DOCUMENT');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "displayType" "CategoryDisplayType" NOT NULL DEFAULT 'PLACE';

-- AlterTable
ALTER TABLE "TouristicListing" ADD COLUMN     "downloadsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3);
