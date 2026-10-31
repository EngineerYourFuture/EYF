-- CreateEnum
CREATE TYPE "Role" AS ENUM ('GUEST', 'STUDENT_FREE', 'STUDENT_BASIC', 'STUDENT_PRO', 'STUDENT_ELITE', 'MENTOR', 'MODERATOR', 'CONTENT_CREATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Persona" AS ENUM ('STUDENT', 'SWITCHER', 'DEVELOPER');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'BASIC', 'PRO', 'ELITE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'PAUSED', 'TRIALING');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('PENDING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT', 'MEMORY_LIMIT', 'RUNTIME_ERROR', 'COMPILE_ERROR', 'INTERNAL_ERROR');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('CPP', 'JAVA', 'PYTHON', 'JAVASCRIPT', 'TYPESCRIPT', 'GO', 'C', 'RUST', 'KOTLIN', 'CSHARP');

-- CreateEnum
CREATE TYPE "MockType" AS ENUM ('AI', 'PEER', 'EXPERT');

-- CreateEnum
CREATE TYPE "MockStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('PATTERN', 'TRACK', 'COMPANY_READY', 'MOCK_GRADE', 'ASSESSMENT');

-- CreateEnum
CREATE TYPE "CognitiveGame" AS ENUM ('REACTION', 'PATTERN_RECALL', 'N_BACK', 'SPATIAL', 'STROOP');

-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('OS', 'DBMS', 'CN', 'OOP');

-- CreateEnum
CREATE TYPE "BadgeTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "JobRole" AS ENUM ('SDE', 'FULLSTACK', 'BACKEND', 'FRONTEND', 'DATA', 'ML', 'DEVOPS', 'ANDROID', 'IOS', 'QA', 'PM', 'DESIGN');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SAVED', 'APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DemandLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "InternshipDuration" AS ENUM ('MONTHS_2', 'MONTHS_3', 'MONTHS_6', 'SEMESTER', 'FULL_YEAR');

-- CreateEnum
CREATE TYPE "InternshipStatus" AS ENUM ('SAVED', 'APPLIED', 'SELECTED', 'REJECTED', 'CONVERTED_PPO');

-- CreateEnum
CREATE TYPE "ReactionKind" AS ENUM ('LIKE', 'HELPFUL', 'FIRE', 'DISAGREE');

-- CreateEnum
CREATE TYPE "ForumCategory" AS ENUM ('GENERAL', 'PLACEMENTS', 'DSA', 'CORE_SUBJECTS', 'PROJECTS', 'RESUME', 'INTERVIEWS', 'OFF_TOPIC');

-- CreateEnum
CREATE TYPE "CertCriteria" AS ENUM ('ASSESSMENT_PASS', 'MANUAL');

-- CreateEnum
CREATE TYPE "KnowledgeSource" AS ENUM ('AI', 'STAFF');

-- CreateEnum
CREATE TYPE "OaSection" AS ENUM ('DSA', 'APTITUDE', 'CORE_CS', 'DEBUG', 'ENGLISH', 'PSYCHOMETRIC', 'SYSTEM_DESIGN');

-- CreateEnum
CREATE TYPE "InterviewOutcome" AS ENUM ('OFFER', 'REJECTED', 'PENDING', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PressureLevel" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'EXTREME');

-- CreateEnum
CREATE TYPE "PeerQueueStatus" AS ENUM ('WAITING', 'MATCHED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PushPlatform" AS ENUM ('IOS', 'ANDROID', 'WEB');

-- CreateEnum
CREATE TYPE "McqCategory" AS ENUM ('APTITUDE', 'LOGICAL', 'VERBAL', 'TECHNICAL');

-- CreateEnum
CREATE TYPE "CommunicationKind" AS ENUM ('INTRO', 'HR', 'BEHAVIORAL', 'SITUATIONAL');

-- CreateEnum
CREATE TYPE "CourseAudience" AS ENUM ('STAFF', 'CANDIDATE', 'BOTH');

-- CreateEnum
CREATE TYPE "OrgPlan" AS ENUM ('TRIAL', 'TEAM', 'BUSINESS', 'ENTERPRISE', 'EDUCATION');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'HR', 'RECRUITER', 'LND', 'ENG_MANAGER', 'INSTRUCTOR', 'MENTOR', 'REVIEWER', 'MEMBER', 'INTERN');

-- CreateEnum
CREATE TYPE "OrgMemberStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'OFFBOARDED');

-- CreateEnum
CREATE TYPE "TalentScope" AS ENUM ('POOL_ANON', 'POOL_FULL');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('OPEN', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('SOURCED', 'SCREEN', 'ASSESSMENT', 'INTERVIEW', 'DECISION', 'OFFER', 'HIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CandidateSource" AS ENUM ('ELITE_POOL', 'INTERNAL', 'APPLY', 'REFERRAL');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AssessmentPurpose" AS ENUM ('TRAINING', 'CERTIFICATION', 'HIRING');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EvidenceSource" AS ENUM ('LESSON', 'ASSESSMENT', 'JUDGED_CODE', 'PROJECT_REVIEW', 'MOCK', 'CERT', 'MENTOR_RATING', 'IMPORT');

-- CreateEnum
CREATE TYPE "PathItemType" AS ENUM ('COURSE');

-- CreateEnum
CREATE TYPE "CohortEnrollStatus" AS ENUM ('ENROLLED', 'COMPLETED', 'DROPPED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('RICH_TEXT', 'VIDEO', 'JUDGED_CODE', 'QUIZ_INLINE', 'EMBED', 'FILE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "college" TEXT,
    "graduationYear" INTEGER,
    "targetRole" TEXT,
    "persona" "Persona",
    "role" "Role" NOT NULL DEFAULT 'STUDENT_FREE',
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_days" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "bonusXp" INTEGER NOT NULL DEFAULT 0,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "userId" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "githubUrl" TEXT,
    "linkedinUrl" TEXT,
    "leetcodeUrl" TEXT,
    "resumeUrl" TEXT,
    "currentXp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalSolved" INTEGER NOT NULL DEFAULT 0,
    "preferredLanguage" "Language" NOT NULL DEFAULT 'CPP',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "razorpaySubId" TEXT,
    "razorpayPlanId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "amountInr" INTEGER NOT NULL DEFAULT 0,
    "intervalMonths" INTEGER NOT NULL DEFAULT 1,
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "razorpayInvoiceId" TEXT,
    "amountInr" INTEGER NOT NULL,
    "gstInr" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problems" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "topics" TEXT[],
    "patterns" TEXT[],
    "companies" TEXT[],
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "acceptanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "totalAccepted" INTEGER NOT NULL DEFAULT 0,
    "timeLimitMs" INTEGER NOT NULL DEFAULT 2000,
    "memoryLimitKb" INTEGER NOT NULL DEFAULT 262144,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "starter_code" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "starter_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expected" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_solutions" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "code" TEXT NOT NULL,
    "verdict" "Verdict" NOT NULL DEFAULT 'PENDING',
    "runtimeMs" INTEGER,
    "memoryKb" INTEGER,
    "passedTests" INTEGER NOT NULL DEFAULT 0,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "errorMsg" TEXT,
    "judge0Token" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problem_solutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editorials" (
    "problemId" TEXT NOT NULL,
    "textSolution" TEXT NOT NULL,
    "videoUrl" TEXT,
    "timeComplexity" TEXT NOT NULL,
    "spaceComplexity" TEXT NOT NULL,
    "approach" TEXT,
    "pitfalls" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editorials_pkey" PRIMARY KEY ("problemId")
);

-- CreateTable
CREATE TABLE "problem_variants" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "twistExplanation" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL DEFAULT 'claude-sonnet',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problem_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roadmaps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateSlug" TEXT NOT NULL,
    "currentDay" INTEGER NOT NULL DEFAULT 1,
    "completionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "title" TEXT,
    "targetRole" TEXT,
    "targetCompany" TEXT,
    "weeks" INTEGER,
    "hoursPerDay" INTEGER,
    "plan" JSONB,

    CONSTRAINT "user_roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_streaks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "problemsSolved" INTEGER NOT NULL DEFAULT 0,
    "minutesSpent" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "moodScore" INTEGER,

    CONSTRAINT "daily_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "gapAnalysis" JSONB NOT NULL,
    "placementProbability" JSONB NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cognitive_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "game" "CognitiveGame" NOT NULL,
    "score" INTEGER NOT NULL,
    "accuracyPct" DOUBLE PRECISION NOT NULL,
    "tabSwitchCount" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cognitive_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_sessions" (
    "id" TEXT NOT NULL,
    "type" "MockType" NOT NULL,
    "status" "MockStatus" NOT NULL DEFAULT 'SCHEDULED',
    "candidateId" TEXT NOT NULL,
    "peerId" TEXT,
    "mentorId" TEXT,
    "company" TEXT,
    "durationMin" INTEGER NOT NULL DEFAULT 45,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "feedback" JSONB,
    "transcript" JSONB,
    "transcriptUrl" TEXT,
    "recordingUrl" TEXT,
    "problemFocus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mock_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "yearsExp" INTEGER NOT NULL,
    "expertise" TEXT[],
    "hourlyRateInr" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationDocs" TEXT[],
    "razorpayAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_slots" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "booked" BOOLEAN NOT NULL DEFAULT false,
    "mockSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL,
    "title" TEXT NOT NULL,
    "score" INTEGER,
    "metadata" JSONB,
    "verificationCode" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "linkedinShared" BOOLEAN NOT NULL DEFAULT false,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orgId" TEXT,
    "templateId" TEXT,
    "skillsAsserted" JSONB,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_certificate_templates" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skills" JSONB NOT NULL,
    "criteria" "CertCriteria" NOT NULL DEFAULT 'MANUAL',
    "blueprintId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcq_bank_questions" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "category" "McqCategory" NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "prompt" TEXT NOT NULL,
    "choices" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "companies" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcq_bank_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_bank_questions" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "area" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "prompt" TEXT NOT NULL,
    "choices" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_bank_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_prompt_bank" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "kind" "CommunicationKind" NOT NULL,
    "question" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "covers" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_prompt_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_sim_blueprints" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "blurb" TEXT NOT NULL,
    "usedBy" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_sim_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_entries" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "tags" TEXT[],
    "source" "KnowledgeSource" NOT NULL DEFAULT 'AI',
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "askCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_shares" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theory_notes" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "estMinutes" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theory_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "topic" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,
    "easiness" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),

    CONSTRAINT "flashcard_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'My Resume',
    "json" JSONB NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'classic',
    "atsScore" INTEGER,
    "atsBreakdown" JSONB,
    "pdfUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tier" "BadgeTier" NOT NULL DEFAULT 'BRONZE',
    "icon" TEXT NOT NULL DEFAULT 'trophy',
    "xpReward" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_ideas" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "techStack" TEXT[],
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "weeks" INTEGER NOT NULL DEFAULT 4,
    "tags" TEXT[],
    "outcomes" TEXT[],
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "githubUrl" TEXT,
    "liveUrl" TEXT,
    "notes" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "user_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "role" "JobRole" NOT NULL,
    "location" TEXT NOT NULL,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "salaryMinInr" INTEGER,
    "salaryMaxInr" INTEGER,
    "experienceMin" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "applyUrl" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closesAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SAVED',
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_tracks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'rocket',
    "salaryMinInr" INTEGER NOT NULL,
    "salaryMaxInr" INTEGER NOT NULL,
    "demand" "DemandLevel" NOT NULL DEFAULT 'HIGH',
    "weeks" INTEGER NOT NULL DEFAULT 12,
    "patterns" TEXT[],
    "topics" TEXT[],
    "companies" TEXT[],
    "curriculum" JSONB NOT NULL,
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tracks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentWeek" INTEGER NOT NULL DEFAULT 1,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_threads" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "category" "ForumCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "lastPostAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_posts" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_reactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadId" TEXT,
    "postId" TEXT,
    "kind" "ReactionKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internships" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "duration" "InternshipDuration" NOT NULL DEFAULT 'MONTHS_3',
    "stipendInr" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "applyUrl" TEXT NOT NULL,
    "eligibility" TEXT,
    "ppoConversion" DOUBLE PRECISION,
    "deadlineAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_internships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "internshipId" TEXT NOT NULL,
    "status" "InternshipStatus" NOT NULL DEFAULT 'SAVED',
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_internships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oa_reports" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "driveDate" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "sections" "OaSection"[],
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT NOT NULL,
    "patterns" TEXT[],
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oa_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_experiences" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "outcome" "InterviewOutcome" NOT NULL DEFAULT 'PENDING',
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "rounds" INTEGER NOT NULL DEFAULT 1,
    "body" TEXT NOT NULL,
    "tips" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_payouts" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "mockSessionId" TEXT NOT NULL,
    "amountInr" INTEGER NOT NULL,
    "platformFeeInr" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "razorpayTransferId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "mentor_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pressure_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT,
    "level" "PressureLevel" NOT NULL DEFAULT 'NORMAL',
    "targetSeconds" INTEGER NOT NULL,
    "actualSeconds" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "anxietyBefore" INTEGER,
    "anxietyAfter" INTEGER,
    "confidence" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "pressure_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peer_queue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PeerQueueStatus" NOT NULL DEFAULT 'WAITING',
    "problemFocus" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchedMockId" TEXT,

    CONSTRAINT "peer_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "PushPlatform" NOT NULL,
    "token" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcq_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "McqCategory" NOT NULL,
    "company" TEXT,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "detail" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcq_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_drills" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "kind" "CommunicationKind" NOT NULL,
    "transcript" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" JSONB NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_drills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_preps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectTitle" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "techStack" TEXT[],
    "questions" JSONB NOT NULL,
    "tips" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_preps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "logoUrl" TEXT,
    "brandColor" TEXT,
    "plan" "OrgPlan" NOT NULL DEFAULT 'TRIAL',
    "seatsLicensed" INTEGER NOT NULL DEFAULT 10,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_members" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roles" "OrgRole"[],
    "departmentId" TEXT,
    "title" TEXT,
    "status" "OrgMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_departments" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "org_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_teams" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "org_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_team_members" (
    "teamId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "org_team_members_pkey" PRIMARY KEY ("teamId","memberId")
);

-- CreateTable
CREATE TABLE "org_api_keys" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_webhook_endpoints" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "TalentScope" NOT NULL DEFAULT 'POOL_ANON',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "talent_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_requisitions" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "roleBarId" TEXT,
    "minReadiness" INTEGER NOT NULL DEFAULT 0,
    "status" "RequisitionStatus" NOT NULL DEFAULT 'OPEN',
    "hiringManagerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_offers" (
    "id" TEXT NOT NULL,
    "reqId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ctcInr" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "draftedById" TEXT NOT NULL,
    "sentById" TEXT,
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_pipeline_candidates" (
    "id" TEXT NOT NULL,
    "reqId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "CandidateSource" NOT NULL DEFAULT 'ELITE_POOL',
    "stage" "PipelineStage" NOT NULL DEFAULT 'SOURCED',
    "fitScore" INTEGER,
    "note" TEXT,
    "evidenceSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_pipeline_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_assessment_blueprints" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skillId" TEXT,
    "category" "McqCategory" NOT NULL DEFAULT 'TECHNICAL',
    "questionCount" INTEGER NOT NULL DEFAULT 10,
    "durationMin" INTEGER NOT NULL DEFAULT 20,
    "passingScore" INTEGER NOT NULL DEFAULT 60,
    "proctorLevel" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_assessment_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_assessment_runs" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "purpose" "AssessmentPurpose" NOT NULL DEFAULT 'TRAINING',
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "windowEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_assessment_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_assessment_attempts" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionIds" TEXT[],
    "answers" JSONB,
    "score" INTEGER,
    "integrityScore" INTEGER NOT NULL DEFAULT 100,
    "proctorEvents" INTEGER NOT NULL DEFAULT 0,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "org_assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "parentId" TEXT,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_evidence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "skillId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "sourceType" "EvidenceSource" NOT NULL,
    "sourceId" TEXT,
    "decayHalfLifeDays" INTEGER NOT NULL DEFAULT 180,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "skillId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_role_bars" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "basedOnTier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_role_bars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_role_bar_skills" (
    "id" TEXT NOT NULL,
    "roleBarId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "requiredLevel" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "org_role_bar_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_learning_paths" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_path_items" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "itemType" "PathItemType" NOT NULL DEFAULT 'COURSE',
    "courseId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "org_path_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_cohorts" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_cohort_enrollments" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "CohortEnrollStatus" NOT NULL DEFAULT 'ENROLLED',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "stuckFlag" BOOLEAN NOT NULL DEFAULT false,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_cohort_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_usage_counters" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "org_usage_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_invites" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roles" "OrgRole"[],
    "token" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_courses" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "audience" "CourseAudience" NOT NULL DEFAULT 'BOTH',
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "estMinutes" INTEGER NOT NULL DEFAULT 0,
    "authorMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_course_versions" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "publishedById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_course_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_lessons" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "type" "LessonType" NOT NULL DEFAULT 'RICH_TEXT',
    "blocks" JSONB,
    "estMinutes" INTEGER NOT NULL DEFAULT 5,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "skillId" TEXT,
    "skillLevel" INTEGER NOT NULL DEFAULT 60,

    CONSTRAINT "lms_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internship_slots" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT,
    "stipend" TEXT,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "eliteOnly" BOOLEAN NOT NULL DEFAULT true,
    "openUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internship_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_enrollments" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_lesson_progress" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_college_idx" ON "users"("college");

-- CreateIndex
CREATE INDEX "mission_days_userId_date_idx" ON "mission_days"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "mission_days_userId_date_key" ON "mission_days"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_razorpaySubId_key" ON "subscriptions"("razorpaySubId");

-- CreateIndex
CREATE INDEX "subscriptions_plan_status_idx" ON "subscriptions"("plan", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_razorpayInvoiceId_key" ON "invoices"("razorpayInvoiceId");

-- CreateIndex
CREATE INDEX "invoices_subscriptionId_idx" ON "invoices"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "problems_slug_key" ON "problems"("slug");

-- CreateIndex
CREATE INDEX "problems_difficulty_idx" ON "problems"("difficulty");

-- CreateIndex
CREATE INDEX "problems_patterns_idx" ON "problems"("patterns");

-- CreateIndex
CREATE INDEX "problems_companies_idx" ON "problems"("companies");

-- CreateIndex
CREATE UNIQUE INDEX "starter_code_problemId_language_key" ON "starter_code"("problemId", "language");

-- CreateIndex
CREATE INDEX "test_cases_problemId_idx" ON "test_cases"("problemId");

-- CreateIndex
CREATE INDEX "problem_solutions_userId_submittedAt_idx" ON "problem_solutions"("userId", "submittedAt");

-- CreateIndex
CREATE INDEX "problem_solutions_problemId_verdict_idx" ON "problem_solutions"("problemId", "verdict");

-- CreateIndex
CREATE INDEX "problem_variants_problemId_idx" ON "problem_variants"("problemId");

-- CreateIndex
CREATE INDEX "user_roadmaps_userId_idx" ON "user_roadmaps"("userId");

-- CreateIndex
CREATE INDEX "daily_streaks_userId_date_idx" ON "daily_streaks"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_streaks_userId_date_key" ON "daily_streaks"("userId", "date");

-- CreateIndex
CREATE INDEX "assessment_sessions_userId_idx" ON "assessment_sessions"("userId");

-- CreateIndex
CREATE INDEX "cognitive_sessions_userId_game_idx" ON "cognitive_sessions"("userId", "game");

-- CreateIndex
CREATE INDEX "mock_sessions_candidateId_idx" ON "mock_sessions"("candidateId");

-- CreateIndex
CREATE INDEX "mock_sessions_mentorId_idx" ON "mock_sessions"("mentorId");

-- CreateIndex
CREATE INDEX "mock_sessions_status_scheduledFor_idx" ON "mock_sessions"("status", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "mentors_userId_key" ON "mentors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "mentors_razorpayAccountId_key" ON "mentors"("razorpayAccountId");

-- CreateIndex
CREATE INDEX "mentors_company_verified_idx" ON "mentors"("company", "verified");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_slots_mockSessionId_key" ON "mentor_slots"("mockSessionId");

-- CreateIndex
CREATE INDEX "mentor_slots_mentorId_startAt_idx" ON "mentor_slots"("mentorId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verificationCode_key" ON "certificates"("verificationCode");

-- CreateIndex
CREATE INDEX "certificates_userId_idx" ON "certificates"("userId");

-- CreateIndex
CREATE INDEX "certificates_orgId_idx" ON "certificates"("orgId");

-- CreateIndex
CREATE INDEX "org_certificate_templates_orgId_idx" ON "org_certificate_templates"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "mcq_bank_questions_sourceId_key" ON "mcq_bank_questions"("sourceId");

-- CreateIndex
CREATE INDEX "mcq_bank_questions_category_active_idx" ON "mcq_bank_questions"("category", "active");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_bank_questions_sourceId_key" ON "assessment_bank_questions"("sourceId");

-- CreateIndex
CREATE INDEX "assessment_bank_questions_area_active_idx" ON "assessment_bank_questions"("area", "active");

-- CreateIndex
CREATE UNIQUE INDEX "communication_prompt_bank_sourceId_key" ON "communication_prompt_bank"("sourceId");

-- CreateIndex
CREATE INDEX "communication_prompt_bank_kind_active_idx" ON "communication_prompt_bank"("kind", "active");

-- CreateIndex
CREATE UNIQUE INDEX "company_sim_blueprints_slug_key" ON "company_sim_blueprints"("slug");

-- CreateIndex
CREATE INDEX "knowledge_entries_topic_active_idx" ON "knowledge_entries"("topic", "active");

-- CreateIndex
CREATE UNIQUE INDEX "score_shares_code_key" ON "score_shares"("code");

-- CreateIndex
CREATE INDEX "score_shares_userId_idx" ON "score_shares"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "theory_notes_slug_key" ON "theory_notes"("slug");

-- CreateIndex
CREATE INDEX "theory_notes_subject_orderIndex_idx" ON "theory_notes"("subject", "orderIndex");

-- CreateIndex
CREATE INDEX "flashcards_subject_topic_idx" ON "flashcards"("subject", "topic");

-- CreateIndex
CREATE INDEX "flashcard_reviews_userId_dueAt_idx" ON "flashcard_reviews"("userId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "flashcard_reviews_userId_flashcardId_key" ON "flashcard_reviews"("userId", "flashcardId");

-- CreateIndex
CREATE INDEX "resumes_userId_idx" ON "resumes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "badges_slug_key" ON "badges"("slug");

-- CreateIndex
CREATE INDEX "user_badges_userId_idx" ON "user_badges"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "project_ideas_slug_key" ON "project_ideas"("slug");

-- CreateIndex
CREATE INDEX "project_ideas_difficulty_idx" ON "project_ideas"("difficulty");

-- CreateIndex
CREATE INDEX "user_projects_userId_idx" ON "user_projects"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_projects_userId_ideaId_key" ON "user_projects"("userId", "ideaId");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_slug_key" ON "jobs"("slug");

-- CreateIndex
CREATE INDEX "jobs_role_isActive_idx" ON "jobs"("role", "isActive");

-- CreateIndex
CREATE INDEX "jobs_company_idx" ON "jobs"("company");

-- CreateIndex
CREATE INDEX "job_applications_userId_status_idx" ON "job_applications"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_userId_jobId_key" ON "job_applications"("userId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "career_tracks_slug_key" ON "career_tracks"("slug");

-- CreateIndex
CREATE INDEX "user_tracks_userId_isPrimary_idx" ON "user_tracks"("userId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "user_tracks_userId_trackId_key" ON "user_tracks"("userId", "trackId");

-- CreateIndex
CREATE UNIQUE INDEX "forum_threads_slug_key" ON "forum_threads"("slug");

-- CreateIndex
CREATE INDEX "forum_threads_category_pinned_lastPostAt_idx" ON "forum_threads"("category", "pinned", "lastPostAt");

-- CreateIndex
CREATE INDEX "forum_posts_threadId_createdAt_idx" ON "forum_posts"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "forum_reactions_threadId_idx" ON "forum_reactions"("threadId");

-- CreateIndex
CREATE INDEX "forum_reactions_postId_idx" ON "forum_reactions"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "forum_reactions_userId_threadId_postId_kind_key" ON "forum_reactions"("userId", "threadId", "postId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "internships_slug_key" ON "internships"("slug");

-- CreateIndex
CREATE INDEX "internships_role_isActive_idx" ON "internships"("role", "isActive");

-- CreateIndex
CREATE INDEX "user_internships_userId_status_idx" ON "user_internships"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_internships_userId_internshipId_key" ON "user_internships"("userId", "internshipId");

-- CreateIndex
CREATE INDEX "oa_reports_company_driveDate_idx" ON "oa_reports"("company", "driveDate");

-- CreateIndex
CREATE INDEX "oa_reports_role_idx" ON "oa_reports"("role");

-- CreateIndex
CREATE INDEX "interview_experiences_company_createdAt_idx" ON "interview_experiences"("company", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_payouts_mockSessionId_key" ON "mentor_payouts"("mockSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_payouts_razorpayTransferId_key" ON "mentor_payouts"("razorpayTransferId");

-- CreateIndex
CREATE INDEX "mentor_payouts_mentorId_status_idx" ON "mentor_payouts"("mentorId", "status");

-- CreateIndex
CREATE INDEX "pressure_sessions_userId_startedAt_idx" ON "pressure_sessions"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "peer_queue_userId_key" ON "peer_queue"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "peer_queue_matchedMockId_key" ON "peer_queue"("matchedMockId");

-- CreateIndex
CREATE INDEX "peer_queue_status_joinedAt_idx" ON "peer_queue"("status", "joinedAt");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE INDEX "push_tokens_userId_idx" ON "push_tokens"("userId");

-- CreateIndex
CREATE INDEX "mcq_attempts_userId_category_idx" ON "mcq_attempts"("userId", "category");

-- CreateIndex
CREATE INDEX "mcq_attempts_userId_completedAt_idx" ON "mcq_attempts"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "communication_drills_userId_kind_idx" ON "communication_drills"("userId", "kind");

-- CreateIndex
CREATE INDEX "communication_drills_userId_createdAt_idx" ON "communication_drills"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "project_preps_userId_createdAt_idx" ON "project_preps"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "user_sessions_userId_createdAt_idx" ON "user_sessions"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_accessCode_key" ON "organizations"("accessCode");

-- CreateIndex
CREATE INDEX "org_members_orgId_departmentId_idx" ON "org_members"("orgId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "org_members_orgId_userId_key" ON "org_members"("orgId", "userId");

-- CreateIndex
CREATE INDEX "org_departments_orgId_idx" ON "org_departments"("orgId");

-- CreateIndex
CREATE INDEX "org_teams_orgId_idx" ON "org_teams"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "org_api_keys_prefix_key" ON "org_api_keys"("prefix");

-- CreateIndex
CREATE INDEX "org_api_keys_orgId_idx" ON "org_api_keys"("orgId");

-- CreateIndex
CREATE INDEX "org_webhook_endpoints_orgId_idx" ON "org_webhook_endpoints"("orgId");

-- CreateIndex
CREATE INDEX "org_webhook_deliveries_endpointId_createdAt_idx" ON "org_webhook_deliveries"("endpointId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "talent_consents_userId_key" ON "talent_consents"("userId");

-- CreateIndex
CREATE INDEX "org_requisitions_orgId_status_idx" ON "org_requisitions"("orgId", "status");

-- CreateIndex
CREATE INDEX "org_offers_userId_status_idx" ON "org_offers"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "org_offers_reqId_userId_key" ON "org_offers"("reqId", "userId");

-- CreateIndex
CREATE INDEX "org_pipeline_candidates_reqId_stage_idx" ON "org_pipeline_candidates"("reqId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "org_pipeline_candidates_reqId_userId_key" ON "org_pipeline_candidates"("reqId", "userId");

-- CreateIndex
CREATE INDEX "org_assessment_blueprints_orgId_idx" ON "org_assessment_blueprints"("orgId");

-- CreateIndex
CREATE INDEX "org_assessment_runs_orgId_idx" ON "org_assessment_runs"("orgId");

-- CreateIndex
CREATE INDEX "org_assessment_attempts_runId_idx" ON "org_assessment_attempts"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "org_assessment_attempts_runId_userId_key" ON "org_assessment_attempts"("runId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE INDEX "skill_evidence_userId_skillId_idx" ON "skill_evidence"("userId", "skillId");

-- CreateIndex
CREATE INDEX "skill_evidence_orgId_skillId_idx" ON "skill_evidence"("orgId", "skillId");

-- CreateIndex
CREATE INDEX "skill_snapshots_orgId_skillId_idx" ON "skill_snapshots"("orgId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_snapshots_userId_orgId_skillId_key" ON "skill_snapshots"("userId", "orgId", "skillId");

-- CreateIndex
CREATE INDEX "org_role_bars_orgId_idx" ON "org_role_bars"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "org_role_bar_skills_roleBarId_skillId_key" ON "org_role_bar_skills"("roleBarId", "skillId");

-- CreateIndex
CREATE INDEX "org_learning_paths_orgId_idx" ON "org_learning_paths"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "org_path_items_pathId_courseId_key" ON "org_path_items"("pathId", "courseId");

-- CreateIndex
CREATE INDEX "org_cohorts_orgId_idx" ON "org_cohorts"("orgId");

-- CreateIndex
CREATE INDEX "org_cohort_enrollments_cohortId_stuckFlag_idx" ON "org_cohort_enrollments"("cohortId", "stuckFlag");

-- CreateIndex
CREATE UNIQUE INDEX "org_cohort_enrollments_cohortId_memberId_key" ON "org_cohort_enrollments"("cohortId", "memberId");

-- CreateIndex
CREATE INDEX "org_usage_counters_orgId_period_idx" ON "org_usage_counters"("orgId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "org_usage_counters_orgId_metric_period_key" ON "org_usage_counters"("orgId", "metric", "period");

-- CreateIndex
CREATE UNIQUE INDEX "org_invites_token_key" ON "org_invites"("token");

-- CreateIndex
CREATE INDEX "org_invites_orgId_idx" ON "org_invites"("orgId");

-- CreateIndex
CREATE INDEX "lms_courses_orgId_status_idx" ON "lms_courses"("orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "lms_course_versions_courseId_version_key" ON "lms_course_versions"("courseId", "version");

-- CreateIndex
CREATE INDEX "lms_lessons_courseId_idx" ON "lms_lessons"("courseId");

-- CreateIndex
CREATE INDEX "internship_slots_orgId_idx" ON "internship_slots"("orgId");

-- CreateIndex
CREATE INDEX "lms_enrollments_userId_idx" ON "lms_enrollments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "lms_enrollments_courseId_userId_key" ON "lms_enrollments"("courseId", "userId");

-- CreateIndex
CREATE INDEX "lms_lesson_progress_userId_idx" ON "lms_lesson_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "lms_lesson_progress_lessonId_userId_key" ON "lms_lesson_progress"("lessonId", "userId");

-- AddForeignKey
ALTER TABLE "mission_days" ADD CONSTRAINT "mission_days_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "starter_code" ADD CONSTRAINT "starter_code_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_solutions" ADD CONSTRAINT "problem_solutions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_solutions" ADD CONSTRAINT "problem_solutions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editorials" ADD CONSTRAINT "editorials_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_variants" ADD CONSTRAINT "problem_variants_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roadmaps" ADD CONSTRAINT "user_roadmaps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_streaks" ADD CONSTRAINT "daily_streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cognitive_sessions" ADD CONSTRAINT "cognitive_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_sessions" ADD CONSTRAINT "mock_sessions_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_sessions" ADD CONSTRAINT "mock_sessions_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_sessions" ADD CONSTRAINT "mock_sessions_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "mentors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentors" ADD CONSTRAINT "mentors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_slots" ADD CONSTRAINT "mentor_slots_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "mentors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_certificate_templates" ADD CONSTRAINT "org_certificate_templates_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_shares" ADD CONSTRAINT "score_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_projects" ADD CONSTRAINT "user_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_projects" ADD CONSTRAINT "user_projects_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "project_ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tracks" ADD CONSTRAINT "user_tracks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tracks" ADD CONSTRAINT "user_tracks_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "career_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "forum_posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "forum_reactions" ADD CONSTRAINT "forum_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_reactions" ADD CONSTRAINT "forum_reactions_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_reactions" ADD CONSTRAINT "forum_reactions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_internships" ADD CONSTRAINT "user_internships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_internships" ADD CONSTRAINT "user_internships_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "internships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oa_reports" ADD CONSTRAINT "oa_reports_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_experiences" ADD CONSTRAINT "interview_experiences_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_payouts" ADD CONSTRAINT "mentor_payouts_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "mentors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pressure_sessions" ADD CONSTRAINT "pressure_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pressure_sessions" ADD CONSTRAINT "pressure_sessions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_queue" ADD CONSTRAINT "peer_queue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcq_attempts" ADD CONSTRAINT "mcq_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_drills" ADD CONSTRAINT "communication_drills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_preps" ADD CONSTRAINT "project_preps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "org_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_departments" ADD CONSTRAINT "org_departments_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_departments" ADD CONSTRAINT "org_departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "org_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_teams" ADD CONSTRAINT "org_teams_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_teams" ADD CONSTRAINT "org_teams_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "org_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_team_members" ADD CONSTRAINT "org_team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "org_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_team_members" ADD CONSTRAINT "org_team_members_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "org_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_api_keys" ADD CONSTRAINT "org_api_keys_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_webhook_endpoints" ADD CONSTRAINT "org_webhook_endpoints_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_webhook_deliveries" ADD CONSTRAINT "org_webhook_deliveries_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "org_webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_consents" ADD CONSTRAINT "talent_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_requisitions" ADD CONSTRAINT "org_requisitions_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_offers" ADD CONSTRAINT "org_offers_reqId_fkey" FOREIGN KEY ("reqId") REFERENCES "org_requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_pipeline_candidates" ADD CONSTRAINT "org_pipeline_candidates_reqId_fkey" FOREIGN KEY ("reqId") REFERENCES "org_requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_assessment_blueprints" ADD CONSTRAINT "org_assessment_blueprints_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_assessment_runs" ADD CONSTRAINT "org_assessment_runs_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_assessment_runs" ADD CONSTRAINT "org_assessment_runs_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "org_assessment_blueprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_assessment_attempts" ADD CONSTRAINT "org_assessment_attempts_runId_fkey" FOREIGN KEY ("runId") REFERENCES "org_assessment_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_role_bars" ADD CONSTRAINT "org_role_bars_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_role_bar_skills" ADD CONSTRAINT "org_role_bar_skills_roleBarId_fkey" FOREIGN KEY ("roleBarId") REFERENCES "org_role_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_learning_paths" ADD CONSTRAINT "org_learning_paths_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_path_items" ADD CONSTRAINT "org_path_items_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "org_learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_path_items" ADD CONSTRAINT "org_path_items_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_cohorts" ADD CONSTRAINT "org_cohorts_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_cohorts" ADD CONSTRAINT "org_cohorts_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "org_learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_cohort_enrollments" ADD CONSTRAINT "org_cohort_enrollments_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "org_cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_cohort_enrollments" ADD CONSTRAINT "org_cohort_enrollments_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "org_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_invites" ADD CONSTRAINT "org_invites_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_courses" ADD CONSTRAINT "lms_courses_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_course_versions" ADD CONSTRAINT "lms_course_versions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_lessons" ADD CONSTRAINT "lms_lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_lessons" ADD CONSTRAINT "lms_lessons_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_slots" ADD CONSTRAINT "internship_slots_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_enrollments" ADD CONSTRAINT "lms_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_lesson_progress" ADD CONSTRAINT "lms_lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lms_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

