-- CreateEnum
CREATE TYPE "NewsSource" AS ENUM ('RSS', 'ORIGINAL');

-- CreateEnum
CREATE TYPE "JournalistStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "ReportTarget" ADD VALUE 'NEWS';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "journalistStatus" "JournalistStatus";

-- AlterTable
ALTER TABLE "news_articles" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "source" "NewsSource" NOT NULL DEFAULT 'RSS',
ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "sourceUrl" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "news_articles_status_idx" ON "news_articles"("status");

-- CreateIndex
CREATE INDEX "news_articles_source_idx" ON "news_articles"("source");

-- CreateIndex
CREATE INDEX "news_articles_userId_idx" ON "news_articles"("userId");

-- CreateIndex
CREATE INDEX "news_articles_city_idx" ON "news_articles"("city");

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
