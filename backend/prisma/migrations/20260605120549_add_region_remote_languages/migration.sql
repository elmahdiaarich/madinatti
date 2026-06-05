-- CreateEnum
CREATE TYPE "RemoteType" AS ENUM ('ON_SITE', 'REMOTE', 'HYBRID');

-- AlterTable
ALTER TABLE "JobListing" ADD COLUMN     "languages" JSONB,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "remote" "RemoteType" NOT NULL DEFAULT 'ON_SITE';

-- AlterTable
ALTER TABLE "RealEstateListing" ADD COLUMN     "region" TEXT;
