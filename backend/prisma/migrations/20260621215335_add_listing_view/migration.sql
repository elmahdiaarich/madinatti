-- CreateTable
CREATE TABLE "ListingView" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "listingType" TEXT NOT NULL,
    "userId" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingView_listingId_listingType_idx" ON "ListingView"("listingId", "listingType");

-- CreateIndex
CREATE INDEX "ListingView_listingType_viewedAt_idx" ON "ListingView"("listingType", "viewedAt");

-- CreateIndex
CREATE INDEX "ListingView_viewedAt_idx" ON "ListingView"("viewedAt");
