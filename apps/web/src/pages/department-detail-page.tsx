import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import {
  type DepartmentResourceRow,
  type DepartmentRow,
  type Employee,
  slugifyDepartment,
} from "@tadhealth/shared";
import { api } from "@/lib/api";
import { EmployeeCard } from "@/components/directory/employee-card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { departmentIcon, departmentIconStyle } from "@/lib/department-icons";
import {
  DocumentsSection,
  ToolsSection,
} from "@/components/department/resources-section";

export function DepartmentDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const departmentsQ = useQuery<{ departments: DepartmentRow[] }>({
    queryKey: ["departments"],
    queryFn: () => api("/api/v1/departments"),
  });

  const department = departmentsQ.data?.departments.find(
    (d) => slugifyDepartment(d.name) === slug,
  );

  const employeesQ = useQuery<{ employees: Employee[] }>({
    queryKey: ["employees", "by-department", department?.name],
    enabled: !!department,
    queryFn: () =>
      api(
        `/api/v1/employees?department=${encodeURIComponent(department!.name)}`,
      ),
  });

  const resourcesQ = useQuery<{ resources: DepartmentResourceRow[] }>({
    queryKey: ["department-resources", department?.name],
    enabled: !!department,
    queryFn: () =>
      api(
        `/api/v1/department-resources?department=${encodeURIComponent(department!.name)}`,
      ),
  });

  if (departmentsQ.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!department) {
    return <Navigate to="/" replace />;
  }

  const employees = employeesQ.data?.employees ?? [];
  const resources = resourcesQ.data?.resources ?? [];

  return (
    <div className="bg-brand-mesh">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portal
        </Link>

        <header className="mt-8 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-highlight-100 text-highlight-700 shadow-soft">
              <i
                className={`${departmentIcon(department.name)} text-[26px] leading-none`}
                style={departmentIconStyle}
                aria-hidden="true"
              />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
              Department
            </p>
          </div>
          <div className="flex items-end justify-between gap-6">
            <h1 className="text-4xl font-extrabold tracking-tight text-brand-900 md:text-5xl">
              {department.name}
            </h1>
            <Badge variant="highlight">{employees.length} teammates</Badge>
          </div>
          <p className="max-w-3xl text-lg text-brand-600">
            {department.description}
          </p>
        </header>

        <section className="mt-12">
          <h2 className="mb-5 text-base font-semibold uppercase tracking-wide text-brand-500">
            Team
          </h2>

          {employeesQ.isLoading ? (
            <div className="grid place-items-center py-16">
              <Spinner />
            </div>
          ) : employees.length === 0 ? (
            <EmptyState
              title="No teammates yet"
              description="Once employees are added to this department, they'll show up here."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {employees.map((e) => (
                <EmployeeCard key={e.id} employee={e} />
              ))}
            </div>
          )}
        </section>

        <ToolsSection
          tools={resources.filter((r) => r.kind === "tool")}
        />
        <DocumentsSection
          documents={resources.filter((r) => r.kind === "document")}
        />
      </div>
    </div>
  );
}
