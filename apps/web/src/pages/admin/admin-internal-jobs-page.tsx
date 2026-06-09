import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FileDown, FileText, Pencil, Plus, Trash2, X } from "lucide-react";
import type {
  CreateInternalJobInput,
  EmploymentType,
  InternalJob,
  JobReferralRow,
  JobReferralStatus,
} from "@tadhealth/shared";
import {
  EMPLOYMENT_TYPE_LABELS,
  JOB_REFERRAL_STATUS_LABELS,
} from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { RichTextRenderer } from "@/components/editor/rich-text-renderer";
import { htmlToExcerpt } from "@/lib/excerpt";
import { cn } from "@/lib/utils";

type Editing =
  | { kind: "create"; draft: CreateInternalJobInput }
  | { kind: "edit"; id: string; draft: CreateInternalJobInput }
  | null;

const blank: CreateInternalJobInput = {
  title: "",
  department: "",
  location: "",
  employmentType: "full_time",
  description: "",
  requirements: "",
  isPublished: true,
  publishedAt: "",
  closesAt: "",
};

const REFERRAL_FILTERS: { value: JobReferralStatus | "all"; label: string }[] =
  [
    { value: "submitted", label: "Submitted" },
    { value: "reviewing", label: "Reviewing" },
    { value: "contacted", label: "Contacted" },
    { value: "hired", label: "Hired" },
    { value: "passed", label: "Passed" },
    { value: "all", label: "All" },
  ];

function isoForInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function jobToDraft(job: InternalJob): CreateInternalJobInput {
  return {
    title: job.title,
    department: job.department,
    location: job.location ?? "",
    employmentType: job.employmentType,
    description: job.description,
    requirements: job.requirements,
    isPublished: job.isPublished,
    publishedAt: isoForInput(job.publishedAt),
    closesAt: job.closesAt ? isoForInput(job.closesAt) : "",
  };
}

export function AdminInternalJobsPage() {
  const qc = useQueryClient();
  const [previewing, setPreviewing] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const [refFilter, setRefFilter] = useState<JobReferralStatus | "all">(
    "submitted",
  );

  const { data, isLoading } = useQuery<{ jobs: InternalJob[] }>({
    queryKey: ["internal-jobs", "admin"],
    queryFn: () => api("/api/v1/admin/internal-jobs"),
  });

  const refsQ = useQuery<{ referrals: JobReferralRow[] }>({
    queryKey: ["job-referrals", "admin", refFilter],
    queryFn: () => {
      const qs = refFilter === "all" ? "" : `?status=${refFilter}`;
      return api(`/api/v1/admin/job-referrals${qs}`);
    },
  });

  const create = useMutation({
    mutationFn: (input: CreateInternalJobInput) =>
      api("/api/v1/admin/internal-jobs", {
        method: "POST",
        body: JSON.stringify(normalizePayload(input)),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["internal-jobs"] });
      setEditing(null);
    },
  });

  const update = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateInternalJobInput;
    }) =>
      api(`/api/v1/admin/internal-jobs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(normalizePayload(input)),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["internal-jobs"] });
      setEditing(null);
    },
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/admin/internal-jobs/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["internal-jobs"] }),
  });

  const updateReferral = useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobReferralStatus }) =>
      api(`/api/v1/admin/job-referrals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-referrals"] }),
  });

  const error = (create.error ?? update.error) as Error | undefined;
  const errorMessage =
    error instanceof ApiError ? error.message : error?.message;

  function submit() {
    if (!editing) return;
    const payload = normalizePayload(editing.draft);
    if (editing.kind === "create") create.mutate(payload);
    else update.mutate({ id: editing.id, input: payload });
  }

  const jobs = data?.jobs ?? [];
  const referrals = refsQ.data?.referrals ?? [];

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-brand-600">
            Internal job postings visible to all employees. Publishing notifies
            the team.
          </p>
          <Button
            onClick={() => setEditing({ kind: "create", draft: { ...blank } })}
          >
            <Plus className="h-4 w-4" />
            New job
          </Button>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        ) : (
          <Card>
            <ul className="divide-y divide-brand-100">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-brand-50/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-brand-900">
                        {job.title}
                      </p>
                      {!job.isPublished && (
                        <Badge variant="neutral">Draft</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-brand-500">
                      {job.department} ·{" "}
                      {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                      {job.location ? ` · ${job.location}` : ""}
                    </p>
                    {job.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-brand-500">
                        {htmlToExcerpt(job.description, 160)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        setEditing({
                          kind: "edit",
                          id: job.id,
                          draft: jobToDraft(job),
                        })
                      }
                      className="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-100"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${job.title}"?`)) del.mutate(job.id);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
              {jobs.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-brand-500">
                  No job postings yet.
                </li>
              )}
            </ul>
          </Card>
        )}
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-brand-900">
              Employee referrals
            </h2>
            <p className="text-sm text-brand-600">
              Submissions from the team. Update status as you progress candidates.
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-brand-100 bg-white p-1 shadow-soft">
            {REFERRAL_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setRefFilter(f.value)}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
                  refFilter === f.value
                    ? "bg-brand-900 text-white"
                    : "text-brand-600 hover:bg-brand-50",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {refsQ.isLoading ? (
          <div className="grid place-items-center py-10">
            <Spinner />
          </div>
        ) : (
          <Card>
            <ul className="divide-y divide-brand-100">
              {referrals.map((r) => (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-900">
                        {r.candidateName}{" "}
                        <span className="font-normal text-brand-500">
                          ({r.candidateEmail})
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-brand-500">
                        {r.jobTitle} · referred by {r.referrerName ?? "Unknown"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        {r.candidateLinkedIn && (
                          <a
                            href={r.candidateLinkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-xs font-medium text-highlight-700 hover:underline"
                          >
                            LinkedIn profile
                          </a>
                        )}
                        {r.resumeUrl && (
                          <a
                            href={r.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-highlight-700 hover:underline"
                          >
                            <FileDown className="h-3 w-3" />
                            Resume
                          </a>
                        )}
                      </div>
                      {r.note && (
                        <p className="mt-2 max-w-2xl text-xs italic text-brand-600">
                          "{r.note}"
                        </p>
                      )}
                    </div>
                    <Select
                      value={r.status}
                      onChange={(e) =>
                        updateReferral.mutate({
                          id: r.id,
                          status: e.target.value as JobReferralStatus,
                        })
                      }
                      className="w-36 text-xs"
                    >
                      {(Object.keys(JOB_REFERRAL_STATUS_LABELS) as JobReferralStatus[]).map(
                        (s) => (
                          <option key={s} value={s}>
                            {JOB_REFERRAL_STATUS_LABELS[s]}
                          </option>
                        ),
                      )}
                    </Select>
                  </div>
                </li>
              ))}
              {referrals.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-brand-500">
                  No referrals in this filter.
                </li>
              )}
            </ul>
          </Card>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brand-950/40 p-4 backdrop-blur-sm">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-brand-900">
                  {editing.kind === "create" ? "New job posting" : "Edit job"}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg border border-brand-100 bg-brand-50/60 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPreviewing(false)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors",
                        !previewing
                          ? "bg-white text-brand-900 shadow-sm"
                          : "text-brand-500 hover:text-brand-700",
                      )}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewing(true)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors",
                        previewing
                          ? "bg-white text-brand-900 shadow-sm"
                          : "text-brand-500 hover:text-brand-700",
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setEditing(null);
                      setPreviewing(false);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {previewing ? (
                <div className="rounded-2xl border border-brand-100 bg-white p-6">
                  <h2 className="text-2xl font-bold text-brand-900">
                    {editing.draft.title || "Untitled role"}
                  </h2>
                  <p className="mt-2 text-sm text-brand-600">
                    {editing.draft.department || "Department"} ·{" "}
                    {EMPLOYMENT_TYPE_LABELS[editing.draft.employmentType]}
                  </p>
                  {editing.draft.description ? (
                    <RichTextRenderer
                      html={editing.draft.description}
                      className="mt-4"
                    />
                  ) : null}
                  {editing.draft.requirements ? (
                    <>
                      <h3 className="mt-6 text-sm font-semibold text-brand-900">
                        Requirements
                      </h3>
                      <RichTextRenderer
                        html={editing.draft.requirements}
                        className="mt-2"
                      />
                    </>
                  ) : null}
                </div>
              ) : (
                <>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-brand-700">
                      Title
                    </span>
                    <Input
                      value={editing.draft.title}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          draft: { ...editing.draft, title: e.target.value },
                        })
                      }
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-brand-700">
                        Department
                      </span>
                      <Input
                        value={editing.draft.department}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            draft: {
                              ...editing.draft,
                              department: e.target.value,
                            },
                          })
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-brand-700">
                        Location
                      </span>
                      <Input
                        value={editing.draft.location ?? ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            draft: {
                              ...editing.draft,
                              location: e.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-brand-700">
                      Employment type
                    </span>
                    <Select
                      value={editing.draft.employmentType}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          draft: {
                            ...editing.draft,
                            employmentType: e.target.value as EmploymentType,
                          },
                        })
                      }
                    >
                      {(Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]).map(
                        (t) => (
                          <option key={t} value={t}>
                            {EMPLOYMENT_TYPE_LABELS[t]}
                          </option>
                        ),
                      )}
                    </Select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-brand-700">
                      Description
                    </span>
                    <RichTextEditor
                      value={editing.draft.description}
                      onChange={(html) =>
                        setEditing({
                          ...editing,
                          draft: { ...editing.draft, description: html },
                        })
                      }
                      placeholder="About the role…"
                      minHeight="min-h-[160px]"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-brand-700">
                      Requirements
                    </span>
                    <RichTextEditor
                      value={editing.draft.requirements}
                      onChange={(html) =>
                        setEditing({
                          ...editing,
                          draft: { ...editing.draft, requirements: html },
                        })
                      }
                      placeholder="What we're looking for…"
                      minHeight="min-h-[120px]"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-brand-700">
                    <input
                      type="checkbox"
                      checked={editing.draft.isPublished}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          draft: {
                            ...editing.draft,
                            isPublished: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-brand-200"
                    />
                    Published (visible to employees)
                  </label>
                </>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-brand-700">
                  Publish date
                </span>
                <Input
                  type="datetime-local"
                  value={editing.draft.publishedAt ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      draft: { ...editing.draft, publishedAt: e.target.value },
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-brand-700">
                  Closes at (optional)
                </span>
                <Input
                  type="datetime-local"
                  value={editing.draft.closesAt ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      draft: { ...editing.draft, closesAt: e.target.value },
                    })
                  }
                />
                <span className="text-[11px] text-brand-400">
                  After this date the listing is hidden and referrals are closed.
                </span>
              </label>

              {errorMessage && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={submit}
                  disabled={create.isPending || update.isPending}
                >
                  {(create.isPending || update.isPending) && (
                    <Spinner className="border-white/40 border-t-white" />
                  )}
                  Save
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

function normalizePayload(
  draft: CreateInternalJobInput,
): CreateInternalJobInput {
  return {
    title: draft.title,
    department: draft.department,
    location: draft.location?.trim() ? draft.location.trim() : null,
    employmentType: draft.employmentType,
    description: draft.description,
    requirements: draft.requirements,
    isPublished: draft.isPublished,
    ...(draft.publishedAt
      ? { publishedAt: new Date(draft.publishedAt).toISOString() }
      : {}),
    closesAt: draft.closesAt?.trim()
      ? new Date(draft.closesAt).toISOString()
      : null,
  };
}
