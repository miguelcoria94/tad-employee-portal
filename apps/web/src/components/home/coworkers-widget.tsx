import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import type { Employee } from "@tadhealth/shared";
import { fullName, initials } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/auth-context";
import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

export function CoworkersWidget() {
  const { me } = useAuth();
  const department = me?.employee?.department;
  const myId = me?.employee?.id;

  const { data, isLoading } = useQuery<{ employees: Employee[] }>({
    queryKey: ["employees", "dept", department],
    enabled: !!department,
    queryFn: () =>
      api(`/api/v1/employees?department=${encodeURIComponent(department!)}`),
  });

  const coworkers =
    data?.employees
      ?.filter((e) => e.id !== myId && e.isActive)
      .slice(0, 6) ?? [];

  if (!department) return null;

  return (
    <section>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
        Co-workers
      </h2>
      <Card>
        <CardBody>
          {isLoading ? (
            <div className="grid place-items-center py-6">
              <Spinner />
            </div>
          ) : coworkers.length === 0 ? (
            <p className="py-4 text-center text-sm text-brand-500">
              No co-workers found in {department}.
            </p>
          ) : (
            <ul className="space-y-3">
              {coworkers.map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <Avatar
                    initials={initials(e).toUpperCase()}
                    src={e.avatarUrl}
                    alt={fullName(e)}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-900">
                      {fullName(e)}
                    </p>
                    <p className="truncate text-xs text-brand-500">{e.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/directory"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900"
          >
            View full directory
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardBody>
      </Card>
    </section>
  );
}
