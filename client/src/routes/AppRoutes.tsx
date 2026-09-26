import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import { DashboardPage as CandidateDashboardPage } from '../pages/candidate/DashboardPage';
import { LearningHomePage } from '../pages/candidate/learning/LearningHomePage';
import { SubjectPage } from '../pages/candidate/learning/SubjectPage';
import { TopicPage } from '../pages/candidate/learning/TopicPage';
import { PracticeHomePage } from '../pages/candidate/practice/PracticeHomePage';
import { PracticeSessionPage } from '../pages/candidate/practice/PracticeSessionPage';
import { PracticeResultPage } from '../pages/candidate/practice/PracticeResultPage';
import { PracticeHistoryPage } from '../pages/candidate/practice/PracticeHistoryPage';
import { ExamsPage } from '../pages/candidate/ExamsPage';
import { ExamDetailsPage } from '../pages/candidate/ExamDetailsPage';
import { MockTestsPage } from '../pages/candidate/MockTestsPage';
import { LiveExamPage } from '../pages/candidate/LiveExamPage';
import { ResultsPage as CandidateResultsPage } from '../pages/candidate/ResultsPage';
import { ProgressPage } from '../pages/candidate/ProgressPage';
import { SettingsPage as CandidateSettingsPage } from '../pages/candidate/SettingsPage';

// Examiner Pages
import { DashboardPage as ExaminerDashboardPage } from '../pages/examiner/DashboardPage';
import { CreateExamPage } from '../pages/examiner/CreateExamPage';
import { QuestionBankPage } from '../pages/examiner/QuestionBankPage';
import { CandidatesPage } from '../pages/examiner/CandidatesPage';
import { ConductExamPage } from '../pages/examiner/ConductExamPage';
import { ResultsPage as ExaminerResultsPage } from '../pages/examiner/ResultsPage';
import { AnalyticsPage as ExaminerAnalyticsPage } from '../pages/examiner/AnalyticsPage';

// Admin Pages
import { DashboardPage as AdminDashboardPage } from '../pages/admin/DashboardPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { OrganizationsPage } from '../pages/admin/OrganizationsPage';
import { SystemSettingsPage as AdminSystemSettingsPage } from '../pages/admin/SystemSettingsPage';

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
          path="/candidate/exams/:id"
          element={
            <PageLayout showSidebar>
              <ExamDetailsPage />
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
          path="/candidate/exam/:id"
          element={
            <PageLayout>
              <LiveExamPage />
            </PageLayout>
          }
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
          path="/examiner/create-exam"
          element={
            <PageLayout showSidebar>
              <CreateExamPage />
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
          path="/examiner/candidates"
          element={
            <PageLayout showSidebar>
              <CandidatesPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/conduct-exam"
          element={
            <PageLayout showSidebar>
              <ConductExamPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/results"
          element={
            <PageLayout showSidebar>
              <ExaminerResultsPage />
            </PageLayout>
          }
        />
        <Route
          path="/examiner/analytics"
          element={
            <PageLayout showSidebar>
              <ExaminerAnalyticsPage />
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
              <UsersPage />
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
          path="/admin/settings"
          element={
            <PageLayout showSidebar>
              <AdminSystemSettingsPage />
            </PageLayout>
          }
        />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
