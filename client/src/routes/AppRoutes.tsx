import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { FeaturesPage } from '../pages/public/FeaturesPage';
import { AboutPage } from '../pages/public/AboutPage';
import { AccessibilityPage } from '../pages/public/AccessibilityPage';
import { ContactPage } from '../pages/public/ContactPage';

// Auth Pages
import { RoleSelectionPage } from '../pages/auth/RoleSelectionPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { AccessibilitySetupPage } from '../pages/auth/AccessibilitySetupPage';

// Candidate Pages
import { CandidateDashboardPage } from '../pages/candidate/CandidateDashboardPage';
import { LearningHomePage } from '../pages/candidate/learning/LearningHomePage';
import { SubjectPage } from '../pages/candidate/learning/SubjectPage';
import { TopicPage } from '../pages/candidate/learning/TopicPage';
import { PracticeHomePage } from '../pages/candidate/practice/PracticeHomePage';
import { PracticeSessionPage } from '../pages/candidate/practice/PracticeSessionPage';
import { PracticeResultPage } from '../pages/candidate/practice/PracticeResultPage';
import { PracticeHistoryPage } from '../pages/candidate/practice/PracticeHistoryPage';
import { ExamsPage } from '../pages/candidate/exams/ExamsPage';
import { ExamDetailsPage } from '../pages/candidate/exams/ExamDetailsPage';
import { ExamInstructionsPage } from '../pages/candidate/exams/ExamInstructionsPage';
import { ExamVerificationPage } from '../pages/candidate/exams/ExamVerificationPage';
import { LiveExamSessionPage } from '../pages/candidate/exams/LiveExamSessionPage';
import { ExamSubmissionPage } from '../pages/candidate/exams/ExamSubmissionPage';
import { ExamStatusPage } from '../pages/candidate/exams/ExamStatusPage';
import { MockTestsPage } from '../pages/candidate/mockTests/MockTestsPage';
import { MockTestDetailsPage } from '../pages/candidate/mockTests/MockTestDetailsPage';
import { MockTestInstructionsPage } from '../pages/candidate/mockTests/MockTestInstructionsPage';
import { MockTestSessionPage } from '../pages/candidate/mockTests/MockTestSessionPage';
import { MockTestResultPage } from '../pages/candidate/mockTests/MockTestResultPage';
import { MockTestReviewPage } from '../pages/candidate/mockTests/MockTestReviewPage';
import { MockTestHistoryPage } from '../pages/candidate/mockTests/MockTestHistoryPage';
import { ResultsPage as CandidateResultsPage } from '../pages/candidate/ResultsPage';
import { ProgressPage } from '../pages/candidate/progress/ProgressPage';
import { SettingsPage as CandidateSettingsPage } from '../pages/candidate/SettingsPage';
import { CandidateHelpPage } from '../pages/candidate/CandidateHelpPage';

// Redirect helper for legacy or variant exam session URLs
const CandidateExamRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/candidate/exams/${id}/session`} replace />;
};

// Examiner Pages
import { ExaminerDashboardPage } from '../pages/examiner/ExaminerDashboardPage';
import { ExamListPage } from '../pages/examiner/exams/ExamListPage';
import { CreateExamPage } from '../pages/examiner/exams/CreateExamPage';
import { ExamSectionsPage } from '../pages/examiner/exams/ExamSectionsPage';
import { ExamQuestionsPage } from '../pages/examiner/exams/ExamQuestionsPage';
import { ExamCandidatesPage } from '../pages/examiner/exams/ExamCandidatesPage';
import { ExamSchedulePage } from '../pages/examiner/exams/ExamSchedulePage';
import { ExamPreviewPage } from '../pages/examiner/exams/ExamPreviewPage';
import { ExamMonitorPage } from '../pages/examiner/exams/ExamMonitorPage';
import { ExamResultsPage } from '../pages/examiner/exams/ExamResultsPage';
import { QuestionBankPage } from '../pages/examiner/questionBank/QuestionBankPage';
import { CreateQuestionPage } from '../pages/examiner/questionBank/CreateQuestionPage';
import { ExamAnalyticsPage } from '../pages/examiner/analytics/ExamAnalyticsPage';

// Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { ExaminersPage } from '../pages/admin/ExaminersPage';
import { CandidatesPage as AdminCandidatesPage } from '../pages/admin/CandidatesPage';
import { ExamsPage as AdminExamsPage } from '../pages/admin/ExamsPage';
import { OrganizationsPage } from '../pages/admin/OrganizationsPage';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';
import { SettingsPage as AdminSettingsPage } from '../pages/admin/SettingsPage';


export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route
        path="/"
        element={
          <PageLayout fullWidth>
            <LandingPage />
          </PageLayout>
        }
      />
      <Route
        path="/features"
        element={
          <PageLayout>
            <FeaturesPage />
          </PageLayout>
        }
      />
      <Route
        path="/about"
        element={
          <PageLayout>
            <AboutPage />
          </PageLayout>
        }
      />
      <Route
        path="/accessibility"
        element={
          <PageLayout>
            <AccessibilityPage />
          </PageLayout>
        }
      />
      <Route
        path="/contact"
        element={
          <PageLayout>
            <ContactPage />
          </PageLayout>
        }
      />

      {/* 2. Authentication Routes */}
      <Route path="/auth/role-selection" element={<RoleSelectionPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/accessibility-setup" element={<AccessibilitySetupPage />} />

      {/* 3. Candidate Routes (Protected) */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/candidate/dashboard"
          element={
            <PageLayout showSidebar>
              <CandidateDashboardPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/learn"
          element={
            <PageLayout showSidebar>
              <LearningHomePage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/learn/:subjectId"
          element={
            <PageLayout showSidebar>
              <SubjectPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/learn/:subjectId/:topicId"
          element={
            <PageLayout showSidebar>
              <TopicPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/practice"
          element={
            <PageLayout showSidebar>
              <PracticeHomePage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/practice/:subjectId"
          element={
            <PageLayout showSidebar>
              <PracticeHomePage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/practice/session/:sessionId"
          element={
            <PageLayout showSidebar>
              <PracticeSessionPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/practice/session/:sessionId/result"
          element={
            <PageLayout showSidebar>
              <PracticeResultPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/practice/history"
          element={
            <PageLayout showSidebar>
              <PracticeHistoryPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/exams"
          element={
            <PageLayout showSidebar>
              <ExamsPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/exams/:examId"
          element={
            <PageLayout showSidebar>
              <ExamDetailsPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/exams/:examId/instructions"
          element={
            <PageLayout showSidebar>
              <ExamInstructionsPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/exams/:examId/verify"
          element={
            <PageLayout showSidebar>
              <ExamVerificationPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/exams/:examId/session"
          element={
            <PageLayout>
              <LiveExamSessionPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/exams/:examId/submission"
          element={
            <PageLayout showSidebar>
              <ExamSubmissionPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/exams/:examId/status"
          element={
            <PageLayout showSidebar>
              <ExamStatusPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/mock-tests"
          element={
            <PageLayout showSidebar>
              <MockTestsPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/mock-tests/history"
          element={
            <PageLayout showSidebar>
              <MockTestHistoryPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/mock-tests/:testId"
          element={
            <PageLayout showSidebar>
              <MockTestDetailsPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/mock-tests/:testId/instructions"
          element={
            <PageLayout showSidebar>
              <MockTestInstructionsPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/mock-tests/:testId/session"
          element={
            <PageLayout>
              <MockTestSessionPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/mock-tests/:testId/result"
          element={
            <PageLayout showSidebar>
              <MockTestResultPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/mock-tests/:testId/review"
          element={
            <PageLayout showSidebar>
              <MockTestReviewPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/exam/:id"
          element={<CandidateExamRedirect />}
        />
        <Route
          path="/candidate/results"
          element={
            <PageLayout showSidebar>
              <CandidateResultsPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/help"
          element={
            <PageLayout showSidebar>
              <CandidateHelpPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/progress"
          element={
            <PageLayout showSidebar>
              <ProgressPage />
            </PageLayout>
          }
        />
        <Route
          path="/candidate/settings"
          element={
            <PageLayout showSidebar>
              <CandidateSettingsPage />
            </PageLayout>
          }
        />
      </Route>

      {/* 4. Examiner Routes (Protected + Role Guard) */}
      <Route element={<RoleRoute allowedRoles={['examiner', 'admin']} />}>
        <Route
          path="/examiner/dashboard"
          element={
            <PageLayout showSidebar>
              <ExaminerDashboardPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/exams"
          element={
            <PageLayout showSidebar>
              <ExamListPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/exams/create"
          element={
            <PageLayout showSidebar>
              <CreateExamPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/exams/:examId"
          element={
            <PageLayout showSidebar>
              <ExamSectionsPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/exams/:examId/edit"
          element={
            <PageLayout showSidebar>
              <CreateExamPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/exams/:examId/questions"
          element={
            <PageLayout showSidebar>
              <ExamQuestionsPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/exams/:examId/questions/create"
          element={
            <PageLayout showSidebar>
              <CreateQuestionPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/exams/:examId/questions/:questionId/edit"
          element={
            <PageLayout showSidebar>
              <CreateQuestionPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/exams/:examId/sections"
          element={
            <PageLayout showSidebar>
              <ExamSectionsPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/exams/:examId/candidates"
          element={
            <PageLayout showSidebar>
              <ExamCandidatesPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/exams/:examId/schedule"
          element={
            <PageLayout showSidebar>
              <ExamSchedulePage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/exams/:examId/preview"
          element={
            <PageLayout showSidebar>
              <ExamPreviewPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/exams/:examId/monitor"
          element={
            <PageLayout showSidebar>
              <ExamMonitorPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/exams/:examId/results"
          element={
            <PageLayout showSidebar>
              <ExamResultsPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/question-bank"
          element={
            <PageLayout showSidebar>
              <QuestionBankPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/question-bank/create"
          element={
            <PageLayout showSidebar>
              <CreateQuestionPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/analytics"
          element={
            <PageLayout showSidebar>
              <ExamAnalyticsPage />
            </PageLayout>
          }
        />

        {/* Backward-compatible legacy aliases */}
        <Route
          path="/examiner/create-exam"
          element={
            <PageLayout showSidebar>
              <CreateExamPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/conduct-exam"
          element={
            <PageLayout showSidebar>
              <ExamMonitorPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/candidates"
          element={
            <PageLayout showSidebar>
              <ExamCandidatesPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/results"
          element={
            <PageLayout showSidebar>
              <ExamResultsPage />
            </PageLayout>
          }
        />
      </Route>

      {/* 5. Admin Routes (Protected + Role Guard) */}
      <Route element={<RoleRoute allowedRoles={['admin']} />}>
        <Route
          path="/admin/dashboard"
          element={
            <PageLayout showSidebar>
              <AdminDashboardPage />
            </PageLayout>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PageLayout showSidebar>
              <UserManagementPage />
            </PageLayout>
          }
        />
        <Route
          path="/admin/examiners"
          element={
            <PageLayout showSidebar>
              <ExaminersPage />
            </PageLayout>
          }
        />
        <Route
          path="/admin/candidates"
          element={
            <PageLayout showSidebar>
              <AdminCandidatesPage />
            </PageLayout>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <PageLayout showSidebar>
              <AdminExamsPage />
            </PageLayout>
          }
        />
        <Route
          path="/admin/organizations"
          element={
            <PageLayout showSidebar>
              <OrganizationsPage />
            </PageLayout>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <PageLayout showSidebar>
              <AuditLogsPage />
            </PageLayout>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PageLayout showSidebar>
              <AdminSettingsPage />
            </PageLayout>
          }
        />
      </Route>


      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
