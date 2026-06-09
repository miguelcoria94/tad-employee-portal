import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, FileUp, MapPin, Paperclip } from "lucide-react";
import type {
  CreateJobReferralInput,
  InternalJob,
} from "@tadhealth/shared";
import { EMPLOYMENT_TYPE_LABELS } from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RichTextRenderer } from "@/components/editor/rich-text-renderer";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const blankReferral: CreateJobReferralInput = {
  candidateName: "",
  candidateEmail: "",
  candidateLinkedIn: "",
  note: "",
};

const ACCEPTED_RESUME = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function InternalJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<CreateJobReferralInput>(blankReferral);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading } = useQuery<{ job: InternalJob }>({
    queryKey: ["internal-job", id],
    enabled: !!id,
    queryFn: () => api(`/api/v1/internal-jobs/${id}`),
  });

  const refer = useMutation({
    mutationFn: async (input: CreateJobReferralInput) => {
      const result = await api(`/api/v1/internal-jobs/${id}/referrals`, {
        method: "POST",
        body: JSON.stringify({
          candidateName: input.candidateName.trim(),
          candidateEmail: input.candidateEmail.trim(),
          candidateLinkedIn: input.candidateLinkedIn?.trim()
            ? input.candidateLinkedIn.trim()
            : null,
          note: input.note?.trim() ? input.note.trim() : null,
        }),
      });
      return result as { referral: { id: string } };
    },
    onSuccess: async (data) => {
      if (resumeFile) {
        try {
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;
          if (token) {
            const form = new FormData();
            form.append("file", resumeFile);
            await fetch(
              `${API_URL}/api/v1/internal-jobs/referrals/${data.referral.id}/resume`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: form,
              },
            );
          }
        } catch {
          // Referral was created — resume upload is best-effort
        }
      }
      qc.invalidateQueries({ queryKey: ["job-referrals"] });
      setDraft(blankReferral);
      setResumeFile(null);
      setError(null);
      setSubmitted(true);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : (err as Error).message),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!data?.job) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center text-brand-600">
        This job isn't available.{" "}
        <Link to="/internal-jobs" className="font-semibold text-brand-900">
          Back to Internal Jobs
        </Link>
      </div>
    );
  }

  const job = data.job;

  function submitReferral() {
    setError(null);
    setSubmitted(false);
    if (!draft.candidateName.trim() || !draft.candidateEmail.trim()) {
      setError("Candidate name and email are required.");
      return;
    }
    refer.mutate(draft);
  }

  return (
    <div className="bg-brand-mesh">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to="/internal-jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Internal Jobs
        </Link>

        <header className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
            Open Role
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-900 md:text-4xl">
            {job.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="highlight">{job.department}</Badge>
            <Badge>{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
            {job.location && (
              <span className="inline-flex items-center gap-1 text-sm text-brand-600">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
            )}
          </div>
          <p className="mt-3 text-sm text-brand-500">
            Posted {formatDate(job.publishedAt)}
            {job.closesAt && ` · Accepting referrals through ${formatDate(job.closesAt)}`}
          </p>
        </header>

        {job.description && (
          <Card className="mt-8">
            <CardBody>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-brand-900">
                <Briefcase className="h-4 w-4" />
                About the role
              </h2>
              <RichTextRenderer html={job.description} />
            </CardBody>
          </Card>
        )}

        {job.requirements && (
          <Card className="mt-4">
            <CardBody>
              <h2 className="mb-4 text-base font-semibold text-brand-900">
                What we're looking for
              </h2>
              <RichTextRenderer html={job.requirements} />
            </CardBody>
          </Card>
        )}

        <Card className="mt-8 border-highlight-200">
          <CardBody className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-brand-900">
                Refer a candidate
              </h2>
              <p className="mt-1 text-sm text-brand-600">
                Share someone you think would be a great fit. Recruiting will
                follow up directly — you'll get credit for the referral.
              </p>
            </div>

            {submitted && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Referral submitted — thank you! You can track it on the{" "}
                <Link to="/internal-jobs" className="font-semibold underline">
                  jobs page
                </Link>
                .
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-brand-700">
                  Candidate name
                </span>
                <Input
                  value={draft.candidateName}
                  onChange={(e) =>
                    setDraft({ ...draft, candidateName: e.target.value })
                  }
                  placeholder="Jane Smith"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-brand-700">
                  Candidate email
                </span>
                <Input
                  type="email"
                  value={draft.candidateEmail}
                  onChange={(e) =>
                    setDraft({ ...draft, candidateEmail: e.target.value })
                  }
                  placeholder="jane@example.com"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">
                LinkedIn profile (optional)
              </span>
              <Input
                type="url"
                value={draft.candidateLinkedIn ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, candidateLinkedIn: e.target.value })
                }
                placeholder="https://linkedin.com/in/..."
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">
                Resume (optional — PDF, DOC, DOCX up to 10 MB)
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-brand-700 shadow-sm hover:bg-brand-50"
                >
                  <FileUp className="h-4 w-4" />
                  {resumeFile ? "Change file" : "Choose file"}
                </button>
                {resumeFile && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-brand-600">
                    <Paperclip className="h-3.5 w-3.5" />
                    {resumeFile.name}
                    <button
                      type="button"
                      onClick={() => {
                        setResumeFile(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="ml-1 text-brand-400 hover:text-red-500"
                      title="Remove"
                    >
                      &times;
                    </button>
                  </span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED_RESUME}
                  className="hidden"
                  onChange={(e) => {
                    setResumeFile(e.target.files?.[0] ?? null);
                  }}
                />
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">
                Why are they a fit? (optional)
              </span>
              <Textarea
                value={draft.note ?? ""}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                placeholder="Tell us a bit about their background and why you'd recommend them…"
                rows={4}
              />
            </label>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button onClick={submitReferral} disabled={refer.isPending}>
              {refer.isPending && (
                <Spinner className="border-white/40 border-t-white" />
              )}
              Submit referral
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
