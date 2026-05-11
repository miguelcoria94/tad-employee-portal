import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import {
  type CreateDepartmentResourceInput,
  type DepartmentResourceRow,
  type DepartmentRow,
  type ResourceKind,
  slugifyDepartment,
} from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type Draft = {
  title: string;
  url: string;
  linkLabel: string;
  category: string;
  documentDate: string;
};

type Editing =
  | { kind: "create"; resourceKind: ResourceKind; draft: Draft }
  | {
      kind: "edit";
      resourceKind: ResourceKind;
      id: string;
      draft: Draft;
    }
  | null;

const blank: Draft = {
  title: "",
  url: "",
  linkLabel: "Link",
  category: "",
  documentDate: "",
};

function rowToDraft(r: DepartmentResourceRow): Draft {
  return {
    title: r.title,
    url: r.url ?? "",
    linkLabel: r.linkLabel,
    category: r.category ?? "",
    documentDate: r.documentDate ?? "",
  };
}

function draftToPayload(
  departmentName: string,
  resourceKind: ResourceKind,
  d: Draft,
): CreateDepartmentResourceInput {
  return {
    departmentName,
    kind: resourceKind,
    title: d.title.trim(),
    url: d.url.trim() ? d.url.trim() : null,
    linkLabel: d.linkLabel.trim() || "Link",
    category: resourceKind === "tool" && d.category.trim() ? d.category.trim() : null,
    documentDate:
      resourceKind === "document" && d.documentDate
        ? d.documentDate
        : null,
  };
}

export function AdminDepartmentResourcesPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Editing>(null);

  const departmentsQ = useQuery<{ departments: DepartmentRow[] }>({
    queryKey: ["departments"],
    queryFn: () => api("/api/v1/departments"),
  });
  const department = departmentsQ.data?.departments.find(
    (d) => slugifyDepartment(d.name) === slug,
  );

  const resourcesQ = useQuery<{ resources: DepartmentResourceRow[] }>({
    queryKey: ["department-resources", department?.name],
    enabled: !!department,
    queryFn: () =>
      api(
        `/api/v1/department-resources?department=${encodeURIComponent(department!.name)}`,
      ),
  });

  const create = useMutation({
    mutationFn: (input: CreateDepartmentResourceInput) =>
      api("/api/v1/admin/department-resources", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["department-resources"] });
      setEditing(null);
    },
  });
  const update = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateDepartmentResourceInput;
    }) =>
      api(`/api/v1/admin/department-resources/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["department-resources"] });
      setEditing(null);
    },
  });
  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/admin/department-resources/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["department-resources"] }),
  });

  if (departmentsQ.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Spinner />
      </div>
    );
  }
  if (!department) {
    return <Navigate to="/admin/departments" replace />;
  }

  const resources = resourcesQ.data?.resources ?? [];
  const tools = resources.filter((r) => r.kind === "tool");
  const docs = resources.filter((r) => r.kind === "document");

  const error = (create.error ?? update.error) as Error | undefined;
  const errorMessage =
    error instanceof ApiError ? error.message : error?.message;

  function submit() {
    if (!editing || !department) return;
    if (!editing.draft.title.trim()) return;
    const payload = draftToPayload(
      department.name,
      editing.resourceKind,
      editing.draft,
    );
    if (editing.kind === "create") create.mutate(payload);
    else update.mutate({ id: editing.id, input: payload });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/admin/departments"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          All departments
        </Link>
        <Link
          to={`/departments/${slug}`}
          className="text-sm font-semibold text-brand-700 hover:text-brand-900"
        >
          View public page →
        </Link>
      </div>

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-700">
          Resources
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">
          {department.name}
        </h1>
        <p className="mt-1 text-sm text-brand-600">
          Tools and key documents shown on the public department page.
        </p>
      </header>

      <ResourceSection
        title="Department Tools"
        hint="Quick links the team uses every day."
        icon={Wrench}
        resources={tools}
        onCreate={() =>
          setEditing({ kind: "create", resourceKind: "tool", draft: { ...blank } })
        }
        onEdit={(r) =>
          setEditing({
            kind: "edit",
            resourceKind: "tool",
            id: r.id,
            draft: rowToDraft(r),
          })
        }
        onDelete={(r) => {
          if (confirm(`Delete "${r.title}"?`)) del.mutate(r.id);
        }}
      />

      <ResourceSection
        title="Key Documents"
        hint="Memos, playbooks, weekly emails, and reference docs."
        icon={FileText}
        resources={docs}
        onCreate={() =>
          setEditing({
            kind: "create",
            resourceKind: "document",
            draft: { ...blank },
          })
        }
        onEdit={(r) =>
          setEditing({
            kind: "edit",
            resourceKind: "document",
            id: r.id,
            draft: rowToDraft(r),
          })
        }
        onDelete={(r) => {
          if (confirm(`Delete "${r.title}"?`)) del.mutate(r.id);
        }}
      />

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brand-950/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg">
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-brand-900">
                  {editing.kind === "create" ? "New " : "Edit "}
                  {editing.resourceKind === "tool" ? "tool" : "document"}
                </h3>
                <button
                  onClick={() => setEditing(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-brand-700">Title</span>
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

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-brand-700">URL</span>
                <Input
                  type="url"
                  placeholder="https://…"
                  value={editing.draft.url}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      draft: { ...editing.draft, url: e.target.value },
                    })
                  }
                />
                <span className="text-[11px] text-brand-400">
                  Leave blank if the document doesn't have a link yet.
                </span>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-brand-700">
                    Link label
                  </span>
                  <Input
                    placeholder='e.g. "Link", "PDF", "Slack"'
                    value={editing.draft.linkLabel}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: {
                          ...editing.draft,
                          linkLabel: e.target.value,
                        },
                      })
                    }
                  />
                </label>
                {editing.resourceKind === "tool" ? (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-brand-700">
                      Category
                    </span>
                    <Input
                      placeholder='e.g. "Other", "Productivity"'
                      value={editing.draft.category}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          draft: {
                            ...editing.draft,
                            category: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                ) : (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-brand-700">
                      Document date
                    </span>
                    <Input
                      type="date"
                      value={editing.draft.documentDate}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          draft: {
                            ...editing.draft,
                            documentDate: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                )}
              </div>

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
                  disabled={
                    create.isPending ||
                    update.isPending ||
                    !editing.draft.title.trim()
                  }
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

function ResourceSection({
  title,
  hint,
  icon: Icon,
  resources,
  onCreate,
  onEdit,
  onDelete,
}: {
  title: string;
  hint: string;
  icon: typeof Wrench;
  resources: DepartmentResourceRow[];
  onCreate: () => void;
  onEdit: (r: DepartmentResourceRow) => void;
  onDelete: (r: DepartmentResourceRow) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-brand-900">{title}</h2>
          <p className="text-xs text-brand-500">{hint}</p>
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
      <Card>
        <ul className="divide-y divide-brand-100">
          {resources.length === 0 ? (
            <li className="px-5 py-6 text-center text-sm text-brand-500">
              Nothing here yet.
            </li>
          ) : (
            resources.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-brand-50/40"
              >
                <Icon className="h-4 w-4 shrink-0 text-brand-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-900">
                    {r.title}
                  </p>
                  <p className="truncate text-xs text-brand-500">
                    {r.url ?? <em className="text-brand-400">No link</em>}
                  </p>
                </div>
                {r.documentDate && (
                  <span className="hidden text-xs text-brand-500 sm:inline">
                    {r.documentDate}
                  </span>
                )}
                {r.category && (
                  <span className="hidden rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 sm:inline">
                    {r.category}
                  </span>
                )}
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(r)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-100"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(r)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </section>
  );
}
