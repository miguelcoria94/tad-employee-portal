import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { type DepartmentRow, slugifyDepartment } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/auth-context";
import { Spinner } from "@/components/ui/spinner";
import { AdminDepartmentResourcesPage } from "@/pages/admin/admin-department-resources-page";

/**
 * Resource-management surface for department managers (non-admins). Reuses
 * the admin page UI; backend already allows managers to call the underlying
 * /admin/department-resources endpoints. Admins get redirected to the
 * canonical /admin path so the existing navigation stays consistent.
 */
export function DepartmentManagePage() {
  const { slug } = useParams<{ slug: string }>();
  const { me, isAdmin } = useAuth();

  const { data, isLoading } = useQuery<{ departments: DepartmentRow[] }>({
    queryKey: ["departments"],
    queryFn: () => api("/api/v1/departments"),
  });

  if (isAdmin) {
    return <Navigate to={`/admin/departments/${slug}/resources`} replace />;
  }

  if (isLoading || !me) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner />
      </div>
    );
  }

  const dept = data?.departments.find(
    (d) => slugifyDepartment(d.name) === slug,
  );
  if (!dept) return <Navigate to="/" replace />;

  const isManager = me.managedDepartmentIds.includes(dept.id);
  if (!isManager) return <Navigate to={`/departments/${slug}`} replace />;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <AdminDepartmentResourcesPage />
    </div>
  );
}
