import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type {
  CompanyUpdate,
  CreateCompanyUpdateInput,
} from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { RichTextEditor } from "@/components/editor/rich-text-editor";

type Editing =
  | { kind: "create"; draft: CreateCompanyUpdateInput }
  | { kind: "edit"; id: string; draft: CreateCompanyUpdateInput }
  | null;

const blank: CreateCompanyUpdateInput = { title: "", body: "" };

function isoForInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminCompanyUpdatesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Editing>(null);

  const { data, isLoading } = useQuery<{ updates: CompanyUpdate[] }>({
    queryKey: ["company-updates"],
    queryFn: () => api("/api/v1/company-updates"),
  });

  const create = useMutation({
    mutationFn: (input: CreateCompanyUpdateInput) =>
      api("/api/v1/admin/company-updates", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-updates"] });
      setEditing(null);
    },
  });

  const update = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateCompanyUpdateInput;
    }) =>
      api(`/api/v1/admin/company-updates/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-updates"] });
      setEditing(null);
    },
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/admin/company-updates/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-updates"] }),
  });

  const error = (create.error ?? update.error) as Error | undefined;
  const errorMessage =
    error instanceof ApiError ? error.message : error?.message;

  function submit() {
    if (!editing) return;
    const payload: CreateCompanyUpdateInput = {
      title: editing.draft.title,
      body: editing.draft.body,
      ...(editing.draft.publishedAt
        ? { publishedAt: new Date(editing.draft.publishedAt).toISOString() }
        : {}),
    };
    if (editing.kind === "create") create.mutate(payload);
    else update.mutate({ id: editing.id, input: payload });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-brand-600">
          Announcements shown on the Company Updates page. Most recent first.
        </p>
        <Button
          onClick={() => setEditing({ kind: "create", draft: { ...blank } })}
        >
          <Plus className="h-4 w-4" />
          New update
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Spinner />
        </div>
      ) : (
        <Card>
          <ul className="divide-y divide-brand-100">
            {data?.updates.map((u) => (
              <li
                key={u.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-brand-50/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                    {new Date(u.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">
                    {u.title}
                  </p>
                  {u.body && (
                    <p className="mt-1 line-clamp-2 text-xs text-brand-500">
                      {u.body}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setEditing({
                        kind: "edit",
                        id: u.id,
                        draft: {
                          title: u.title,
                          body: u.body,
                          publishedAt: isoForInput(u.publishedAt),
                        },
                      })
                    }
                    className="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-100"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${u.title}"?`)) del.mutate(u.id);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
            {data?.updates.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-brand-500">
                No updates yet. Click "New update" to publish the first one.
              </li>
            )}
          </ul>
        </Card>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brand-950/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg">
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-brand-900">
                  {editing.kind === "create" ? "New update" : "Edit update"}
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
                <span className="text-xs font-medium text-brand-700">Body</span>
                <RichTextEditor
                  value={editing.draft.body}
                  onChange={(html) =>
                    setEditing({
                      ...editing,
                      draft: { ...editing.draft, body: html },
                    })
                  }
                  placeholder="What's new this week?"
                  minHeight="min-h-[220px]"
                />
              </label>
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
                      draft: {
                        ...editing.draft,
                        publishedAt: e.target.value,
                      },
                    })
                  }
                />
                <span className="text-[11px] text-brand-400">
                  Leave blank to publish now.
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
