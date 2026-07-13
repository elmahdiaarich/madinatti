-- AlterEnum
ALTER TYPE "ReportTarget" ADD VALUE 'WORKER_PROFILE';

-- AlterTable
ALTER TABLE "TaskRequest" ADD COLUMN     "location" TEXT;
