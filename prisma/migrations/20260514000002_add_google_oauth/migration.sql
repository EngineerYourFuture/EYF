-- Add googleId for Google OAuth
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- Make passwordHash nullable (OAuth users won't have a password)
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
