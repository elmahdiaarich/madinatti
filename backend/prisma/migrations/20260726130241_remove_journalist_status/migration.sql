/*
  Warnings:

  - You are about to drop the column `journalistStatus` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "journalistStatus";

-- DropEnum
DROP TYPE "JournalistStatus";
