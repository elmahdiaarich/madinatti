/*
  Warnings:

  - You are about to drop the column `images` on the `JobListing` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `JobListing` table. All the data in the column will be lost.
  - You are about to drop the column `requirements` on the `JobListing` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CLOSED');

-- AlterTable
ALTER TABLE "JobListing" DROP COLUMN "images",
DROP COLUMN "isActive",
DROP COLUMN "requirements",
ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "status" "JobStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyLogo" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "companyWebsite" TEXT;

-- CreateIndex
CREATE INDEX "JobListing_status_idx" ON "JobListing"("status");

-- CreateIndex
CREATE INDEX "JobListing_categoryId_idx" ON "JobListing"("categoryId");

-- CreateIndex
CREATE INDEX "JobListing_createdAt_idx" ON "JobListing"("createdAt");
