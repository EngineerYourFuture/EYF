import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';

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
import { AuthorityQueuePage } from './pages/AuthorityQueuePage';
import { AdminOperationsPage } from './pages/AdminOperationsPage';
import { AdminProblemsPage } from './pages/AdminProblemsPage';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/login" element={<Navigate to="/login" replace />} />
      <Route path="/auth/register" element={<Navigate to="/login?tab=register" replace />} />
      <Route path="/authority/login" element={<AuthorityLoginPage />} />

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
  );
}
