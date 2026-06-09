import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/pages/login-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { HomePage } from "@/pages/home-page";
import { DirectoryPage } from "@/pages/directory-page";
import { DepartmentsPage } from "@/pages/departments-page";
import { DepartmentDetailPage } from "@/pages/department-detail-page";
import { DepartmentManagePage } from "@/pages/department-manage-page";
import { CompanyUpdatesPage } from "@/pages/company-updates-page";
import { CompanyUpdateDetailPage } from "@/pages/company-update-detail-page";
import { SurveysPage } from "@/pages/surveys-page";
import { SurveyDetailPage } from "@/pages/survey-detail-page";
import { SurveyResultsPage } from "@/pages/survey-results-page";
import { HelpPage } from "@/pages/help-page";
import { NotificationsPage } from "@/pages/notifications-page";
import { MePage } from "@/pages/me-page";
import { TimeOffPage } from "@/pages/time-off-page";
import { InternalJobsPage } from "@/pages/internal-jobs-page";
import { InternalJobDetailPage } from "@/pages/internal-job-detail-page";
import { DmsPage } from "@/pages/dms-page";
import { ResourcesPage } from "@/pages/resources-page";
import { ResourceDetailPage } from "@/pages/resource-detail-page";
import { AdminLayout } from "@/pages/admin/admin-layout";
import { AdminEmployeesPage } from "@/pages/admin/admin-employees-page";
import { AdminDepartmentsPage } from "@/pages/admin/admin-departments-page";
import { AdminDepartmentResourcesPage } from "@/pages/admin/admin-department-resources-page";
import { AdminCompanyUpdatesPage } from "@/pages/admin/admin-company-updates-page";
import { AdminCompanyEventsPage } from "@/pages/admin/admin-company-events-page";
import { AdminTimeOffPage } from "@/pages/admin/admin-time-off-page";
import { AdminSurveysPage } from "@/pages/admin/admin-surveys-page";
import { AdminSurveyEditPage } from "@/pages/admin/admin-survey-edit-page";
import { AdminInternalJobsPage } from "@/pages/admin/admin-internal-jobs-page";
import { AdminResourcesPage } from "@/pages/admin/admin-resources-page";
import { AdminFeedbackPage } from "@/pages/admin/admin-feedback-page";
import { AdminTrainingPage } from "@/pages/admin/admin-training-page";
import { AdminOverviewPage } from "@/pages/admin/admin-overview-page";
import { FeedbackPage } from "@/pages/feedback-page";
import { TrainingPage } from "@/pages/training-page";
import { TrainingCoursePage } from "@/pages/training-course-page";
import { FeedbackGivePage } from "@/pages/feedback-give-page";
import { FeedbackRequestPage } from "@/pages/feedback-request-page";
import { RequireAuth } from "@/auth/require-auth";
import { AppShell } from "@/components/shell/app-shell";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/departments/:slug" element={<DepartmentDetailPage />} />
        <Route path="/departments/:slug/manage" element={<DepartmentManagePage />} />
        <Route path="/company-updates" element={<CompanyUpdatesPage />} />
        <Route path="/company-updates/:id" element={<CompanyUpdateDetailPage />} />
        <Route path="/surveys" element={<SurveysPage />} />
        <Route path="/surveys/:id" element={<SurveyDetailPage />} />
        <Route path="/surveys/:id/results" element={<SurveyResultsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="/time-off" element={<TimeOffPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/feedback/request" element={<FeedbackRequestPage />} />
        <Route path="/feedback/:id/give" element={<FeedbackGivePage />} />
        <Route path="/internal-jobs" element={<InternalJobsPage />} />
        <Route path="/internal-jobs/:id" element={<InternalJobDetailPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/training/:id" element={<TrainingCoursePage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/resources/:id" element={<ResourceDetailPage />} />
        <Route path="/dms" element={<DmsPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth requireAdmin>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="employees" element={<AdminEmployeesPage />} />
          <Route path="departments" element={<AdminDepartmentsPage />} />
          <Route
            path="departments/:slug/resources"
            element={<AdminDepartmentResourcesPage />}
          />
          <Route path="company-updates" element={<AdminCompanyUpdatesPage />} />
          <Route path="company-events" element={<AdminCompanyEventsPage />} />
          <Route path="time-off" element={<AdminTimeOffPage />} />
          <Route path="internal-jobs" element={<AdminInternalJobsPage />} />
          <Route path="resources" element={<AdminResourcesPage />} />
          <Route path="training" element={<AdminTrainingPage />} />
          <Route path="feedback" element={<AdminFeedbackPage />} />
          <Route path="surveys" element={<AdminSurveysPage />} />
          <Route path="surveys/new" element={<AdminSurveyEditPage />} />
          <Route path="surveys/:id" element={<AdminSurveyEditPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
