import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare, Plus } from "lucide-react";
import type { FeedbackAnswer, FeedbackQuestion } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { RichTextRenderer } from "@/components/editor/rich-text-renderer";
import { cn } from "@/lib/utils";

type FeedbackStatus = "pending" | "completed" | "declined";

type PendingFeedback = {
  id: string;
  requestType: "self" | "about_other";
  subjectEmployee: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatarUrl: string | null;
    title: string | null;
  };
  requesterName: string;
  isAnonymous: boolean;
  createdAt: string;
};

type ReceivedFeedback = {
  requestId: string;
  respondentName: string | null;
  isAnonymous: boolean;
  questions: FeedbackQuestion[];
  answers: FeedbackAnswer[];
  completedAt: string;
};

type RequestedFeedback = {
  id: string;
  requestType: "self" | "about_other";
  subjectEmployee: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatarUrl: string | null;
  };
  respondent: {
    firstName: string | null;
    lastName: string | null;
  };
  status: FeedbackStatus;
  isAnonymous: boolean;
  createdAt: string;
};

const tabs = ["Give Feedback", "Received", "Requested"] as const;
type Tab = (typeof tabs)[number];

const STATUS_STYLE: Record<
  FeedbackStatus,
  { label: string; variant: "neutral" | "highlight" | "success" | "accent" }
> = {
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

function initials(firstName: string, lastName: string | null) {
  return `${firstName.charAt(0)}${(lastName ?? "").charAt(0) || ""}`.toUpperCase();
}

export function FeedbackPage() {
  const [tab, setTab] = useState<Tab>("Give Feedback");

  const pendingQ = useQuery<{ feedbackRequests: PendingFeedback[] }>({
    queryKey: ["feedback", "pending"],
    queryFn: () => api("/api/v1/feedback/pending"),
  });

  const receivedQ = useQuery<{ feedback: ReceivedFeedback[] }>({
    queryKey: ["feedback", "about-me"],
    queryFn: () => api("/api/v1/feedback/about-me"),
  });

  const requestedQ = useQuery<{ feedbackRequests: RequestedFeedback[] }>({
    queryKey: ["feedback", "requested"],
    queryFn: () => api("/api/v1/feedback/requested"),
  });

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
            Feedback
          </h1>
          <p className="mt-3 max-w-2xl text-base text-brand-600">
            Give and receive feedback to help your colleagues grow.
          </p>
        </header>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="inline-flex rounded-xl border border-brand-100 bg-white p-1 shadow-soft">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  tab === t
                    ? "bg-brand-900 text-white"
                    : "text-brand-600 hover:bg-brand-50",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <Link to="/feedback/request">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Request Feedback
            </Button>
          </Link>
        </div>

        <section className="mt-6">
          {tab === "Give Feedback" && (
            <GiveFeedbackTab
              data={pendingQ.data?.feedbackRequests}
              isLoading={pendingQ.isLoading}
            />
          )}
          {tab === "Received" && (
            <ReceivedTab
              data={receivedQ.data?.feedback}
              isLoading={receivedQ.isLoading}
            />
          )}
          {tab === "Requested" && (
            <RequestedTab
              data={requestedQ.data?.feedbackRequests}
              isLoading={requestedQ.isLoading}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function GiveFeedbackTab({
  data,
  isLoading,
}: {
  data: PendingFeedback[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid place-items-center py-12">
        <Spinner />
      </div>
    );
  }

  const items = data ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        title="No pending feedback"
        description="You're all caught up! When someone requests your feedback, it'll appear here."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-4 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft"
        >
          <Avatar
            initials={initials(
              item.subjectEmployee.firstName,
              item.subjectEmployee.lastName,
            )}
            src={item.subjectEmployee.avatarUrl}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-brand-900">
              {item.subjectEmployee.firstName}{" "}
              {item.subjectEmployee.lastName ?? ""}
            </p>
            <p className="mt-0.5 text-xs text-brand-500">
              Requested by {item.requesterName} · {formatDate(item.createdAt)}
            </p>
          </div>
          <Link to={`/feedback/${item.id}/give`}>
            <Button size="sm">
              <MessageSquare className="h-3.5 w-3.5" />
              Give Feedback
            </Button>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ReceivedTab({
  data,
  isLoading,
}: {
  data: ReceivedFeedback[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid place-items-center py-12">
        <Spinner />
      </div>
    );
  }

  const items = data ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        title="No feedback received"
        description="When others give feedback about you, it'll appear here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <Card key={`${item.requestId}-${i}`}>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-900">
                {item.isAnonymous
                  ? "Anonymous"
                  : (item.respondentName ?? "Unknown")}
              </p>
              <span className="text-xs text-brand-500">
                {formatDate(item.completedAt)}
              </span>
            </div>
            <div className="space-y-3">
              {item.answers.map((a) => (
                <div key={a.questionId}>
                  <p className="text-xs font-medium text-brand-700">
                    {a.label}
                  </p>
                  <RichTextRenderer
                    html={a.answerHtml}
                    className="mt-1 text-sm text-brand-600"
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}
    </ul>
  );
}

function RequestedTab({
  data,
  isLoading,
}: {
  data: RequestedFeedback[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid place-items-center py-12">
        <Spinner />
      </div>
    );
  }

  const items = data ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        title="No feedback requested"
        description="Request feedback to get started."
        action={
          <Link to="/feedback/request">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Request Feedback
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const style = STATUS_STYLE[item.status];
        const respondentName = item.isAnonymous
          ? "Anonymous"
          : `${item.respondent.firstName ?? "Unknown"} ${item.respondent.lastName ?? ""}`.trim();
        return (
          <Card key={item.id}>
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar
                  initials={initials(
                    item.subjectEmployee.firstName,
                    item.subjectEmployee.lastName,
                  )}
                  src={item.subjectEmployee.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-900">
                    About: {item.subjectEmployee.firstName}{" "}
                    {item.subjectEmployee.lastName ?? ""}
                  </p>
                  <p className="text-xs text-brand-500">
                    From {respondentName} · {formatDate(item.createdAt)}
                  </p>
                </div>
                <Badge variant={style.variant}>{style.label}</Badge>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </ul>
  );
}
