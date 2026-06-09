import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarClock, CheckCircle2 } from "lucide-react";
import type { TimeOffRequestRow } from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/auth/auth-context";
import { useNotifications } from "@/hooks/use-notifications";
import { Card, CardBody } from "@/components/ui/card";

export function ActionItems() {
  const { isAdmin } = useAuth();
  const { unreadCount } = useNotifications();

  const { data: pendingTimeOff } = useQuery<{ requests: TimeOffRequestRow[] }>(
    {
      queryKey: ["time-off", "admin", "pending"],
      enabled: isAdmin,
      queryFn: () => api("/api/v1/admin/time-off?status=pending"),
    },
  );

  const { data: feedbackData } = useQuery<{ count: number }>({
    queryKey: ["feedback", "pending"],
    queryFn: async () => {
      try {
        return await api("/api/v1/feedback/pending");
      } catch (err) {
        if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
          return { count: 0 };
        }
        throw err;
      }
    },
  });

  const pendingCount = pendingTimeOff?.requests?.length ?? 0;
  const feedbackCount = feedbackData?.count ?? 0;

  type ActionItem = { label: string; count: number; to: string; icon: typeof Bell };
  const items: ActionItem[] = [];

  if (unreadCount > 0) {
    items.push({
      label: "Unread notifications",
      count: unreadCount,
      to: "/notifications",
      icon: Bell,
    });
  }
  if (isAdmin && pendingCount > 0) {
    items.push({
      label: "Pending time-off requests",
      count: pendingCount,
      to: "/admin/time-off",
      icon: CalendarClock,
    });
  }
  if (feedbackCount > 0) {
    items.push({
      label: "Feedback requests",
      count: feedbackCount,
      to: "/feedback",
      icon: Bell,
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
        Awaiting Your Action
      </h2>

      {items.length === 0 ? (
        <Card>
          <CardBody className="flex items-center gap-3 py-6">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </span>
            <p className="text-sm font-medium text-brand-600">
              You're all caught up!
            </p>
          </CardBody>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className="group block">
                <Card className="transition-colors group-hover:border-highlight-300">
                  <CardBody className="flex items-center gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-highlight-100 text-highlight-700">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-900">
                        {item.label}
                      </p>
                    </div>
                    <span className="grid h-7 min-w-7 place-items-center rounded-full bg-accent-500 px-2 text-xs font-bold text-white">
                      {item.count}
                    </span>
                  </CardBody>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
