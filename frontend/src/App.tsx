import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import { UserProvider } from './contexts/UserContext';
import { XPToastContainer } from './components/XPToast';
import { ErrorBoundary } from './components/ErrorBoundary';

/* ── Page chunks — each becomes its own JS chunk ──────────────────────────── */
const lazy$ = <T extends Record<string, unknown>>(
  fn: () => Promise<T>,
  key: keyof T,
) =>
  lazy(() => fn().then((m) => ({ default: m[key] as React.ComponentType })));

const LandingPage             = lazy$(() => import('./pages/LandingPage'),             'LandingPage');
const LoginPage               = lazy$(() => import('./pages/LoginPage'),               'LoginPage');
const AuthorityLoginPage      = lazy$(() => import('./pages/AuthorityLoginPage'),      'AuthorityLoginPage');
const ForgotPasswordPage      = lazy$(() => import('./pages/ForgotPasswordPage'),      'ForgotPasswordPage');
const ResetPasswordPage       = lazy$(() => import('./pages/ResetPasswordPage'),       'ResetPasswordPage');
const VerifyEmailPage         = lazy$(() => import('./pages/VerifyEmailPage'),         'VerifyEmailPage');
const OAuthCallbackPage       = lazy$(() => import('./pages/OAuthCallbackPage'),       'OAuthCallbackPage');
const OnboardingPage          = lazy$(() => import('./pages/OnboardingPage'),          'OnboardingPage');

const HomePage                = lazy$(() => import('./pages/HomePage'),                'HomePage');
const ProblemsPage            = lazy$(() => import('./pages/ProblemsPage'),            'ProblemsPage');
const ProblemDetailPage       = lazy$(() => import('./pages/ProblemDetailPage'),       'ProblemDetailPage');
const CoreSubjectsPage        = lazy$(() => import('./pages/CoreSubjectsPage'),        'CoreSubjectsPage');
const SubjectDetailPage       = lazy$(() => import('./pages/SubjectDetailPage'),       'SubjectDetailPage');
const SubjectTopicPage        = lazy$(() => import('./pages/SubjectTopicPage'),        'SubjectTopicPage');
const PlacementPage           = lazy$(() => import('./pages/PlacementPage'),           'PlacementPage');
const PlacementTrackPage      = lazy$(() => import('./pages/PlacementTrackPage'),      'PlacementTrackPage');
const MentorshipPage          = lazy$(() => import('./pages/MentorshipPage'),          'MentorshipPage');
const ResumePage              = lazy$(() => import('./pages/ResumePage'),              'ResumePage');
const TechSkillsPage          = lazy$(() => import('./pages/TechSkillsPage'),          'TechSkillsPage');
const VisualizerPage          = lazy$(() => import('./pages/VisualizerPage'),          'VisualizerPage');
const SubmissionPage          = lazy$(() => import('./pages/SubmissionPage'),          'SubmissionPage');
const SecurityPage            = lazy$(() => import('./pages/SecurityPage'),            'SecurityPage');
const BillingPage             = lazy$(() => import('./pages/BillingPage'),             'BillingPage');
const SupportPage             = lazy$(() => import('./pages/SupportPage'),             'SupportPage');
const OOPPage                 = lazy$(() => import('./pages/OOPPage'),                 'OOPPage');
const CybersecurityPage       = lazy$(() => import('./pages/CybersecurityPage'),       'CybersecurityPage');
const SystemDesignPage        = lazy$(() => import('./pages/SystemDesignPage'),        'SystemDesignPage');
const CareerPathPage          = lazy$(() => import('./pages/CareerPathPage'),          'CareerPathPage');
const CommunityPage           = lazy$(() => import('./pages/CommunityPage'),           'CommunityPage');
const ExpertsPage             = lazy$(() => import('./pages/ExpertsPage'),             'ExpertsPage');
const AchievementsPage        = lazy$(() => import('./pages/AchievementsPage'),        'AchievementsPage');
const LeaderboardPage         = lazy$(() => import('./pages/LeaderboardPage'),         'LeaderboardPage');
const MockInterviewPage       = lazy$(() => import('./pages/MockInterviewPage'),       'MockInterviewPage');
const CheatSheetsPage         = lazy$(() => import('./pages/CheatSheetsPage'),         'CheatSheetsPage');
const FlashcardsPage          = lazy$(() => import('./pages/FlashcardsPage'),          'FlashcardsPage');
const StudyPlanPage           = lazy$(() => import('./pages/StudyPlanPage'),           'StudyPlanPage');
const InterviewTrackerPage    = lazy$(() => import('./pages/InterviewTrackerPage'),    'InterviewTrackerPage');
const DailyChallengePage      = lazy$(() => import('./pages/DailyChallengePage'),      'DailyChallengePage');
const PatternQuizPage         = lazy$(() => import('./pages/PatternQuizPage'),         'PatternQuizPage');
const RoadmapPage             = lazy$(() => import('./pages/RoadmapPage'),             'RoadmapPage');
const ProgressPage            = lazy$(() => import('./pages/ProgressPage'),            'ProgressPage');
const ExperiencesPage         = lazy$(() => import('./pages/ExperiencesPage'),         'ExperiencesPage');
const WeeklyContestPage       = lazy$(() => import('./pages/WeeklyContestPage'),       'WeeklyContestPage');
const CompanyPrepPage         = lazy$(() => import('./pages/CompanyPrepPage'),         'CompanyPrepPage');
const SkillAssessmentPage     = lazy$(() => import('./pages/SkillAssessmentPage'),     'SkillAssessmentPage');
const PlaygroundPage          = lazy$(() => import('./pages/PlaygroundPage'),          'PlaygroundPage');
const NotesPage               = lazy$(() => import('./pages/NotesPage'),               'NotesPage');
const ReadinessPage           = lazy$(() => import('./pages/ReadinessPage'),           'ReadinessPage');
const RealWorldPage           = lazy$(() => import('./pages/RealWorldPage'),           'RealWorldPage');
const NotFoundPage            = lazy$(() => import('./pages/NotFoundPage'),            'NotFoundPage');

const AuthorityQueuePage             = lazy$(() => import('./pages/AuthorityQueuePage'),             'AuthorityQueuePage');
const AuthorityApplicationDetailPage = lazy$(() => import('./pages/AuthorityApplicationDetailPage'), 'AuthorityApplicationDetailPage');
const AdminOperationsPage            = lazy$(() => import('./pages/AdminOperationsPage'),            'AdminOperationsPage');
const AdminProblemsPage              = lazy$(() => import('./pages/AdminProblemsPage'),              'AdminProblemsPage');
const AdminBillingPage               = lazy$(() => import('./pages/AdminBillingPage'),               'AdminBillingPage');

/* ── Page loading fallback ──────────────────────────────────────────────────── */
function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 20 }}>
      <div style={{ position: 'relative', width: 40, height: 40 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid var(--border)',
          borderTopColor: '#E82127',
          animation: 'spin 0.75s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 6, borderRadius: '50%',
          border: '1.5px solid transparent',
          borderTopColor: 'rgba(232,25,44,0.4)',
          animation: 'spin 1.5s linear infinite reverse',
        }} />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── App ────────────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <XPToastContainer />
        <Suspense fallback={<PageLoader />}>
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
          <Route path="/app/dashboard"    element={<RequireAuth zone="public"><HomePage /></RequireAuth>} />
          <Route path="/app/home"         element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/app/problems"     element={<RequireAuth zone="public"><ProblemsPage /></RequireAuth>} />
          <Route path="/app/problems/:id" element={<RequireAuth zone="public"><ProblemDetailPage /></RequireAuth>} />
          <Route path="/app/subjects"                       element={<RequireAuth zone="public"><CoreSubjectsPage /></RequireAuth>} />
          <Route path="/app/subjects/:subjectId"            element={<RequireAuth zone="public"><SubjectDetailPage /></RequireAuth>} />
          <Route path="/app/subjects/:subjectId/:topicId"   element={<RequireAuth zone="public"><SubjectTopicPage /></RequireAuth>} />
          <Route path="/app/core-subjects"                  element={<Navigate to="/app/subjects" replace />} />
          <Route path="/app/placement"          element={<RequireAuth zone="public"><PlacementPage /></RequireAuth>} />
          <Route path="/app/placement/:trackId" element={<RequireAuth zone="public"><PlacementTrackPage /></RequireAuth>} />
          <Route path="/app/mentorship"    element={<RequireAuth zone="public"><MentorshipPage /></RequireAuth>} />
          <Route path="/app/resume"        element={<RequireAuth zone="public"><ResumePage /></RequireAuth>} />
          <Route path="/app/skills"        element={<RequireAuth zone="public"><TechSkillsPage /></RequireAuth>} />
          <Route path="/app/tech-skills"   element={<Navigate to="/app/skills" replace />} />
          <Route path="/app/visualizer"    element={<RequireAuth zone="public"><VisualizerPage /></RequireAuth>} />
          <Route path="/app/submissions"                element={<RequireAuth zone="public"><SubmissionPage /></RequireAuth>} />
          <Route path="/app/submission/:submissionId"   element={<RequireAuth zone="public"><SubmissionPage /></RequireAuth>} />
          <Route path="/app/profile"   element={<RequireAuth zone="public"><SecurityPage /></RequireAuth>} />
          <Route path="/app/security"  element={<Navigate to="/app/profile" replace />} />
          <Route path="/app/support"   element={<RequireAuth zone="public"><SupportPage /></RequireAuth>} />
          <Route path="/plans"         element={<RequireAuth zone="public"><BillingPage /></RequireAuth>} />
          <Route path="/app/billing"   element={<Navigate to="/plans" replace />} />
          <Route path="/app/oop"            element={<RequireAuth zone="public"><OOPPage /></RequireAuth>} />
          <Route path="/app/cybersecurity"  element={<RequireAuth zone="public"><CybersecurityPage /></RequireAuth>} />
          <Route path="/app/system-design"  element={<RequireAuth zone="public"><SystemDesignPage /></RequireAuth>} />
          <Route path="/app/career"         element={<RequireAuth zone="public"><CareerPathPage /></RequireAuth>} />
          <Route path="/app/community"      element={<RequireAuth zone="public"><CommunityPage /></RequireAuth>} />
          <Route path="/app/experts"        element={<RequireAuth zone="public"><ExpertsPage /></RequireAuth>} />
          <Route path="/app/achievements"   element={<RequireAuth zone="public"><AchievementsPage /></RequireAuth>} />
          <Route path="/app/leaderboard"    element={<RequireAuth zone="public"><LeaderboardPage /></RequireAuth>} />
          <Route path="/app/mock-interview" element={<RequireAuth zone="public"><MockInterviewPage /></RequireAuth>} />
          <Route path="/app/cheatsheets"    element={<RequireAuth zone="public"><CheatSheetsPage /></RequireAuth>} />
          <Route path="/app/flashcards"     element={<RequireAuth zone="public"><FlashcardsPage /></RequireAuth>} />
          <Route path="/app/study-plan"     element={<RequireAuth zone="public"><StudyPlanPage /></RequireAuth>} />
          <Route path="/app/tracker"        element={<RequireAuth zone="public"><InterviewTrackerPage /></RequireAuth>} />
          <Route path="/app/daily"          element={<RequireAuth zone="public"><DailyChallengePage /></RequireAuth>} />
          <Route path="/app/pattern-quiz"   element={<RequireAuth zone="public"><PatternQuizPage /></RequireAuth>} />
          <Route path="/app/roadmap"        element={<RequireAuth zone="public"><RoadmapPage /></RequireAuth>} />
          <Route path="/app/progress"       element={<RequireAuth zone="public"><ProgressPage /></RequireAuth>} />
          <Route path="/app/experiences"    element={<RequireAuth zone="public"><ExperiencesPage /></RequireAuth>} />
          <Route path="/app/contests"       element={<RequireAuth zone="public"><WeeklyContestPage /></RequireAuth>} />
          <Route path="/app/companies"      element={<RequireAuth zone="public"><CompanyPrepPage /></RequireAuth>} />
          <Route path="/app/assessments"    element={<RequireAuth zone="public"><SkillAssessmentPage /></RequireAuth>} />
          <Route path="/app/playground"     element={<RequireAuth zone="public"><PlaygroundPage /></RequireAuth>} />
          <Route path="/app/notes"          element={<RequireAuth zone="public"><NotesPage /></RequireAuth>} />
          <Route path="/app/readiness"      element={<RequireAuth zone="public"><ReadinessPage /></RequireAuth>} />
          <Route path="/app/real-world"     element={<RequireAuth zone="public"><RealWorldPage /></RequireAuth>} />
          <Route path="/app/*"              element={<RequireAuth zone="public"><Navigate to="/app/dashboard" replace /></RequireAuth>} />

          {/* Authority routes */}
          <Route path="/authority/dashboard"         element={<RequireAuth zone="authority"><AdminOperationsPage /></RequireAuth>} />
          <Route path="/authority/queue"             element={<RequireAuth zone="authority"><AuthorityQueuePage /></RequireAuth>} />
          <Route path="/authority/applications/:id"  element={<RequireAuth zone="authority"><AuthorityApplicationDetailPage /></RequireAuth>} />
          <Route path="/authority/problems"          element={<RequireAuth zone="authority" allowedRoles={['admin']}><AdminProblemsPage /></RequireAuth>} />
          <Route path="/authority/operations"        element={<RequireAuth zone="authority" allowedRoles={['admin']}><AdminOperationsPage /></RequireAuth>} />
          <Route path="/authority/admin/operations"  element={<Navigate to="/authority/operations" replace />} />
          <Route path="/authority/admin/problems"    element={<Navigate to="/authority/problems" replace />} />
          <Route path="/authority/admin/billing"     element={<RequireAuth zone="authority" allowedRoles={['admin']}><AdminBillingPage /></RequireAuth>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </UserProvider>
    </ErrorBoundary>
  );
}
