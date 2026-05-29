import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateDepartmentInput,
  DepartmentManager,
  DepartmentRow,
} from "@tadhealth/shared";
import {
  FolderOpen,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { slugifyDepartment } from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type AssignableEmployee = {
  id: string;
  firstName: string;
  lastName: string | null;
  title: string;
  email: string;
  department: string;
  avatarUrl: string | null;
};

type Editing =
  | { kind: "create"; draft: CreateDepartmentInput }
  | { kind: "edit"; id: string; draft: CreateDepartmentInput }
  | null;

const blank: CreateDepartmentInput = {
  name: "",
  description: "",
  isPrivate: false,
};

export function AdminDepartmentsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Editing>(null);
  const [managersFor, setManagersFor] = useState<DepartmentRow | null>(null);

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
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-brand-900">
                      {d.name}
                    </p>
                    {d.isPrivate && (
                      <Badge variant="accent">
                        <Lock className="h-3 w-3" /> Private
                      </Badge>
                    )}
                  </div>
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
                    onClick={() => setManagersFor(d)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-100"
                    title="Managers"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      setEditing({
                        kind: "edit",
                        id: d.id,
                        draft: {
                          name: d.name,
                          description: d.description,
                          isPrivate: d.isPrivate,
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

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-100 bg-white px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={editing.draft.isPrivate ?? false}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      draft: {
                        ...editing.draft,
                        isPrivate: e.target.checked,
                      },
                    })
                  }
                  className="mt-1 h-4 w-4 accent-highlight-500"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-brand-900">
                    Private — members only
                  </span>
                  <span className="block text-xs text-brand-500">
                    Hide this department from employees who aren't a member.
                    Admins always see it.
                  </span>
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

      {managersFor && (
        <ManagersModal
          department={managersFor}
          onClose={() => setManagersFor(null)}
        />
      )}
    </div>
  );
}

function ManagersModal({
  department,
  onClose,
}: {
  department: DepartmentRow;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");

  const managersQ = useQuery<{ managers: DepartmentManager[] }>({
    queryKey: ["department-managers", department.id],
    queryFn: () => api(`/api/v1/departments/${department.id}/managers`),
  });

  const employeesQ = useQuery<{ employees: AssignableEmployee[] }>({
    queryKey: ["assignable-employees"],
    queryFn: () => api("/api/v1/admin/assignable-employees"),
  });

  const add = useMutation({
    mutationFn: (employeeId: string) =>
      api(`/api/v1/admin/departments/${department.id}/managers`, {
        method: "POST",
        body: JSON.stringify({ employeeId }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["department-managers", department.id] }),
  });

  const remove = useMutation({
    mutationFn: (userId: string) =>
      api(
        `/api/v1/admin/departments/${department.id}/managers/${userId}`,
        { method: "DELETE" },
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["department-managers", department.id] }),
  });

  const managers = managersQ.data?.managers ?? [];

  const filtered = useMemo(() => {
    const list = employeesQ.data?.employees ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((e) => {
      const name = `${e.firstName} ${e.lastName ?? ""}`.toLowerCase();
      if (q && !name.includes(q) && !e.email.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [employeesQ.data, query]);

  const error = (add.error ?? remove.error) as Error | undefined;
  const errorMessage =
    error instanceof ApiError ? error.message : error?.message;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-950/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg">
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-brand-900">
                Managers · {department.name}
              </h3>
              <p className="text-xs text-brand-500">
                Managers can add/edit/delete this department's resources.
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-500">
              Current managers
            </p>
            {managersQ.isLoading ? (
              <div className="grid place-items-center py-4">
                <Spinner />
              </div>
            ) : managers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-3 py-3 text-sm text-brand-500">
                No managers yet.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {managers.map((m) => (
                  <li
                    key={m.userId}
                    className="flex items-center justify-between rounded-lg border border-brand-100 bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-900">
                        {m.lastName ? `${m.firstName} ${m.lastName}` : m.firstName}
                      </p>
                      <p className="truncate text-xs text-brand-500">{m.email}</p>
                    </div>
                    <button
                      onClick={() => remove.mutate(m.userId)}
                      className="grid h-7 w-7 place-items-center rounded-md text-red-600 hover:bg-red-50"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-500">
              Add a manager
            </p>
            <Input
              placeholder="Search by name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-brand-100">
              {employeesQ.isLoading ? (
                <div className="grid place-items-center py-4">
                  <Spinner />
                </div>
              ) : filtered.length === 0 ? (
                <p className="px-3 py-3 text-sm text-brand-500">
                  No matches. Employees only show up after they've signed in
                  for the first time.
                </p>
              ) : (
                <ul>
                  {filtered.slice(0, 50).map((e) => {
                    const alreadyManager = managers.find(
                      (m) => m.employeeId === e.id,
                    );
                    return (
                      <li
                        key={e.id}
                        className="flex items-center justify-between border-b border-brand-100 px-3 py-2 last:border-b-0 hover:bg-brand-50/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-brand-900">
                            {e.lastName ? `${e.firstName} ${e.lastName}` : e.firstName}
                          </p>
                          <p className="truncate text-xs text-brand-500">
                            {e.title} · {e.department}
                          </p>
                        </div>
                        <button
                          onClick={() => add.mutate(e.id)}
                          disabled={!!alreadyManager || add.isPending}
                          className="shrink-0 rounded-md border border-brand-200 px-2 py-1 text-xs font-semibold text-brand-700 hover:border-highlight-400 hover:text-highlight-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {alreadyManager ? "Added" : "Add"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
