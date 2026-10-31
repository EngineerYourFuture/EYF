-- CreateEnum
CREATE TYPE "PlacementStatus" AS ENUM ('PLACED', 'SEARCHING', 'NOT_PLACED', 'HIGHER_STUDIES', 'OPTED_OUT');

-- CreateTable
CREATE TABLE "colleges" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_cohorts" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "gradYear" INTEGER NOT NULL,
    "dataComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_members" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "userId" TEXT,
    "studentName" TEXT NOT NULL,
    "status" "PlacementStatus" NOT NULL DEFAULT 'SEARCHING',
    "readinessBand" TEXT,
    "snapshotVersion" TEXT,
    "outcomeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "colleges_slug_key" ON "colleges"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "batch_cohorts_collegeId_gradYear_key" ON "batch_cohorts"("collegeId", "gradYear");

-- CreateIndex
CREATE UNIQUE INDEX "batch_members_outcomeId_key" ON "batch_members"("outcomeId");

-- CreateIndex
CREATE INDEX "batch_members_batchId_status_idx" ON "batch_members"("batchId", "status");

-- AddForeignKey
ALTER TABLE "batch_cohorts" ADD CONSTRAINT "batch_cohorts_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_members" ADD CONSTRAINT "batch_members_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batch_cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_members" ADD CONSTRAINT "batch_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_members" ADD CONSTRAINT "batch_members_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "placement_outcomes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

