-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('PURCHASE', 'UNLOCK', 'REFUND');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "creditBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isAvailableForWork" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "educationLevel" "EducationLevel",
    "experienceLevel" "ExperienceLevel",
    "desiredContractTypes" "ContractType"[] DEFAULT ARRAY[]::"ContractType"[],
    "languages" JSONB,
    "desiredSalaryMin" DECIMAL(65,30),
    "desiredSalaryMax" DECIMAL(65,30),
    "mobilityRegion" TEXT,
    "cvUrl" TEXT,
    "visibleToRecruiters" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "packId" TEXT,
    "packName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateUnlock" (
    "id" TEXT NOT NULL,
    "businessUserId" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");

-- CreateIndex
CREATE INDEX "CandidateProfile_visibleToRecruiters_idx" ON "CandidateProfile"("visibleToRecruiters");

-- CreateIndex
CREATE INDEX "CandidateProfile_educationLevel_idx" ON "CandidateProfile"("educationLevel");

-- CreateIndex
CREATE INDEX "CandidateProfile_experienceLevel_idx" ON "CandidateProfile"("experienceLevel");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_type_idx" ON "CreditTransaction"("type");

-- CreateIndex
CREATE INDEX "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "CandidateUnlock_businessUserId_idx" ON "CandidateUnlock"("businessUserId");

-- CreateIndex
CREATE INDEX "CandidateUnlock_candidateProfileId_idx" ON "CandidateUnlock"("candidateProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateUnlock_businessUserId_candidateProfileId_key" ON "CandidateUnlock"("businessUserId", "candidateProfileId");

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateUnlock" ADD CONSTRAINT "CandidateUnlock_businessUserId_fkey" FOREIGN KEY ("businessUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateUnlock" ADD CONSTRAINT "CandidateUnlock_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
