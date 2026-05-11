import { useQuery } from "@tanstack/react-query";
import type { DepartmentRow, Employee } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function AdminOverviewPage() {
  const employees = useQuery<{ employees: Employee[] }>({
    queryKey: ["employees", "all"],
    queryFn: () => api("/api/v1/employees?includeInactive=true"),
  });
  const departments = useQuery<{ departments: DepartmentRow[] }>({
    queryKey: ["departments"],
    queryFn: () => api("/api/v1/departments"),
  });

  if (employees.isLoading || departments.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Spinner />
      </div>
    );
  }

  const all = employees.data?.employees ?? [];
  const active = all.filter((e) => e.isActive);

  const stats = [
    { label: "Active employees", value: active.length },
    { label: "Total in directory", value: all.length },
    { label: "Departments", value: departments.data?.departments.length ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                {s.label}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-brand-900">
                {s.value}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody>
          <h2 className="text-base font-semibold text-brand-900">Welcome.</h2>
          <p className="mt-2 text-sm text-brand-600">
            Use the side nav to manage the directory and the departments shown
            on the home page. Changes go live immediately for anyone signed in.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
