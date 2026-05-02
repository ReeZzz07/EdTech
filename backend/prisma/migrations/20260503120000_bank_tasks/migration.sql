-- CreateTable
CREATE TABLE "BankTask" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "topicTag" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankTask_subjectId_isPublished_sortOrder_idx" ON "BankTask"("subjectId", "isPublished", "sortOrder");

-- AddForeignKey
ALTER TABLE "BankTask" ADD CONSTRAINT "BankTask_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "bankTaskId" TEXT;

-- CreateIndex
CREATE INDEX "Problem_bankTaskId_idx" ON "Problem"("bankTaskId");

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_bankTaskId_fkey" FOREIGN KEY ("bankTaskId") REFERENCES "BankTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
