import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import {
  type DepartmentRow,
  slugifyDepartment,
} from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";

export function DepartmentsPage() {
  const { data, isLoading } = useQuery<{ departments: DepartmentRow[] }>({
    queryKey: ["departments"],
    queryFn: () => api("/api/v1/departments"),
  });

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

        <header className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
            TadHealth
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-900 md:text-4xl">
            Departments
          </h1>
          <p className="mt-3 max-w-2xl text-base text-brand-600">
            Every team at TadHealth. Click any department to see who's on it.
          </p>
        </header>

        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.departments.map((d) => (
              <li
                key={d.id}
                className="group relative rounded-2xl border border-brand-100 bg-white p-6 shadow-soft transition-colors hover:border-highlight-300"
              >
                <Link
                  to={`/departments/${slugifyDepartment(d.name)}`}
                  className="absolute inset-0 rounded-2xl"
                  aria-label={`Open ${d.name} department`}
                />
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold tracking-tight text-brand-900">
                    {d.name}
                  </h3>
                  <i
                    className="fa-light fa-arrow-up-right text-brand-300 transition-colors group-hover:text-brand-900"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-brand-600">
                  {d.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
