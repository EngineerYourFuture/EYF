-- Add missing columns to SecuritySettings (were added via db push, never migrated)
ALTER TABLE "SecuritySettings" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SecuritySettings" ADD COLUMN "lockedUntil" TIMESTAMP(3);

-- Add missing columns to UserXP (were added via db push, never migrated)
ALTER TABLE "UserXP" ADD COLUMN "weeklyXp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserXP" ADD COLUMN "longestStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserXP" ADD COLUMN "weeklyResetAt" TIMESTAMP(3);

-- CreateTable: Achievement
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserAchievement
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "xpId" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DesignPatternLesson
CREATE TABLE "DesignPatternLesson" (
    "id" TEXT NOT NULL,
    "patternKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "codeExample" TEXT NOT NULL,
    "useCase" TEXT NOT NULL,
    "relatedPatterns" TEXT[],
    "planAccess" "Plan" NOT NULL DEFAULT 'free',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignPatternLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserOOPProgress
CREATE TABLE "UserOOPProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UserOOPProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SolidPrincipleLesson
CREATE TABLE "SolidPrincipleLesson" (
    "id" TEXT NOT NULL,
    "principleKey" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "badExample" TEXT NOT NULL,
    "goodExample" TEXT NOT NULL,
    "planAccess" "Plan" NOT NULL DEFAULT 'free',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolidPrincipleLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SecurityLesson
CREATE TABLE "SecurityLesson" (
    "id" TEXT NOT NULL,
    "lessonKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "planAccess" "Plan" NOT NULL DEFAULT 'free',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserSecurityProgress
CREATE TABLE "UserSecurityProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UserSecurityProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CTFChallenge
CREATE TABLE "CTFChallenge" (
    "id" TEXT NOT NULL,
    "challengeKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 100,
    "hints" TEXT[],
    "flagHash" TEXT NOT NULL,
    "planAccess" "Plan" NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CTFChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CTFAttempt
CREATE TABLE "CTFAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CTFAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SystemDesignQuestion
CREATE TABLE "SystemDesignQuestion" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "description" TEXT NOT NULL,
    "approach" TEXT NOT NULL,
    "components" JSONB NOT NULL DEFAULT '[]',
    "tradeoffs" TEXT NOT NULL,
    "planAccess" "Plan" NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemDesignQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SystemDesignAttempt
CREATE TABLE "SystemDesignAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemDesignAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserCareerProfile
CREATE TABLE "UserCareerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "track" TEXT NOT NULL DEFAULT 'student',
    "currentRole" TEXT,
    "targetRole" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "currentCompany" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "skills" TEXT[],
    "interests" TEXT[],
    "targetTimeline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCareerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LearningPath
CREATE TABLE "LearningPath" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetTrack" TEXT NOT NULL,
    "targetRole" TEXT,
    "modules" JSONB NOT NULL DEFAULT '[]',
    "estimatedWeeks" INTEGER NOT NULL DEFAULT 4,
    "planAccess" "Plan" NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserLearningPath
CREATE TABLE "UserLearningPath" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UserLearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CommunityPost
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT[],
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CommunityVote
CREATE TABLE "CommunityVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "vote" INTEGER NOT NULL,

    CONSTRAINT "CommunityVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ExpertProfile
CREATE TABLE "ExpertProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "bio" TEXT NOT NULL,
    "specializations" TEXT[],
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "hourlyRate" INTEGER,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpertProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ExpertReview
CREATE TABLE "ExpertReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpertReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");

CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

CREATE UNIQUE INDEX "DesignPatternLesson_patternKey_key" ON "DesignPatternLesson"("patternKey");

CREATE UNIQUE INDEX "UserOOPProgress_userId_patternId_key" ON "UserOOPProgress"("userId", "patternId");

CREATE UNIQUE INDEX "SolidPrincipleLesson_principleKey_key" ON "SolidPrincipleLesson"("principleKey");

CREATE UNIQUE INDEX "SecurityLesson_lessonKey_key" ON "SecurityLesson"("lessonKey");

CREATE UNIQUE INDEX "UserSecurityProgress_userId_lessonId_key" ON "UserSecurityProgress"("userId", "lessonId");

CREATE UNIQUE INDEX "CTFChallenge_challengeKey_key" ON "CTFChallenge"("challengeKey");

CREATE UNIQUE INDEX "CTFAttempt_userId_challengeId_key" ON "CTFAttempt"("userId", "challengeId");

CREATE UNIQUE INDEX "SystemDesignQuestion_slug_key" ON "SystemDesignQuestion"("slug");

CREATE UNIQUE INDEX "UserCareerProfile_userId_key" ON "UserCareerProfile"("userId");

CREATE UNIQUE INDEX "LearningPath_slug_key" ON "LearningPath"("slug");

CREATE UNIQUE INDEX "UserLearningPath_userId_pathId_key" ON "UserLearningPath"("userId", "pathId");

CREATE UNIQUE INDEX "CommunityVote_userId_postId_key" ON "CommunityVote"("userId", "postId");

CREATE UNIQUE INDEX "ExpertProfile_userId_key" ON "ExpertProfile"("userId");

CREATE UNIQUE INDEX "ExpertReview_userId_expertId_key" ON "ExpertReview"("userId", "expertId");

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_xpId_fkey" FOREIGN KEY ("xpId") REFERENCES "UserXP"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserOOPProgress" ADD CONSTRAINT "UserOOPProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserOOPProgress" ADD CONSTRAINT "UserOOPProgress_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "DesignPatternLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserSecurityProgress" ADD CONSTRAINT "UserSecurityProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserSecurityProgress" ADD CONSTRAINT "UserSecurityProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "SecurityLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CTFAttempt" ADD CONSTRAINT "CTFAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CTFAttempt" ADD CONSTRAINT "CTFAttempt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "CTFChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SystemDesignAttempt" ADD CONSTRAINT "SystemDesignAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SystemDesignAttempt" ADD CONSTRAINT "SystemDesignAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SystemDesignQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserCareerProfile" ADD CONSTRAINT "UserCareerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserLearningPath" ADD CONSTRAINT "UserLearningPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserLearningPath" ADD CONSTRAINT "UserLearningPath_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CommunityPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommunityVote" ADD CONSTRAINT "CommunityVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityVote" ADD CONSTRAINT "CommunityVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExpertProfile" ADD CONSTRAINT "ExpertProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExpertReview" ADD CONSTRAINT "ExpertReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExpertReview" ADD CONSTRAINT "ExpertReview_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "ExpertProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
