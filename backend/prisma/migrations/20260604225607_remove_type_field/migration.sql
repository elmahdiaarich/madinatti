/*
  Warnings:

  - You are about to drop the column `type` on the `JobListing` table. All the data in the column will be lost.
  - Added the required column `contractType` to the `JobListing` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('BEFORE_BAC', 'BAC', 'BAC_PLUS_1', 'BAC_PLUS_2', 'BAC_PLUS_3', 'BAC_PLUS_4', 'BAC_PLUS_5_PLUS');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('STUDENT_FRESH_GRAD', 'JUNIOR_LESS_2', 'MID_2_TO_5', 'SENIOR_5_TO_10', 'EXPERT_PLUS_10');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CDI', 'CDD', 'INTERIM', 'FREELANCE', 'STAGE', 'ANAPEC', 'TEMPS_PARTIEL', 'ALTERNANCE', 'STATUTAIRE');

-- AlterTable
ALTER TABLE "JobListing" DROP COLUMN "type",
ADD COLUMN     "contractType" "ContractType" NOT NULL,
ADD COLUMN     "educationLevel" "EducationLevel",
ADD COLUMN     "experienceLevel" "ExperienceLevel";
