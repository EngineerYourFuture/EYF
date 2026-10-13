CREATE TABLE "provider_usage" (
  "id" TEXT NOT NULL, "userId" TEXT, "provider" TEXT NOT NULL, "model" TEXT NOT NULL,
  "feature" TEXT NOT NULL, "requestId" TEXT, "outcome" TEXT NOT NULL,
  "inputTokens" INTEGER NOT NULL DEFAULT 0, "outputTokens" INTEGER NOT NULL DEFAULT 0,
  "cacheReadTokens" INTEGER NOT NULL DEFAULT 0, "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
  "durationSeconds" DOUBLE PRECISION, "latencyMs" INTEGER NOT NULL, "estimatedUsd" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_usage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "provider_usage_provider_requestId_key" ON "provider_usage"("provider", "requestId");
CREATE INDEX "provider_usage_createdAt_provider_model_idx" ON "provider_usage"("createdAt", "provider", "model");
CREATE INDEX "provider_usage_userId_createdAt_idx" ON "provider_usage"("userId", "createdAt");
ALTER TABLE "provider_usage" ADD CONSTRAINT "provider_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
