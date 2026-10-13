CREATE TABLE "lms_media_assets" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lms_media_assets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lms_media_assets_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "lms_media_assets_orgId_idx" ON "lms_media_assets"("orgId");
ALTER TABLE "lms_media_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lms_media_assets" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "lms_media_assets"
  USING (current_setting('app.org_id', true) IS NULL OR current_setting('app.org_id', true) = '' OR "orgId" = current_setting('app.org_id', true));
ALTER TABLE "org_invites"
  ADD COLUMN "emailStatus" TEXT NOT NULL DEFAULT 'NOT_SENT',
  ADD COLUMN "emailAttemptedAt" TIMESTAMP(3),
  ADD COLUMN "emailSentAt" TIMESTAMP(3),
  ADD COLUMN "remindedAt" TIMESTAMP(3);
