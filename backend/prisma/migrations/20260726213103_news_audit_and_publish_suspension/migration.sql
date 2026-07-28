/*
  Warnings:

  - You are about to drop the column `previousDescription` on the `news_articles` table. All the data in the column will be lost.
  - You are about to drop the column `previousImageUrl` on the `news_articles` table. All the data in the column will be lost.
  - You are about to drop the column `previousTitle` on the `news_articles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canPublish" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "news_articles" DROP COLUMN "previousDescription",
DROP COLUMN "previousImageUrl",
DROP COLUMN "previousTitle",
ADD COLUMN     "editCount" INTEGER NOT NULL DEFAULT 0;
