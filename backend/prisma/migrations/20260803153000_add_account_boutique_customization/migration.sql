ALTER TABLE "User"
ADD COLUMN "boutiqueDescription" TEXT,
ADD COLUMN "boutiqueBanner" TEXT,
ADD COLUMN "boutiquePhone" TEXT,
ADD COLUMN "boutiqueEmail" TEXT,
ADD COLUMN "boutiqueListingSort" TEXT DEFAULT 'newest',
ADD COLUMN "boutiqueFeaturedListingIds" JSONB;
