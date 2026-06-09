import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type {
  CreateTimeOffRequestInput,
  TimeOffKind,
  TimeOffBalance,
  TimeOffRequestRow,
  TimeOffStatus,
} from "@tadhealth/shared";
import { countDays } from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<TimeOffKind, string> = {
  vacation: "Vacation",
  sick: "Sick",
  personal: "Personal",
  other: "Other",
};

const STATUS_STYLE: Record<TimeOffStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800" },
  declined: { label: "Declined", className: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelled", className: "bg-brand-100 text-brand-700" },
};

function formatRange(startsOn: string, endsOn: string) {
  const start = new Date(startsOn + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (startsOn === endsOn) return start;
  const end = new Date(endsOn + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${start} – ${end}`;
}

const blank: CreateTimeOffRequestInput = {
  kind: "vacation",
  startsOn: "",
  endsOn: "",
  note: "",
};

const KIND_COLOR: Record<TimeOffKind, string> = {
  vacation: "bg-highlight-400",
  sick: "bg-accent-400",
  personal: "bg-brand-400",
  other: "bg-brand-200",
};

function BalanceBar({ kind, bal }: { kind: TimeOffKind; bal: TimeOffBalance }) {
  const pct = bal.totalDays > 0 ? Math.min(100, (bal.usedDays / bal.totalDays) * 100) : 0;
  const remaining = bal.totalDays - bal.usedDays;
  return (
    <div className="flex items-center gap-4">
      <span className="w-20 text-xs font-semibold text-brand-700">{KIND_LABEL[kind]}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-100">
        <div
          className={cn("h-full rounded-full transition-all", KIND_COLOR[kind])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-24 text-right text-xs text-brand-600">
        {bal.usedDays} / {bal.totalDays} used
      </span>
      <Badge variant={remaining > 0 ? "highlight" : "neutral"} className="w-16 justify-center">
        {remaining}d left
      </Badge>
    </div>
  );
}

export function TimeOffPage() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<CreateTimeOffRequestInput>(blank);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ requests: TimeOffRequestRow[] }>({
    queryKey: ["time-off", "mine"],
    queryFn: () => api("/api/v1/time-off"),
  });

  const balancesQ = useQuery<{ balances: TimeOffBalance[] }>({
    queryKey: ["time-off", "balances"],
    queryFn: () => api("/api/v1/time-off/balances"),
  });

  const balanceMap = new Map(
    (balancesQ.data?.balances ?? []).map((b) => [b.kind, b]),
  );

  const create = useMutation({
    mutationFn: (input: CreateTimeOffRequestInput) =>
      api("/api/v1/time-off", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-off"] });
      setDraft(blank);
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : (err as Error).message),
  });

  const cancel = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/time-off/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time-off"] }),
  });

  const requestedDays =
    draft.startsOn && draft.endsOn && draft.endsOn >= draft.startsOn
      ? countDays(draft.startsOn, draft.endsOn)
      : 0;

  const currentBal = balanceMap.get(draft.kind);
  const remaining = currentBal ? currentBal.totalDays - currentBal.usedDays : null;
  const overBudget = remaining !== null && requestedDays > 0 && requestedDays > remaining;

  function submit() {
    setError(null);
    if (!draft.startsOn || !draft.endsOn) {
      setError("Pick a start and end date.");
      return;
    }
    if (overBudget) {
      setError(
        `Insufficient ${draft.kind} balance: ${requestedDays} day(s) requested but only ${remaining} remaining.`,
      );
      return;
    }
    create.mutate({
      kind: draft.kind,
      startsOn: draft.startsOn,
      endsOn: draft.endsOn,
      note: draft.note?.trim() ? draft.note.trim() : null,
    });
  }

  const requests = data?.requests ?? [];
  const balances = balancesQ.data?.balances ?? [];

  return (
    <div className="bg-brand-mesh">
      <div className="mx-auto max-w-3xl px-6 py-12">
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
            Time Off
          </h1>
          <p className="mt-3 max-w-2xl text-base text-brand-600">
            Request time off for vacation, sick days, or anything else. Admins
            get notified and will approve or decline.
          </p>
        </header>

        {balances.length > 0 && (
          <Card className="mt-8">
            <CardBody className="space-y-3">
              <h2 className="text-sm font-semibold text-brand-900">
                Your {new Date().getFullYear()} balances
              </h2>
              {balances.map((b) => (
                <BalanceBar key={b.kind} kind={b.kind as TimeOffKind} bal={b} />
              ))}
            </CardBody>
          </Card>
        )}

        <Card className="mt-6">
          <CardBody className="space-y-4">
            <h2 className="text-base font-semibold text-brand-900">
              New request
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-brand-700">Type</span>
                <Select
                  value={draft.kind}
                  onChange={(e) =>
                    setDraft({ ...draft, kind: e.target.value as TimeOffKind })
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
                <span className="text-xs font-medium text-brand-700">Start</span>
                <Input
                  type="date"
                  value={draft.startsOn}
                  onChange={(e) =>
                    setDraft({ ...draft, startsOn: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-brand-700">End</span>
                <Input
                  type="date"
                  value={draft.endsOn}
                  onChange={(e) =>
                    setDraft({ ...draft, endsOn: e.target.value })
                  }
                />
              </label>
            </div>

            {requestedDays > 0 && (
              <p className={cn("text-xs font-medium", overBudget ? "text-red-600" : "text-brand-600")}>
                {requestedDays} day(s) requested
                {remaining !== null && ` — ${remaining} ${draft.kind} day(s) remaining`}
              </p>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">
                Note (optional)
              </span>
              <Textarea
                rows={3}
                placeholder="Anything the team should know — coverage plan, time-zone offset, etc."
                value={draft.note ?? ""}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              />
            </label>
            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={submit} disabled={create.isPending || overBudget}>
                {create.isPending ? (
                  <Spinner className="border-white/40 border-t-white" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Submit request
                  </>
                )}
              </Button>
            </div>
          </CardBody>
        </Card>

        <section className="mt-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
            Your requests
          </h2>
          {isLoading ? (
            <div className="grid place-items-center py-12">
              <Spinner />
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              title="No requests yet"
              description="Submit one above and it'll show up here with its status."
            />
          ) : (
            <ul className="space-y-2">
              {requests.map((r) => {
                const style = STATUS_STYLE[r.status];
                return (
                  <li
                    key={r.id}
                    className="flex items-start gap-4 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand-900">
                          {KIND_LABEL[r.kind]}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            style.className,
                          )}
                        >
                          {style.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-brand-600">
                        {formatRange(r.startsOn, r.endsOn)}
                      </p>
                      {r.note && (
                        <p className="mt-2 text-xs italic text-brand-500">
                          "{r.note}"
                        </p>
                      )}
                      {r.decisionNote && (
                        <p className="mt-2 text-xs text-brand-700">
                          <span className="font-semibold">Note from admin:</span>{" "}
                          {r.decisionNote}
                        </p>
                      )}
                    </div>
                    {r.status === "pending" && (
                      <button
                        onClick={() => {
                          if (confirm("Cancel this request?"))
                            cancel.mutate(r.id);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                        title="Cancel"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export { KIND_LABEL, STATUS_STYLE, formatRange };
