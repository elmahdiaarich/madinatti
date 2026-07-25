CREATE TYPE "EventMode" AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID');
CREATE TYPE "EventRecurrenceType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM');
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'CANCELLED', 'POSTPONED', 'FINISHED');

CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "organizerName" TEXT NOT NULL,
    "organizerId" TEXT,
    "organizerPhone" TEXT,
    "organizerEmail" TEXT,
    "websiteUrl" TEXT,
    "eventMode" "EventMode" NOT NULL DEFAULT 'IN_PERSON',
    "venueName" TEXT,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT,
    "region" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "onlineUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Casablanca',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "doorsOpenAt" TIMESTAMP(3),
    "recurrenceType" "EventRecurrenceType" NOT NULL DEFAULT 'NONE',
    "recurrenceRule" TEXT,
    "recurrenceEndsAt" TIMESTAMP(3),
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "priceMin" DECIMAL(65,30),
    "priceMax" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "ticketUrl" TEXT,
    "reservationRequired" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER,
    "ageRestriction" TEXT,
    "accessibilityInformation" TEXT,
    "mainImage" TEXT,
    "gallery" JSONB,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "source" TEXT,
    "sourceUrl" TEXT,
    "sourceVerifiedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE INDEX "Event_categoryId_idx" ON "Event"("categoryId");
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE INDEX "Event_city_idx" ON "Event"("city");
CREATE INDEX "Event_province_idx" ON "Event"("province");
CREATE INDEX "Event_region_idx" ON "Event"("region");
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");
CREATE INDEX "Event_endsAt_idx" ON "Event"("endsAt");
CREATE INDEX "Event_featured_idx" ON "Event"("featured");
CREATE INDEX "Event_verified_idx" ON "Event"("verified");
CREATE INDEX "Event_latitude_longitude_idx" ON "Event"("latitude", "longitude");
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

ALTER TABLE "Event" ADD CONSTRAINT "Event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
