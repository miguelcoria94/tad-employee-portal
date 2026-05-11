import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Pencil, Plus, Trash2 } from "lucide-react";
import type { SurveyRow } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

type Row = SurveyRow & { hasResponded: boolean; responseCount: number };

export function AdminSurveysPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ surveys: Row[] }>({
    queryKey: ["surveys"],
    queryFn: () => api("/api/v1/surveys"),
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/admin/surveys/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["surveys"] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-brand-600">
          Surveys shown to all signed-in employees. Toggle anonymity and
          results visibility per survey.
        </p>
        <Link to="/admin/surveys/new">
          <Button>
            <Plus className="h-4 w-4" />
            New survey
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Spinner />
        </div>
      ) : (
        <Card>
          <ul className="divide-y divide-brand-100">
            {data?.surveys.map((s) => (
              <li
                key={s.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-brand-50/40"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/admin/surveys/${s.id}`}
                    className="text-sm font-semibold text-brand-900 hover:text-brand-700"
                  >
                    {s.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">
                      {s.responseCount} response{s.responseCount === 1 ? "" : "s"}
                    </Badge>
                    {s.isAnonymous && <Badge variant="neutral">Anonymous</Badge>}
                    {s.showResultsToAll && (
                      <Badge variant="highlight">Public results</Badge>
                    )}
                    {!s.isPublished && (
                      <Badge variant="neutral">Hidden</Badge>
                    )}
                    {s.targetDepartments && s.targetDepartments.length > 0 && (
                      <Badge variant="accent">
                        {s.targetDepartments.length === 1
                          ? s.targetDepartments[0]
                          : `${s.targetDepartments.length} departments`}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Link
                    to={`/surveys/${s.id}/results`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-100"
                    title="Results"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Link>
                  <Link
                    to={`/admin/surveys/${s.id}`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-100"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${s.title}"? Responses will be deleted too.`))
                        del.mutate(s.id);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
            {data?.surveys.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-brand-500">
                No surveys yet. Click "New survey" to create one.
              </li>
            )}
          </ul>
        </Card>
      )}
    </div>
  );
}
