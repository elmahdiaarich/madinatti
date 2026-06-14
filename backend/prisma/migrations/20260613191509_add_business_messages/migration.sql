-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('REJECTION', 'REPORT_CONTACT');

-- CreateTable
CREATE TABLE "BusinessMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetTitle" TEXT NOT NULL,
    "adminMessage" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessMessage_userId_idx" ON "BusinessMessage"("userId");

-- CreateIndex
CREATE INDEX "BusinessMessage_isRead_idx" ON "BusinessMessage"("isRead");

-- CreateIndex
CREATE INDEX "BusinessMessage_createdAt_idx" ON "BusinessMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "BusinessMessage" ADD CONSTRAINT "BusinessMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
