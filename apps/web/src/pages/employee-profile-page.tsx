import { Link, useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Cake,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import type { Employee } from "@tadhealth/shared";
import { fullName, initials } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/auth-context";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatBirthday(iso: string | null | undefined) {
  if (!iso) return null;
  // Show month + day only (no year)
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

function yearsAtCompany(startDate: string | null | undefined): string | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  const now = new Date();
  const years = now.getFullYear() - start.getFullYear();
  const months =
    now.getMonth() -
    start.getMonth() +
    (now.getDate() >= start.getDate() ? 0 : -1);
  const total = years * 12 + months;
  if (total < 1) return "< 1 month";
  if (total < 12) return `${total} month${total === 1 ? "" : "s"}`;
  const y = Math.floor(total / 12);
  const m = total % 12;
  return m > 0 ? `${y}y ${m}m` : `${y} year${y === 1 ? "" : "s"}`;
}

export function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, me } = useAuth();

  const { data, isLoading, error } = useQuery<{ employee: Employee }>({
    queryKey: ["employee", id],
    enabled: !!id,
    queryFn: () => api(`/api/v1/employees/${id}`),
  });

  const managerQ = useQuery<{ employee: Employee }>({
    queryKey: ["employee", data?.employee.managerId],
    enabled: !!data?.employee.managerId,
    queryFn: () => api(`/api/v1/employees/${data!.employee.managerId}`),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return <Navigate to="/directory" replace />;
  }

  const e = data.employee;
  const isSelf = me?.employee?.id === e.id;
  const manager = managerQ.data?.employee ?? null;

  return (
    <div className="bg-brand-mesh min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to="/directory"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Team Directory
        </Link>

        {/* Header card */}
        <Card className="mt-8">
          <CardBody>
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <Avatar
                initials={initials(e).toUpperCase()}
                src={e.avatarUrl}
                alt={fullName(e)}
                size="xl"
              />
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-extrabold tracking-tight text-brand-900">
                    {fullName(e)}
                  </h1>
                  {isSelf && (
                    <Badge variant="highlight">You</Badge>
                  )}
                  {isAdmin && !e.isActive && (
                    <Badge variant="accent">Inactive</Badge>
                  )}
                </div>
                <p className="mt-1 text-base text-brand-600">{e.title}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Badge variant="highlight">{e.department}</Badge>
                  {e.subDepartment && (
                    <Badge variant="neutral">{e.subDepartment}</Badge>
                  )}
                </div>
              </div>
              {isSelf && (
                <Link
                  to="/me"
                  className="shrink-0 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:border-highlight-400 hover:text-highlight-700"
                >
                  Edit profile
                </Link>
              )}
            </div>
          </CardBody>
        </Card>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {/* Contact */}
          <Card>
            <CardBody className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                Contact
              </p>
              <a
                href={`mailto:${e.email}`}
                className="flex items-center gap-3 text-sm font-medium text-brand-700 hover:text-brand-900"
              >
                <Mail className="h-4 w-4 shrink-0 text-brand-400" />
                {e.email}
              </a>
              {e.phone && (
                <a
                  href={`tel:${e.phone}`}
                  className="flex items-center gap-3 text-sm text-brand-700 hover:text-brand-900"
                >
                  <Phone className="h-4 w-4 shrink-0 text-brand-400" />
                  {e.phone}
                </a>
              )}
              {e.location && (
                <div className="flex items-center gap-3 text-sm text-brand-600">
                  <MapPin className="h-4 w-4 shrink-0 text-brand-400" />
                  {e.location}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Org */}
          <Card>
            <CardBody className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                Organization
              </p>
              <div className="flex items-center gap-3 text-sm text-brand-600">
                <Building2 className="h-4 w-4 shrink-0 text-brand-400" />
                {e.subDepartment
                  ? `${e.department} — ${e.subDepartment}`
                  : e.department}
              </div>
              <div className="flex items-center gap-3 text-sm text-brand-600">
                <Briefcase className="h-4 w-4 shrink-0 text-brand-400" />
                {e.title}
              </div>
              {manager && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 shrink-0 text-brand-400" />
                  <span className="text-brand-500">Reports to</span>
                  <Link
                    to={`/directory/${manager.id}`}
                    className="font-medium text-brand-700 hover:text-brand-900"
                  >
                    {fullName(manager)}
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Bio */}
          {e.bio && (
            <Card className="sm:col-span-2">
              <CardBody className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                  About
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-700">
                  {e.bio}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Admin-only details */}
          {isAdmin && (e.startDate || e.birthday) && (
            <Card className="sm:col-span-2">
              <CardBody className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                  Details{" "}
                  <span className="ml-1 rounded-md bg-accent-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-700">
                    Admin
                  </span>
                </p>
                {e.startDate && (
                  <div className="flex items-center gap-3 text-sm text-brand-600">
                    <CalendarDays className="h-4 w-4 shrink-0 text-brand-400" />
                    <span>
                      Started {formatDate(e.startDate)}
                      {yearsAtCompany(e.startDate) && (
                        <span className="ml-2 text-brand-400">
                          ({yearsAtCompany(e.startDate)})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {e.birthday && (
                  <div className="flex items-center gap-3 text-sm text-brand-600">
                    <Cake className="h-4 w-4 shrink-0 text-brand-400" />
                    Birthday: {formatBirthday(e.birthday)}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}