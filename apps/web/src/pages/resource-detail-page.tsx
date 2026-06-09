import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { DepartmentResourceRow } from "@tadhealth/shared";
import { COMPANY_RESOURCE_SCOPE } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { RichTextRenderer } from "@/components/editor/rich-text-renderer";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery<{ resource: DepartmentResourceRow }>({
    queryKey: ["resource", id],
    enabled: !!id,
    queryFn: () => api(`/api/v1/resources/${id}`),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!data?.resource) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center text-brand-600">
        This resource isn't available.{" "}
        <Link to="/resources" className="font-semibold text-brand-900">
          Back to Resources
        </Link>
      </div>
    );
  }

  const r = data.resource;
  const isCompany = r.departmentName === COMPANY_RESOURCE_SCOPE;

  return (
    <div className="bg-brand-mesh">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to="/resources"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Resources
        </Link>

        <header className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
            {isCompany ? "Company Resource" : r.departmentName}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-900 md:text-4xl">
            {r.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {r.category && <Badge variant="highlight">{r.category}</Badge>}
            {r.documentDate && (
              <span className="text-sm text-brand-500">
                Updated {formatDate(r.documentDate)}
              </span>
            )}
          </div>
        </header>

        {r.content ? (
          <Card className="mt-8">
            <CardBody>
              <RichTextRenderer html={r.content} />
            </CardBody>
          </Card>
        ) : r.url ? (
          <Card className="mt-8">
            <CardBody>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:border-highlight-400 hover:text-highlight-700"
              >
                <ExternalLink className="h-4 w-4" />
                Open {r.linkLabel}
              </a>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
