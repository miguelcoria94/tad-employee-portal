import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LayoutGrid, Network } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Employee } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { DirectoryFilters } from "@/components/directory/filters";
import { EmployeeCard } from "@/components/directory/employee-card";
import { EmployeeOrgChart } from "@/components/directory/employee-org-chart";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type View = "list" | "org";

export function DirectoryPage() {
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("");
  const [view, setView] = useState<View>("list");

  const { data, isLoading } = useQuery<{ employees: Employee[] }>({
    queryKey: ["employees", { q, department }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (department) params.set("department", department);
      const qs = params.toString();
      return api(`/api/v1/employees${qs ? `?${qs}` : ""}`);
    },
  });

  const employees = data?.employees ?? [];

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) {
      set.add(e.department);
      if (e.subDepartment) set.add(e.subDepartment);
    }
    return [...set].sort();
  }, [employees]);

  return (
    <div className="bg-brand-mesh">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Portal
            </Link>

            <div className="inline-flex rounded-xl border border-brand-100 bg-white p-1 shadow-soft">
              <button
                onClick={() => setView("list")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  view === "list"
                    ? "bg-brand-900 text-white"
                    : "text-brand-600 hover:bg-brand-50",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                List View
              </button>
              <button
                onClick={() => setView("org")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  view === "org"
                    ? "bg-brand-900 text-white"
                    : "text-brand-600 hover:bg-brand-50",
                )}
              >
                <Network className="h-4 w-4" />
                Org Chart
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
              TadHealth
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-900 md:text-4xl">
              Team Directory
            </h1>
          </div>

          <DirectoryFilters
            q={q}
            onQueryChange={setQ}
            department={department}
            onDepartmentChange={setDepartment}
            departments={departments}
          />
        </div>

        <div className="mt-10">
          {isLoading ? (
            <div className="grid place-items-center py-16">
              <Spinner />
            </div>
          ) : employees.length === 0 ? (
            <EmptyState
              title="No teammates found"
              description="Try clearing your search or pick a different department."
            />
          ) : view === "list" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {employees.map((e) => (
                <EmployeeCard key={e.id} employee={e} />
              ))}
            </div>
          ) : (
            <EmployeeOrgChart employees={employees} />
          )}
        </div>
      </div>
    </div>
  );
}