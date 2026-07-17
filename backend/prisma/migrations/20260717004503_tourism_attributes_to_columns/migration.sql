/*
  Warnings:

  - You are about to drop the column `attributes` on the `TouristicListing` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TouristicListing" DROP COLUMN "attributes",
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "hours" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "mapUrl" TEXT,
ADD COLUMN     "prix" INTEGER,
ADD COLUMN     "rating" DECIMAL(65,30),
ADD COLUMN     "website" TEXT;

-- CreateIndex
CREATE INDEX "TouristicListing_rating_idx" ON "TouristicListing"("rating");

-- CreateIndex
CREATE INDEX "TouristicListing_prix_idx" ON "TouristicListing"("prix");
