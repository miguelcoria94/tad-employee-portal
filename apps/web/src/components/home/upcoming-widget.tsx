import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cake, PartyPopper } from "lucide-react";
import type { Employee } from "@tadhealth/shared";
import { fullName } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { initials } from "@tadhealth/shared";
import { Spinner } from "@/components/ui/spinner";

type Item = {
  employee: Employee;
  date: Date;
  kind: "birthday" | "anniversary";
  yearsAtCompany?: number;
};

function daysFromToday(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return Math.round((x.getTime() - today.getTime()) / 86_400_000);
}

function nextOccurrence(monthDay: string): Date {
  // monthDay = "YYYY-MM-DD"; project onto this year (or next year if past)
  const [, mm, dd] = monthDay.split("-").map(Number);
  const now = new Date();
  const candidate = new Date(now.getFullYear(), (mm ?? 1) - 1, dd ?? 1);
  if (daysFromToday(candidate) < 0) {
    candidate.setFullYear(candidate.getFullYear() + 1);
  }
  return candidate;
}

function relativeLabel(date: Date) {
  const d = daysFromToday(date);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d < 7) return `in ${d} days`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function UpcomingWidget() {
  const { data, isLoading } = useQuery<{ employees: Employee[] }>({
    queryKey: ["employees"],
    queryFn: () => api("/api/v1/employees"),
  });

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    for (const e of data?.employees ?? []) {
      if (e.birthday) {
        const date = nextOccurrence(e.birthday);
        if (daysFromToday(date) <= 30) {
          list.push({ employee: e, date, kind: "birthday" });
        }
      }
      if (e.startDate) {
        const date = nextOccurrence(e.startDate);
        if (daysFromToday(date) <= 30) {
          // only count true work-iversaries (>=1 year)
          const startYear = new Date(e.startDate).getFullYear();
          const years = date.getFullYear() - startYear;
          if (years >= 1) {
            list.push({
              employee: e,
              date,
              kind: "anniversary",
              yearsAtCompany: years,
            });
          }
        }
      }
    }
    list.sort((a, b) => a.date.getTime() - b.date.getTime());
    return list.slice(0, 8);
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardBody className="grid place-items-center py-10">
          <Spinner />
        </CardBody>
      </Card>
    );
  }

  if (items.length === 0) {
    // Don't show the widget when there's nothing in the next 30 days — keeps
    // the home page clean for first-launch when birthdays aren't filled in.
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
          Coming up
        </h2>
        <span className="text-xs text-brand-400">
          Birthdays & work-iversaries in the next 30 days
        </span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => {
          const Icon = item.kind === "birthday" ? Cake : PartyPopper;
          const tone =
            item.kind === "birthday"
              ? "bg-accent-100 text-accent-700"
              : "bg-highlight-100 text-highlight-700";
          return (
            <li
              key={`${item.employee.id}-${item.kind}-${i}`}
              className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3 shadow-soft"
            >
              <Avatar
                initials={initials(item.employee).toUpperCase()}
                src={item.employee.avatarUrl}
                alt={fullName(item.employee)}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-900">
                  {fullName(item.employee)}
                </p>
                <p className="truncate text-xs text-brand-500">
                  {item.kind === "birthday"
                    ? `Birthday · ${relativeLabel(item.date)}`
                    : `${item.yearsAtCompany}yr · ${relativeLabel(item.date)}`}
                </p>
              </div>
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tone}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}