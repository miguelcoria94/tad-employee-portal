import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import type {
  TimeOffRequestRow,
  TimeOffStatus,
} from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  KIND_LABEL,
  STATUS_STYLE,
  formatRange,
} from "@/pages/time-off-page";

const STATUS_FILTERS: { value: TimeOffStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

function employeeName(r: TimeOffRequestRow) {
  const first = (r as unknown as { employeeFirstName?: string })
    .employeeFirstName;
  const last = (r as unknown as { employeeLastName?: string | null })
    .employeeLastName;
  if (!first) return "Unknown";
  return last ? `${first} ${last}` : first;
}

export function AdminTimeOffPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<TimeOffStatus | "all">("pending");

  const { data, isLoading } = useQuery<{ requests: TimeOffRequestRow[] }>({
    queryKey: ["time-off", "admin", filter],
    queryFn: () => {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      return api(`/api/v1/admin/time-off${qs}`);
    },
  });

  const decide = useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: "approved" | "declined";
      note: string | null;
    }) =>
      api(`/api/v1/admin/time-off/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, decisionNote: note }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time-off"] }),
  });

  const requests = data?.requests ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-brand-600">
          Time-off requests from across the team.
        </p>
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
      ) : (
        <Card>
          <ul className="divide-y divide-brand-100">
            {requests.map((r) => {
              const style = STATUS_STYLE[r.status];
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-start gap-4 px-5 py-4 hover:bg-brand-50/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-900">
                      {employeeName(r)}{" "}
                      <span
                        className={cn(
                          "ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          style.className,
                        )}
                      >
                        {style.label}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-brand-500">
                      {KIND_LABEL[r.kind]} · {formatRange(r.startsOn, r.endsOn)}
                    </p>
                    {r.note && (
                      <p className="mt-2 max-w-2xl text-xs italic text-brand-600">
                        "{r.note}"
                      </p>
                    )}
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          decide.mutate({
                            id: r.id,
                            status: "approved",
                            note: null,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const note = prompt(
                            "Optional reason for declining (leave blank to skip):",
                            "",
                          );
                          if (note === null) return;
                          decide.mutate({
                            id: r.id,
                            status: "declined",
                            note: note.trim() || null,
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Decline
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
            {requests.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-brand-500">
                Nothing matches this filter.
              </li>
            )}
          </ul>
        </Card>
      )}
    </div>
  );
}