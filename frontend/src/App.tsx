import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import { UserProvider } from './contexts/UserContext';
import { XPToastContainer } from './components/XPToast';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AuthorityLoginPage } from './pages/AuthorityLoginPage';
import { HomePage } from './pages/HomePage';
import { ProblemsPage } from './pages/ProblemsPage';
import { ProblemDetailPage } from './pages/ProblemDetailPage';
import { CoreSubjectsPage } from './pages/CoreSubjectsPage';
import { SubjectDetailPage } from './pages/SubjectDetailPage';
import { SubjectTopicPage } from './pages/SubjectTopicPage';
import { PlacementPage } from './pages/PlacementPage';
import { PlacementTrackPage } from './pages/PlacementTrackPage';
import { MentorshipPage } from './pages/MentorshipPage';
import { ResumePage } from './pages/ResumePage';
import { TechSkillsPage } from './pages/TechSkillsPage';
import { VisualizerPage } from './pages/VisualizerPage';
import { SubmissionPage } from './pages/SubmissionPage';
import { SecurityPage } from './pages/SecurityPage';
import { BillingPage } from './pages/BillingPage';
import { SupportPage } from './pages/SupportPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { AuthorityQueuePage } from './pages/AuthorityQueuePage';
import { AdminOperationsPage } from './pages/AdminOperationsPage';
import { AdminProblemsPage } from './pages/AdminProblemsPage';
import { OOPPage } from './pages/OOPPage';
import { CybersecurityPage } from './pages/CybersecurityPage';
import { SystemDesignPage } from './pages/SystemDesignPage';
import { CareerPathPage } from './pages/CareerPathPage';
import { CommunityPage } from './pages/CommunityPage';
import { ExpertsPage } from './pages/ExpertsPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { MockInterviewPage } from './pages/MockInterviewPage';
import { CheatSheetsPage } from './pages/CheatSheetsPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { StudyPlanPage } from './pages/StudyPlanPage';
import { InterviewTrackerPage } from './pages/InterviewTrackerPage';
import { DailyChallengePage } from './pages/DailyChallengePage';
import { PatternQuizPage } from './pages/PatternQuizPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { ProgressPage } from './pages/ProgressPage';
import { ExperiencesPage } from './pages/ExperiencesPage';
import { WeeklyContestPage } from './pages/WeeklyContestPage';
import { CompanyPrepPage } from './pages/CompanyPrepPage';

export default function App() {
  return (
    <UserProvider>
      <XPToastContainer />
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/login" element={<Navigate to="/login" replace />} />
      <Route path="/auth/register" element={<Navigate to="/login?tab=register" replace />} />
      <Route path="/authority/login" element={<AuthorityLoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      <Route path="/onboarding" element={<RequireAuth zone="public"><OnboardingPage /></RequireAuth>} />

      {/* Authenticated app routes */}
      <Route
        path="/app/dashboard"
        element={<RequireAuth zone="public"><HomePage /></RequireAuth>}
      />
      <Route
        path="/app/home"
        element={<Navigate to="/app/dashboard" replace />}
      />
      <Route
        path="/app/problems"
        element={<RequireAuth zone="public"><ProblemsPage /></RequireAuth>}
      />
      <Route
        path="/app/problems/:id"
        element={<RequireAuth zone="public"><ProblemDetailPage /></RequireAuth>}
      />
      <Route
        path="/app/subjects"
        element={<RequireAuth zone="public"><CoreSubjectsPage /></RequireAuth>}
      />
      <Route
        path="/app/subjects/:subjectId"
        element={<RequireAuth zone="public"><SubjectDetailPage /></RequireAuth>}
      />
      <Route
        path="/app/subjects/:subjectId/:topicId"
        element={<RequireAuth zone="public"><SubjectTopicPage /></RequireAuth>}
      />
      <Route
        path="/app/core-subjects"
        element={<Navigate to="/app/subjects" replace />}
      />
      <Route
        path="/app/placement"
        element={<RequireAuth zone="public"><PlacementPage /></RequireAuth>}
      />
      <Route
        path="/app/placement/:trackId"
        element={<RequireAuth zone="public"><PlacementTrackPage /></RequireAuth>}
      />
      <Route
        path="/app/mentorship"
        element={<RequireAuth zone="public"><MentorshipPage /></RequireAuth>}
      />
      <Route
        path="/app/resume"
        element={<RequireAuth zone="public"><ResumePage /></RequireAuth>}
      />
      <Route
        path="/app/skills"
        element={<RequireAuth zone="public"><TechSkillsPage /></RequireAuth>}
      />
      <Route
        path="/app/tech-skills"
        element={<Navigate to="/app/skills" replace />}
      />
      <Route
        path="/app/visualizer"
        element={<RequireAuth zone="public"><VisualizerPage /></RequireAuth>}
      />
      <Route
        path="/app/submissions"
        element={<RequireAuth zone="public"><SubmissionPage /></RequireAuth>}
      />
      <Route
        path="/app/submission/:submissionId"
        element={<RequireAuth zone="public"><SubmissionPage /></RequireAuth>}
      />
      <Route
        path="/app/profile"
        element={<RequireAuth zone="public"><SecurityPage /></RequireAuth>}
      />
      <Route
        path="/app/security"
        element={<Navigate to="/app/profile" replace />}
      />
      <Route
        path="/app/support"
        element={<RequireAuth zone="public"><SupportPage /></RequireAuth>}
      />
      <Route
        path="/plans"
        element={<RequireAuth zone="public"><BillingPage /></RequireAuth>}
      />
      <Route
        path="/app/billing"
        element={<Navigate to="/plans" replace />}
      />
      <Route
        path="/app/oop"
        element={<RequireAuth zone="public"><OOPPage /></RequireAuth>}
      />
      <Route
        path="/app/cybersecurity"
        element={<RequireAuth zone="public"><CybersecurityPage /></RequireAuth>}
      />
      <Route
        path="/app/system-design"
        element={<RequireAuth zone="public"><SystemDesignPage /></RequireAuth>}
      />
      <Route
        path="/app/career"
        element={<RequireAuth zone="public"><CareerPathPage /></RequireAuth>}
      />
      <Route
        path="/app/community"
        element={<RequireAuth zone="public"><CommunityPage /></RequireAuth>}
      />
      <Route
        path="/app/experts"
        element={<RequireAuth zone="public"><ExpertsPage /></RequireAuth>}
      />
      <Route
        path="/app/achievements"
        element={<RequireAuth zone="public"><AchievementsPage /></RequireAuth>}
      />
      <Route
        path="/app/leaderboard"
        element={<RequireAuth zone="public"><LeaderboardPage /></RequireAuth>}
      />
      <Route
        path="/app/mock-interview"
        element={<RequireAuth zone="public"><MockInterviewPage /></RequireAuth>}
      />
      <Route
        path="/app/cheatsheets"
        element={<RequireAuth zone="public"><CheatSheetsPage /></RequireAuth>}
      />
      <Route
        path="/app/flashcards"
        element={<RequireAuth zone="public"><FlashcardsPage /></RequireAuth>}
      />
      <Route
        path="/app/study-plan"
        element={<RequireAuth zone="public"><StudyPlanPage /></RequireAuth>}
      />
      <Route
        path="/app/tracker"
        element={<RequireAuth zone="public"><InterviewTrackerPage /></RequireAuth>}
      />
      <Route
        path="/app/daily"
        element={<RequireAuth zone="public"><DailyChallengePage /></RequireAuth>}
      />
      <Route
        path="/app/pattern-quiz"
        element={<RequireAuth zone="public"><PatternQuizPage /></RequireAuth>}
      />
      <Route
        path="/app/roadmap"
        element={<RequireAuth zone="public"><RoadmapPage /></RequireAuth>}
      />
      <Route
        path="/app/progress"
        element={<RequireAuth zone="public"><ProgressPage /></RequireAuth>}
      />
      <Route
        path="/app/experiences"
        element={<RequireAuth zone="public"><ExperiencesPage /></RequireAuth>}
      />
      <Route
        path="/app/contests"
        element={<RequireAuth zone="public"><WeeklyContestPage /></RequireAuth>}
      />
      <Route
        path="/app/companies"
        element={<RequireAuth zone="public"><CompanyPrepPage /></RequireAuth>}
      />
      <Route
        path="/app/*"
        element={<RequireAuth zone="public"><Navigate to="/app/dashboard" replace /></RequireAuth>}
      />

      {/* Authority routes */}
      <Route
        path="/authority/dashboard"
        element={<RequireAuth zone="authority"><AdminOperationsPage /></RequireAuth>}
      />
      <Route
        path="/authority/queue"
        element={<RequireAuth zone="authority"><AuthorityQueuePage /></RequireAuth>}
      />
      <Route
        path="/authority/applications/:id"
        element={<RequireAuth zone="authority"><AuthorityQueuePage /></RequireAuth>}
      />
      <Route
        path="/authority/problems"
        element={<RequireAuth zone="authority" allowedRoles={['admin']}><AdminProblemsPage /></RequireAuth>}
      />
      <Route
        path="/authority/operations"
        element={<RequireAuth zone="authority" allowedRoles={['admin']}><AdminOperationsPage /></RequireAuth>}
      />
      <Route
        path="/authority/admin/operations"
        element={<Navigate to="/authority/operations" replace />}
      />
      <Route
        path="/authority/admin/problems"
        element={<Navigate to="/authority/problems" replace />}
      />
      <Route
        path="/authority/admin/billing"
        element={<RequireAuth zone="authority" allowedRoles={['admin']}><BillingPage /></RequireAuth>}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </UserProvider>
  );
}
