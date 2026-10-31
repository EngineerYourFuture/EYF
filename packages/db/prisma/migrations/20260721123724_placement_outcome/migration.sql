-- CreateEnum
CREATE TYPE "PlacementSource" AS ENUM ('PIPELINE', 'REFERRAL', 'SELF_REPORT');

-- CreateEnum
CREATE TYPE "PlacementOutcomeStatus" AS ENUM ('OFFERED', 'JOINED', 'RENEGED');

-- CreateTable
CREATE TABLE "placement_outcomes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "PlacementSource" NOT NULL,
    "status" "PlacementOutcomeStatus" NOT NULL DEFAULT 'JOINED',
    "offerId" TEXT,
    "orgId" TEXT,
    "companyName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "ctcInr" INTEGER,
    "verifiedAt" TIMESTAMP(3),
    "readinessOverall" INTEGER NOT NULL,
    "readinessBand" TEXT NOT NULL,
    "snapshotVersion" TEXT NOT NULL,
    "snapshot" JSONB,
    "collegeSlug" TEXT NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "placement_outcomes_offerId_key" ON "placement_outcomes"("offerId");

-- CreateIndex
CREATE INDEX "placement_outcomes_collegeSlug_verifiedAt_idx" ON "placement_outcomes"("collegeSlug", "verifiedAt");

-- CreateIndex
CREATE INDEX "placement_outcomes_userId_idx" ON "placement_outcomes"("userId");

-- CreateIndex
CREATE INDEX "placement_outcomes_source_status_idx" ON "placement_outcomes"("source", "status");

-- AddForeignKey
ALTER TABLE "placement_outcomes" ADD CONSTRAINT "placement_outcomes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_outcomes" ADD CONSTRAINT "placement_outcomes_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "org_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_outcomes" ADD CONSTRAINT "placement_outcomes_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

