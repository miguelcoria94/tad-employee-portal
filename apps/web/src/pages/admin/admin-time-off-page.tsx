import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Settings, X } from "lucide-react";
import type {
  SetBalancesInput,
  TimeOffKind,
  TimeOffRequestRow,
  TimeOffStatus,
} from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
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

type BalanceRow = {
  kind: string;
  totalDays: number;
  usedDays: number;
  employeeFirstName: string;
  employeeLastName: string | null;
};

function employeeName(r: TimeOffRequestRow) {
  const first = (r as unknown as { employeeFirstName?: string })
    .employeeFirstName;
  const last = (r as unknown as { employeeLastName?: string | null })
    .employeeLastName;
  if (!first) return "Unknown";
  return last ? `${first} ${last}` : first;
}

function summarizeBalances(balances: BalanceRow[]) {
  const summary: Record<string, { count: number; totalDays: number }> = {};
  for (const b of balances) {
    const existing = summary[b.kind];
    if (!existing) {
      summary[b.kind] = { count: 1, totalDays: b.totalDays };
    } else {
      existing.count++;
    }
  }
  return summary;
}

export function AdminTimeOffPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<TimeOffStatus | "all">("pending");
  const [showBalances, setShowBalances] = useState(false);
  const currentYear = new Date().getFullYear();
  const [balanceDraft, setBalanceDraft] = useState<SetBalancesInput>({
    kind: "vacation",
    totalDays: 15,
    year: currentYear,
  });

  const { data, isLoading } = useQuery<{ requests: TimeOffRequestRow[] }>({
    queryKey: ["time-off", "admin", filter],
    queryFn: () => {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      return api(`/api/v1/admin/time-off${qs}`);
    },
  });

  const balancesQ = useQuery<{ balances: BalanceRow[] }>({
    queryKey: ["time-off", "admin-balances", currentYear],
    queryFn: () => api(`/api/v1/admin/time-off/balances?year=${currentYear}`),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-off"] });
    },
  });

  const setBalance = useMutation({
    mutationFn: (input: SetBalancesInput) =>
      api("/api/v1/admin/time-off/balances", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-off", "admin-balances"] });
    },
  });

  const requests = data?.requests ?? [];
  const balanceSummary = summarizeBalances(balancesQ.data?.balances ?? []);

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-brand-900">
              Balance management
            </h2>
            <p className="text-sm text-brand-600">
              Set the number of days each employee gets per type for {currentYear}.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowBalances(!showBalances)}
          >
            <Settings className="h-3.5 w-3.5" />
            {showBalances ? "Hide" : "Manage balances"}
          </Button>
        </div>

        {Object.keys(balanceSummary).length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(KIND_LABEL) as TimeOffKind[]).map((k) => {
              const s = balanceSummary[k];
              if (!s) return null;
              return (
                <div
                  key={k}
                  className="rounded-xl border border-brand-100 bg-white p-3 text-center shadow-soft"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">
                    {KIND_LABEL[k]}
                  </p>
                  <p className="mt-1 text-xl font-bold text-brand-900">
                    {s.totalDays}d
                  </p>
                  <p className="text-[10px] text-brand-400">
                    {s.count} employee{s.count !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {showBalances && (
          <Card>
            <CardBody className="space-y-4">
              <p className="text-xs text-brand-500">
                Set a balance for all active employees at once. This upserts —
                existing balances for the same type/year will be updated.
              </p>
              <div className="grid gap-3 sm:grid-cols-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-brand-700">Type</span>
                  <Select
                    value={balanceDraft.kind}
                    onChange={(e) =>
                      setBalanceDraft({
                        ...balanceDraft,
                        kind: e.target.value as TimeOffKind,
                      })
                    }
                  >
                    {(Object.keys(KIND_LABEL) as TimeOffKind[]).map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABEL[k]}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-brand-700">
                    Total days
                  </span>
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    value={balanceDraft.totalDays}
                    onChange={(e) =>
                      setBalanceDraft({
                        ...balanceDraft,
                        totalDays: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-brand-700">Year</span>
                  <Input
                    type="number"
                    min={2020}
                    max={2099}
                    value={balanceDraft.year}
                    onChange={(e) =>
                      setBalanceDraft({
                        ...balanceDraft,
                        year: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <div className="flex items-end">
                  <Button
                    size="sm"
                    onClick={() => setBalance.mutate(balanceDraft)}
                    disabled={setBalance.isPending}
                  >
                    {setBalance.isPending && (
                      <Spinner className="border-white/40 border-t-white" />
                    )}
                    Apply to all
                  </Button>
                </div>
              </div>
              {setBalance.isSuccess && (
                <p className="text-xs text-emerald-700">
                  Balances updated successfully.
                </p>
              )}
            </CardBody>
          </Card>
        )}
      </div>

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
                        <Button
                          size="sm"
                          onClick={() =>
                            decide.mutate({
                              id: r.id,
                              status: "approved",
                              note: null,
                            })
                          }
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
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
                        >
                          <X className="h-3.5 w-3.5" />
                          Decline
                        </Button>
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
    </div>
  );
}
