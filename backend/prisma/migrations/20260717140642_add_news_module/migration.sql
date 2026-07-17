-- CreateEnum
CREATE TYPE "NewsLanguage" AS ENUM ('AR', 'FR');

-- CreateEnum
CREATE TYPE "FetchStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "language" "NewsLanguage" NOT NULL,
    "city" TEXT,
    "categoryId" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fetch_logs" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "FetchStatus" NOT NULL,
    "itemsFetched" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fetch_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_sourceUrl_key" ON "news_articles"("sourceUrl");

-- CreateIndex
CREATE INDEX "news_articles_language_publishedAt_idx" ON "news_articles"("language", "publishedAt");

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
