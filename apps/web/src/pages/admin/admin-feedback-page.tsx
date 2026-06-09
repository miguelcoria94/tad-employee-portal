import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FeedbackStatus = "pending" | "completed" | "declined";

type AdminFeedbackRow = {
  id: string;
  subjectName: string;
  requesterName: string;
  respondentName: string;
  status: FeedbackStatus;
  isAnonymous: boolean;
  createdAt: string;
  completedAt: string | null;
};

const STATUS_FILTERS: { value: FeedbackStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "declined", label: "Declined" },
];

const STATUS_BADGE: Record<FeedbackStatus, { label: string; variant: "neutral" | "highlight" | "success" | "accent" }> = {
  pending: { label: "Pending", variant: "neutral" },
  completed: { label: "Completed", variant: "success" },
  declined: { label: "Declined", variant: "accent" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminFeedbackPage() {
  const [filter, setFilter] = useState<FeedbackStatus | "all">("all");

  const { data, isLoading } = useQuery<{ feedbackRequests: AdminFeedbackRow[] }>({
    queryKey: ["feedback", "admin", filter],
    queryFn: () => {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      return api(`/api/v1/admin/feedback${qs}`);
    },
  });

  const requests = data?.feedbackRequests ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-brand-900">
            Feedback Requests
          </h2>
          <p className="text-sm text-brand-600">
            All feedback requests across the organization.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-brand-100 bg-white p-1 shadow-soft">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
                filter === f.value
                  ? "bg-brand-900 text-white"
                  : "text-brand-600 hover:bg-brand-50",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Spinner />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-brand-100 bg-white px-5 py-8 text-center text-sm text-brand-500 shadow-soft">
          No feedback requests match this filter.
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-brand-500">
                    Subject
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-brand-500">
                    Requester
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-brand-500">
                    Respondent
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-brand-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-brand-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {requests.map((r) => {
                  const badge = STATUS_BADGE[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-brand-50/40">
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-brand-900">
                        {r.subjectName}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-brand-600">
                        {r.requesterName}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-brand-600">
                        {r.isAnonymous ? (
                          <span className="italic text-brand-400">Anonymous</span>
                        ) : (
                          r.respondentName
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-brand-500">
                        {formatDate(r.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
