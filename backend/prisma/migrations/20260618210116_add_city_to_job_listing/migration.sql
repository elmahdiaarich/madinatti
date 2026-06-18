/*
  Warnings:

  - Added the required column `city` to the `JobListing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JobListing" ADD COLUMN     "city" TEXT NOT NULL;
