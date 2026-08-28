-- AlterTable
ALTER TABLE "ListingView" ADD COLUMN     "ipAddress" TEXT;

-- CreateIndex
CREATE INDEX "ListingView_listingId_listingType_userId_idx" ON "ListingView"("listingId", "listingType", "userId");

-- CreateIndex
CREATE INDEX "ListingView_listingId_listingType_ipAddress_idx" ON "ListingView"("listingId", "listingType", "ipAddress");
