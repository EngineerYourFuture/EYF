ALTER TYPE "Language" ADD VALUE 'SQL';
ALTER TABLE "problems" ADD COLUMN "executionMode" TEXT NOT NULL DEFAULT 'STDIO';
ALTER TABLE "problems" ADD CONSTRAINT "problem_execution_mode" CHECK ("executionMode" IN ('STDIO', 'SQL'));
