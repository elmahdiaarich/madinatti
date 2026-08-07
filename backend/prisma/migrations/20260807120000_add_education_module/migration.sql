CREATE TYPE "EducationInstitutionType" AS ENUM (
  'PRESCHOOL',
  'PRIMARY_SCHOOL',
  'MIDDLE_SCHOOL',
  'HIGH_SCHOOL',
  'UNIVERSITY',
  'FACULTY',
  'ENGINEERING_SCHOOL',
  'BUSINESS_SCHOOL',
  'INSTITUTE',
  'VOCATIONAL_TRAINING',
  'OFPPT',
  'LANGUAGE_CENTER',
  'TRAINING_CENTER',
  'OTHER'
);

CREATE TYPE "EducationSector" AS ENUM (
  'PUBLIC',
  'PRIVATE',
  'SEMI_PUBLIC'
);

CREATE TABLE "EducationInstitution" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "nameAr" TEXT,
  "nameFr" TEXT,
  "nameEn" TEXT,
  "categoryId" TEXT,
  "institutionType" "EducationInstitutionType" NOT NULL,
  "sector" "EducationSector" NOT NULL,
  "description" TEXT,
  "descriptionAr" TEXT,
  "descriptionFr" TEXT,
  "descriptionEn" TEXT,
  "address" TEXT,
  "postalCode" TEXT,
  "country" TEXT NOT NULL DEFAULT 'MA',
  "region" TEXT,
  "province" TEXT,
  "city" TEXT,
  "latitude" DECIMAL(65,30),
  "longitude" DECIMAL(65,30),
  "phone" TEXT,
  "secondaryPhone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "facebookUrl" TEXT,
  "instagramUrl" TEXT,
  "linkedinUrl" TEXT,
  "logoUrl" TEXT,
  "coverImageUrl" TEXT,
  "openingHours" JSONB,
  "metadata" JSONB,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT,
  "sourceUrl" TEXT,
  "externalId" TEXT,
  "dataSource" TEXT,
  "lastImportedAt" TIMESTAMP(3),
  "manuallyEdited" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EducationInstitution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EducationInstitution_slug_key" ON "EducationInstitution"("slug");
CREATE UNIQUE INDEX "EducationInstitution_source_externalId_key" ON "EducationInstitution"("source", "externalId");
CREATE INDEX "EducationInstitution_categoryId_idx" ON "EducationInstitution"("categoryId");
CREATE INDEX "EducationInstitution_institutionType_idx" ON "EducationInstitution"("institutionType");
CREATE INDEX "EducationInstitution_sector_idx" ON "EducationInstitution"("sector");
CREATE INDEX "EducationInstitution_region_idx" ON "EducationInstitution"("region");
CREATE INDEX "EducationInstitution_province_idx" ON "EducationInstitution"("province");
CREATE INDEX "EducationInstitution_city_idx" ON "EducationInstitution"("city");
CREATE INDEX "EducationInstitution_isPublished_idx" ON "EducationInstitution"("isPublished");
CREATE INDEX "EducationInstitution_isVerified_idx" ON "EducationInstitution"("isVerified");
CREATE INDEX "EducationInstitution_isFeatured_idx" ON "EducationInstitution"("isFeatured");
CREATE INDEX "EducationInstitution_source_idx" ON "EducationInstitution"("source");
CREATE INDEX "EducationInstitution_externalId_idx" ON "EducationInstitution"("externalId");
CREATE INDEX "EducationInstitution_updatedAt_idx" ON "EducationInstitution"("updatedAt");

ALTER TABLE "EducationInstitution" ADD CONSTRAINT "EducationInstitution_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EducationInstitution" ADD CONSTRAINT "EducationInstitution_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
