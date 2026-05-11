import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateDepartmentInput,
  DepartmentRow,
} from "@tadhealth/shared";
import { FolderOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { slugifyDepartment } from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type Editing =
  | { kind: "create"; draft: CreateDepartmentInput }
  | { kind: "edit"; id: string; draft: CreateDepartmentInput }
  | null;

const blank: CreateDepartmentInput = { name: "", description: "" };

export function AdminDepartmentsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Editing>(null);

  const { data, isLoading } = useQuery<{ departments: DepartmentRow[] }>({
    queryKey: ["departments"],
    queryFn: () => api("/api/v1/departments"),
  });

  const create = useMutation({
    mutationFn: (input: CreateDepartmentInput) =>
      api("/api/v1/admin/departments", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      setEditing(null);
    },
  });

  const update = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateDepartmentInput;
    }) =>
      api(`/api/v1/admin/departments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      setEditing(null);
    },
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/admin/departments/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });

  const error = (create.error ?? update.error) as Error | undefined;
  const errorMessage =
    error instanceof ApiError ? error.message : error?.message;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-brand-600">
          The org chart shown on the home page. Each department needs a name
          and a short description.
        </p>
        <Button
          onClick={() => setEditing({ kind: "create", draft: { ...blank } })}
        >
          <Plus className="h-4 w-4" />
          New department
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Spinner />
        </div>
      ) : (
        <Card>
          <ul className="divide-y divide-brand-100">
            {data?.departments.map((d) => (
              <li
                key={d.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-brand-50/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-900">
                    {d.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-brand-500">
                    {d.description || "—"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Link
                    to={`/admin/departments/${slugifyDepartment(d.name)}/resources`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-100"
                    title="Manage resources"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() =>
                      setEditing({
                        kind: "edit",
                        id: d.id,
                        draft: { name: d.name, description: d.description },
                      })
                    }
                    className="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-100"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete department "${d.name}"?`))
                        del.mutate(d.id);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brand-950/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-brand-900">
                  {editing.kind === "create"
                    ? "New department"
                    : "Edit department"}
                </h3>
                <button
                  onClick={() => setEditing(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-brand-700">Name</span>
                <Input
                  value={editing.draft.name}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      draft: { ...editing.draft, name: e.target.value },
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-brand-700">
                  Description
                </span>
                <Textarea
                  rows={3}
                  value={editing.draft.description}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      draft: { ...editing.draft, description: e.target.value },
                    })
                  }
                />
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
                  onClick={() =>
                    editing.kind === "create"
                      ? create.mutate(editing.draft)
                      : update.mutate({
                          id: editing.id,
                          input: editing.draft,
                        })
                  }
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
