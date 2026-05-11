import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import type { CompanyUpdate } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { RichTextRenderer } from "@/components/editor/rich-text-renderer";

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function CompanyUpdateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery<{ update: CompanyUpdate }>({
    queryKey: ["company-update", id],
    enabled: !!id,
    queryFn: () => api(`/api/v1/company-updates/${id}`),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center text-brand-600">
        This update isn't available.{" "}
        <Link to="/company-updates" className="font-semibold text-brand-900">
          Back to Updates & Events
        </Link>
      </div>
    );
  }

  const u = data.update;

  return (
    <div className="bg-brand-mesh">
      <article className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to="/company-updates"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Updates & Events
        </Link>

        <header className="mt-8 flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
            Company Update
          </p>
          <time
            dateTime={u.publishedAt}
            className="text-xs font-semibold uppercase tracking-wider text-brand-500"
          >
            {formatLongDate(u.publishedAt)}
          </time>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-900 md:text-4xl">
            {u.title}
          </h1>
        </header>

        {u.body ? (
          <div className="mt-8 rounded-2xl border border-brand-100 bg-white p-8 shadow-soft">
            <RichTextRenderer html={u.body} />
          </div>
        ) : (
          <p className="mt-8 text-sm text-brand-500">
            (This update has no body.)
          </p>
        )}
      </article>
    </div>
  );
}
