-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "fipiTopics" JSONB;

-- CreateTable
CREATE TABLE "PeerHelpRequest" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "problemId" TEXT,
    "body" VARCHAR(2000) NOT NULL,
    "rewardCoins" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "helperId" TEXT,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeerHelpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PeerHelpRequest_status_subjectId_idx" ON "PeerHelpRequest"("status", "subjectId");

-- CreateIndex
CREATE INDEX "PeerHelpRequest_authorId_idx" ON "PeerHelpRequest"("authorId");

-- CreateIndex
CREATE INDEX "PeerHelpRequest_helperId_idx" ON "PeerHelpRequest"("helperId");

-- AddForeignKey
ALTER TABLE "PeerHelpRequest" ADD CONSTRAINT "PeerHelpRequest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerHelpRequest" ADD CONSTRAINT "PeerHelpRequest_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerHelpRequest" ADD CONSTRAINT "PeerHelpRequest_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerHelpRequest" ADD CONSTRAINT "PeerHelpRequest_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
