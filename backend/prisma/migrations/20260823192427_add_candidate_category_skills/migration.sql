-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "currentPosition" TEXT,
ADD COLUMN     "portfolioUrl" TEXT,
ADD COLUMN     "skills" JSONB;

-- CreateIndex
CREATE INDEX "CandidateProfile_categoryId_idx" ON "CandidateProfile"("categoryId");

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
