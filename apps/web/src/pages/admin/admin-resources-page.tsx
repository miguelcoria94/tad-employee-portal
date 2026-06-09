import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Pencil, Plus, Trash2, Wrench, X } from "lucide-react";
import {
  COMPANY_RESOURCE_SCOPE,
  type CreateDepartmentResourceInput,
  type DepartmentResourceRow,
  type DepartmentRow,
  type ResourceKind,
} from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { RichTextEditor } from "@/components/editor/rich-text-editor";

type ContentMode = "link" | "document";

type Draft = {
  title: string;
  contentMode: ContentMode;
  url: string;
  linkLabel: string;
  content: string;
  category: string;
  documentDate: string;
};

type Editing =
  | { kind: "create"; resourceKind: ResourceKind; draft: Draft }
  | { kind: "edit"; resourceKind: ResourceKind; id: string; draft: Draft }
  | null;

const blank: Draft = {
  title: "",
  contentMode: "link",
  url: "",
  linkLabel: "Link",
  content: "",
  category: "",
  documentDate: "",
};

function rowToDraft(r: DepartmentResourceRow): Draft {
  return {
    title: r.title,
    contentMode: r.content && r.content.trim() ? "document" : "link",
    url: r.url ?? "",
    linkLabel: r.linkLabel,
    content: r.content ?? "",
    category: r.category ?? "",
    documentDate: r.documentDate ?? "",
  };
}

function draftToPayload(
  departmentName: string,
  resourceKind: ResourceKind,
  d: Draft,
): CreateDepartmentResourceInput {
  const isRich = resourceKind === "document" && d.contentMode === "document";
  return {
    departmentName,
    kind: resourceKind,
    title: d.title.trim(),
    url: !isRich && d.url.trim() ? d.url.trim() : null,
    content: isRich && d.content.trim() ? d.content : null,
    linkLabel: d.linkLabel.trim() || "Link",
    category: d.category.trim() ? d.category.trim() : null,
    documentDate:
      resourceKind === "document" && d.documentDate ? d.documentDate : null,
  };
}

export function AdminResourcesPage() {
  const qc = useQueryClient();
  const [scope, setScope] = useState<string>(COMPANY_RESOURCE_SCOPE);
  const [editing, setEditing] = useState<Editing>(null);

  const departmentsQ = useQuery<{ departments: DepartmentRow[] }>({
    queryKey: ["departments"],
    queryFn: () => api("/api/v1/departments"),
  });

  const resourcesQ = useQuery<{ resources: DepartmentResourceRow[] }>({
    queryKey: ["department-resources", scope],
    queryFn: () =>
      api(`/api/v1/department-resources?department=${encodeURIComponent(scope)}`),
  });

  const create = useMutation({
    mutationFn: (input: CreateDepartmentResourceInput) =>
      api("/api/v1/admin/department-resources", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["department-resources"] });
      qc.invalidateQueries({ queryKey: ["company-resources"] });
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
      qc.invalidateQueries({ queryKey: ["company-resources"] });
      setEditing(null);
    },
  });
  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/admin/department-resources/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["department-resources"] });
      qc.invalidateQueries({ queryKey: ["company-resources"] });
    },
  });

  const resources = resourcesQ.data?.resources ?? [];
  const tools = resources.filter((r) => r.kind === "tool");
  const docs = resources.filter((r) => r.kind === "document");

  const scopeOptions = useMemo(() => {
    const names = (departmentsQ.data?.departments ?? []).map((d) => d.name);
    return [COMPANY_RESOURCE_SCOPE, ...names];
  }, [departmentsQ.data]);

  const error = (create.error ?? update.error) as Error | undefined;
  const errorMessage =
    error instanceof ApiError ? error.message : error?.message;

  function submit() {
    if (!editing) return;
    if (!editing.draft.title.trim()) return;
    const payload = draftToPayload(scope, editing.resourceKind, editing.draft);
    if (editing.kind === "create") create.mutate(payload);
    else update.mutate({ id: editing.id, input: payload });
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-700">
          Resources
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">
          Resources &amp; Handbook
        </h1>
        <p className="mt-1 text-sm text-brand-600">
          Author quick-link tools and rich documents. Choose{" "}
          <strong>Company (all employees)</strong> for the handbook/benefits, or
          a department to scope resources to that team.
        </p>
      </header>

      <label className="flex max-w-sm flex-col gap-1.5">
        <span className="text-xs font-medium text-brand-700">Scope</span>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 shadow-sm focus:border-highlight-400 focus:outline-none focus:ring-2 focus:ring-highlight-200"
        >
          <option value={COMPANY_RESOURCE_SCOPE}>Company (all employees)</option>
          {scopeOptions
            .filter((n) => n !== COMPANY_RESOURCE_SCOPE)
            .map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
        </select>
      </label>

      <ResourceSection
        title="Tools"
        hint="Quick links the team uses every day."
        icon={Wrench}
        resources={tools}
        onCreate={() =>
          setEditing({
            kind: "create",
            resourceKind: "tool",
            draft: { ...blank },
          })
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
        title="Documents"
        hint="Link out to a file, or write a full rich-text document inline."
        icon={FileText}
        resources={docs}
        onCreate={() =>
          setEditing({
            kind: "create",
            resourceKind: "document",
            draft: { ...blank, contentMode: "document" },
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
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-brand-950/40 p-4 backdrop-blur-sm">
          <Card className="my-8 w-full max-w-2xl">
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-brand-900">
                  {editing.kind === "create" ? "New " : "Edit "}
                  {editing.resourceKind === "tool" ? "tool" : "document"}
                  <span className="ml-2 text-xs font-normal text-brand-500">
                    · {scope === COMPANY_RESOURCE_SCOPE ? "Company" : scope}
                  </span>
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

              {editing.resourceKind === "document" && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-brand-700">
                    Content type
                  </span>
                  <div className="inline-flex rounded-lg border border-brand-200 bg-brand-50/60 p-0.5">
                    {(["link", "document"] as ContentMode[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            draft: { ...editing.draft, contentMode: m },
                          })
                        }
                        className={
                          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                          (editing.draft.contentMode === m
                            ? "bg-brand-900 text-white"
                            : "text-brand-600 hover:text-brand-900")
                        }
                      >
                        {m === "link" ? "Link" : "Document"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {editing.resourceKind === "tool" ||
              editing.draft.contentMode === "link" ? (
                <>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-brand-700">
                      URL
                    </span>
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
                  </label>
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
                </>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-brand-700">
                    Document content
                  </span>
                  <RichTextEditor
                    value={editing.draft.content}
                    onChange={(html) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, content: html },
                      })
                    }
                    placeholder="Write the document…"
                    minHeight="min-h-[260px]"
                  />
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-brand-700">
                    Category
                  </span>
                  <Input
                    placeholder='e.g. "Benefits", "Handbook", "Policy"'
                    value={editing.draft.category}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, category: e.target.value },
                      })
                    }
                  />
                </label>
                {editing.resourceKind === "document" && (
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
            resources.map((r) => {
              const hasContent = !!(r.content && r.content.trim());
              return (
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
                      {hasContent ? (
                        <span className="font-medium text-highlight-700">
                          Rich document
                        </span>
                      ) : (
                        (r.url ?? <em className="text-brand-400">No link</em>)
                      )}
                    </p>
                  </div>
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
              );
            })
          )}
        </ul>
      </Card>
    </section>
  );
}
