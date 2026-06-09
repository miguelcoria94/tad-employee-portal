import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, MapPin } from "lucide-react";
import type { InternalJob, JobReferralRow } from "@tadhealth/shared";
import { EMPLOYMENT_TYPE_LABELS } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { htmlToExcerpt } from "@/lib/excerpt";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InternalJobsPage() {
  const jobsQ = useQuery<{ jobs: InternalJob[] }>({
    queryKey: ["internal-jobs"],
    queryFn: () => api("/api/v1/internal-jobs"),
  });
  const refsQ = useQuery<{ referrals: JobReferralRow[] }>({
    queryKey: ["job-referrals", "mine"],
    queryFn: () => api("/api/v1/internal-jobs/referrals/mine"),
  });

  const jobs = jobsQ.data?.jobs ?? [];
  const referrals = refsQ.data?.referrals ?? [];
  const loading = jobsQ.isLoading;

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
            Internal Jobs
          </h1>
          <p className="mt-3 max-w-2xl text-base text-brand-600">
            Open roles across TadHealth. Know someone great? Refer them — our
            recruiting team reviews every submission.
          </p>
        </header>

        {loading ? (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        ) : (
          <>
            <section className="mt-10">
              <div className="mb-5 flex items-center gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                  Open Positions
                </h2>
                {jobs.length > 0 && (
                  <Badge variant="highlight">{jobs.length}</Badge>
                )}
              </div>

              {jobs.length === 0 ? (
                <EmptyState
                  title="No open roles right now"
                  description="Check back soon — new postings show up here when they're published."
                />
              ) : (
                <ul className="space-y-3">
                  {jobs.map((job) => (
                    <li key={job.id}>
                      <Link
                        to={`/internal-jobs/${job.id}`}
                        className="group block rounded-2xl border border-brand-100 bg-white p-5 shadow-soft transition-colors hover:border-highlight-300"
                      >
                        <div className="flex items-start gap-4">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                            <Briefcase className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold tracking-tight text-brand-900 group-hover:text-highlight-700">
                              {job.title}
                            </h3>
                            <p className="mt-1 text-sm font-medium text-brand-600">
                              {job.department} ·{" "}
                              {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                            </p>
                            {job.location && (
                              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-brand-500">
                                <MapPin className="h-3.5 w-3.5" />
                                {job.location}
                              </p>
                            )}
                            {job.description && (
                              <p className="mt-3 line-clamp-2 text-sm text-brand-700">
                                {htmlToExcerpt(job.description, 160)}
                              </p>
                            )}
                            <p className="mt-3 text-xs text-brand-400">
                              Posted {formatDate(job.publishedAt)}
                              {job.closesAt &&
                                ` · Closes ${formatDate(job.closesAt)}`}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {referrals.length > 0 && (
              <section className="mt-12">
                <div className="mb-5 flex items-center gap-3">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                    Your Referrals
                  </h2>
                  <Badge>{referrals.length}</Badge>
                </div>
                <Card>
                  <ul className="divide-y divide-brand-100">
                    {referrals.map((r) => (
                      <li key={r.id} className="px-5 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-brand-900">
                              {r.candidateName}
                            </p>
                            <p className="mt-0.5 text-xs text-brand-500">
                              {r.jobTitle} · submitted{" "}
                              {formatDate(r.createdAt)}
                            </p>
                          </div>
                          <Badge variant="neutral">{r.status}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            )}

          </>
        )}
      </div>
    </div>
  );
}
