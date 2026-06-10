/*
  Warnings:

  - Made the column `city` on table `RealEstateListing` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RealEstateListing" ALTER COLUMN "city" SET NOT NULL;
