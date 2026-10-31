ALTER TABLE "org_cohorts"
  ADD COLUMN "driveTitle" TEXT,
  ADD COLUMN "driveDeadline" TIMESTAMP(3),
  ADD COLUMN "minimumProgress" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "org_cohorts" ADD CONSTRAINT "cohort_minimum_progress_range" CHECK ("minimumProgress" BETWEEN 0 AND 100);
ALTER TABLE "org_cohort_enrollments"
  ADD COLUMN "followUpStatus" TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN "followUpNote" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "followUpDueAt" TIMESTAMP(3),
  ADD COLUMN "followUpUpdatedAt" TIMESTAMP(3);
ALTER TABLE "org_cohort_enrollments" ADD CONSTRAINT "cohort_follow_up_status" CHECK ("followUpStatus" IN ('NONE', 'OPEN', 'CONTACTED', 'RESOLVED'));
