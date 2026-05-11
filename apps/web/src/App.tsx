import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/pages/login-page";
import { HomePage } from "@/pages/home-page";
import { DirectoryPage } from "@/pages/directory-page";
import { DepartmentsPage } from "@/pages/departments-page";
import { DepartmentDetailPage } from "@/pages/department-detail-page";
import { CompanyUpdatesPage } from "@/pages/company-updates-page";
import { AdminLayout } from "@/pages/admin/admin-layout";
import { AdminEmployeesPage } from "@/pages/admin/admin-employees-page";
import { AdminDepartmentsPage } from "@/pages/admin/admin-departments-page";
import { AdminCompanyUpdatesPage } from "@/pages/admin/admin-company-updates-page";
import { AdminOverviewPage } from "@/pages/admin/admin-overview-page";
import { RequireAuth } from "@/auth/require-auth";
import { AppShell } from "@/components/shell/app-shell";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

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
        <Route path="/company-updates" element={<CompanyUpdatesPage />} />
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
          <Route path="company-updates" element={<AdminCompanyUpdatesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}