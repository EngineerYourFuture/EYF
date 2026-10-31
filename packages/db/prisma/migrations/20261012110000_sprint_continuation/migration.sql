CREATE TABLE "sprint_reviews" (
  "id" TEXT NOT NULL, "sprintId" TEXT NOT NULL, "orgId" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "revokedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3), "reviewerId" TEXT, "reviewerName" TEXT, "rubric" JSONB, "feedback" TEXT,
  CONSTRAINT "sprint_reviews_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sprint_reviews_sprintId_orgId_key" ON "sprint_reviews"("sprintId", "orgId");
CREATE INDEX "sprint_reviews_orgId_reviewedAt_revokedAt_idx" ON "sprint_reviews"("orgId", "reviewedAt", "revokedAt");
ALTER TABLE "sprint_reviews" ADD CONSTRAINT "sprint_reviews_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "placement_sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sprint_reviews" ADD CONSTRAINT "sprint_reviews_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "sprint_practice_rounds" (
  "id" TEXT NOT NULL, "sprintId" TEXT NOT NULL, "sequence" INTEGER NOT NULL, "bankVersion" INTEGER NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3), "result" JSONB,
  CONSTRAINT "sprint_practice_rounds_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sprint_practice_rounds_sprintId_sequence_key" ON "sprint_practice_rounds"("sprintId", "sequence");
CREATE INDEX "sprint_practice_rounds_sprintId_completedAt_idx" ON "sprint_practice_rounds"("sprintId", "completedAt");
ALTER TABLE "sprint_practice_rounds" ADD CONSTRAINT "sprint_practice_rounds_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "placement_sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
