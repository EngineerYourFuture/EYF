ALTER TABLE "problem_solutions" ADD COLUMN "testSuiteHash" TEXT;
CREATE TABLE "placement_sprints" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "baseline" JSONB,
  "baselineCompletedAt" TIMESTAMP(3),
  "drillsCompletedAt" TIMESTAMP(3),
  "challengeNotes" JSONB,
  "challengeEvidence" JSONB,
  "challengeCompletedAt" TIMESTAMP(3),
  "retest" JSONB,
  "retestCompletedAt" TIMESTAMP(3),
  "shareToken" TEXT,
  "shareSnapshot" JSONB,
  "sharedAt" TIMESTAMP(3),
  "shareExpiresAt" TIMESTAMP(3),
  CONSTRAINT "placement_sprints_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "placement_sprints_userId_key" ON "placement_sprints"("userId");
CREATE UNIQUE INDEX "placement_sprints_shareToken_key" ON "placement_sprints"("shareToken");
ALTER TABLE "placement_sprints" ADD CONSTRAINT "placement_sprints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
