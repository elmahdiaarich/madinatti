-- CreateEnum
CREATE TYPE "NewsContentType" AS ENUM ('ARTICLE', 'VIDEO');

-- AlterTable
ALTER TABLE "news_articles" ADD COLUMN     "contentType" "NewsContentType" NOT NULL DEFAULT 'ARTICLE',
ADD COLUMN     "videoUrl" TEXT;

-- CreateIndex
CREATE INDEX "news_articles_contentType_idx" ON "news_articles"("contentType");
