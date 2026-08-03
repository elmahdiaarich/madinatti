CREATE TYPE "SellerType" AS ENUM ('INDIVIDUAL', 'SHOP');
CREATE TYPE "ShopStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'CLOSED');
CREATE TYPE "ShopSubscriptionStatus" AS ENUM ('PENDING', 'TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');

ALTER TABLE "JobListing" ADD COLUMN "shopId" TEXT;
ALTER TABLE "JobListing" ADD COLUMN "sellerType" "SellerType" NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE "RealEstateListing" ADD COLUMN "shopId" TEXT;
ALTER TABLE "RealEstateListing" ADD COLUMN "sellerType" "SellerType" NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE "CarListing" ADD COLUMN "shopId" TEXT;
ALTER TABLE "CarListing" ADD COLUMN "sellerType" "SellerType" NOT NULL DEFAULT 'INDIVIDUAL';

CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "professionalPhone" TEXT,
    "professionalEmail" TEXT,
    "legalName" TEXT,
    "taxIdentifier" TEXT,
    "website" TEXT,
    "socialLinks" JSONB,
    "openingHours" JSONB,
    "status" "ShopStatus" NOT NULL DEFAULT 'PENDING',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShopMember" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShopSubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayedPrice" TEXT NOT NULL,
    "billingPeriod" TEXT NOT NULL DEFAULT 'monthly',
    "listingLimit" INTEGER NOT NULL,
    "features" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSubscriptionPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShopSubscription" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "ShopSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Shop_slug_key" ON "Shop"("slug");
CREATE UNIQUE INDEX "ShopMember_shopId_userId_key" ON "ShopMember"("shopId", "userId");
CREATE UNIQUE INDEX "ShopSubscriptionPlan_slug_key" ON "ShopSubscriptionPlan"("slug");

CREATE INDEX "JobListing_shopId_idx" ON "JobListing"("shopId");
CREATE INDEX "JobListing_sellerType_idx" ON "JobListing"("sellerType");
CREATE INDEX "RealEstateListing_shopId_idx" ON "RealEstateListing"("shopId");
CREATE INDEX "RealEstateListing_sellerType_idx" ON "RealEstateListing"("sellerType");
CREATE INDEX "CarListing_shopId_idx" ON "CarListing"("shopId");
CREATE INDEX "CarListing_sellerType_idx" ON "CarListing"("sellerType");
CREATE INDEX "Shop_ownerUserId_idx" ON "Shop"("ownerUserId");
CREATE INDEX "Shop_categoryId_idx" ON "Shop"("categoryId");
CREATE INDEX "Shop_status_idx" ON "Shop"("status");
CREATE INDEX "Shop_city_idx" ON "Shop"("city");
CREATE INDEX "Shop_isVerified_idx" ON "Shop"("isVerified");
CREATE INDEX "Shop_createdAt_idx" ON "Shop"("createdAt");
CREATE INDEX "ShopMember_shopId_idx" ON "ShopMember"("shopId");
CREATE INDEX "ShopMember_userId_idx" ON "ShopMember"("userId");
CREATE INDEX "ShopSubscription_shopId_idx" ON "ShopSubscription"("shopId");
CREATE INDEX "ShopSubscription_planId_idx" ON "ShopSubscription"("planId");
CREATE INDEX "ShopSubscription_status_idx" ON "ShopSubscription"("status");
CREATE INDEX "ShopSubscription_expiresAt_idx" ON "ShopSubscription"("expiresAt");

ALTER TABLE "JobListing" ADD CONSTRAINT "JobListing_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RealEstateListing" ADD CONSTRAINT "RealEstateListing_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CarListing" ADD CONSTRAINT "CarListing_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShopMember" ADD CONSTRAINT "ShopMember_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopMember" ADD CONSTRAINT "ShopMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShopSubscription" ADD CONSTRAINT "ShopSubscription_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopSubscription" ADD CONSTRAINT "ShopSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ShopSubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
