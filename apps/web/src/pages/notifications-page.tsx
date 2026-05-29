import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  Calendar,
  CalendarClock,
  CheckCheck,
  CheckCircle,
  ClipboardList,
  FolderOpen,
  Megaphone,
  MessageSquare,
  UserCog,
} from "lucide-react";
import type { NotificationKind, NotificationRow } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const ICON_BY_KIND: Record<NotificationKind, typeof Bell> = {
  new_update: Megaphone,
  new_event: Calendar,
  new_survey: ClipboardList,
  new_resource: FolderOpen,
  survey_response: MessageSquare,
  profile_update: UserCog,
  time_off_request: CalendarClock,
  time_off_decision: CheckCircle,
  update_comment: MessageSquare,
  changelog: Bell,
};

const LABEL_BY_KIND: Record<NotificationKind, string> = {
  new_update: "Updates",
  new_event: "Events",
  new_survey: "Surveys",
  new_resource: "Resources",
  survey_response: "Survey responses",
  profile_update: "Profile changes",
  time_off_request: "Time-off requests",
  time_off_decision: "Time-off decisions",
  update_comment: "Comments",
  changelog: "Changelog",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<NotificationKind | "all">("all");

  const { data, isLoading } = useQuery<{
    notifications: NotificationRow[];
    unreadCount: number;
  }>({
    queryKey: ["notifications", "full"],
    queryFn: () => api("/api/v1/notifications?limit=200"),
  });

  const markOne = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: () =>
      api("/api/v1/notifications/mark-all-read", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const all = data?.notifications ?? [];
  const filtered =
    filter === "all" ? all : all.filter((n) => n.kind === filter);
  const presentKinds = [...new Set(all.map((n) => n.kind))];

  function open(n: NotificationRow) {
    if (!n.readAt) markOne.mutate(n.id);
    navigate(n.link);
  }

  return (
    <div className="bg-brand-mesh">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portal
        </Link>

        <header className="mt-8 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
              TadHealth
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-900 md:text-4xl">
              Notifications
            </h1>
            <p className="mt-2 text-sm text-brand-600">
              Everything that's pinged you. {data?.unreadCount ?? 0} unread.
            </p>
          </div>
          {(data?.unreadCount ?? 0) > 0 && (
            <button
              onClick={() => markAll.mutate()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm font-semibold text-brand-700 shadow-sm hover:bg-brand-50"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </header>

        {presentKinds.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                filter === "all"
                  ? "bg-brand-900 text-white"
                  : "bg-white text-brand-600 ring-1 ring-inset ring-brand-100 hover:bg-brand-50",
              )}
            >
              All
            </button>
            {presentKinds.map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  filter === k
                    ? "bg-brand-900 text-white"
                    : "bg-white text-brand-600 ring-1 ring-inset ring-brand-100 hover:bg-brand-50",
                )}
              >
                {LABEL_BY_KIND[k]}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6">
          {isLoading ? (
            <div className="grid place-items-center py-16">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Nothing here"
              description={
                filter === "all"
                  ? "You haven't received any notifications yet."
                  : "No notifications match this filter."
              }
            />
          ) : (
            <Card>
              <ul className="divide-y divide-brand-100">
                {filtered.map((n) => {
                  const Icon = ICON_BY_KIND[n.kind] ?? Bell;
                  const unread = !n.readAt;
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => open(n)}
                        className={cn(
                          "flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-brand-50/40",
                          unread && "bg-highlight-50/30",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                            unread
                              ? "bg-highlight-400 text-brand-950"
                              : "bg-brand-50 text-brand-600",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-brand-900">
                              {n.title}
                            </p>
                            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-600">
                              {LABEL_BY_KIND[n.kind]}
                            </span>
                          </div>
                          {n.body && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-brand-600">
                              {n.body}
                            </p>
                          )}
                          <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-brand-400">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                        {unread && (
                          <span
                            aria-hidden
                            className="mt-3 h-2 w-2 shrink-0 rounded-full bg-accent-500"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}