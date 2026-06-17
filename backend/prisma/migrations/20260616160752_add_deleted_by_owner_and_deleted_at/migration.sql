-- AlterTable
ALTER TABLE "JobListing" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedByOwner" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RealEstateListing" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedByOwner" BOOLEAN NOT NULL DEFAULT false;
