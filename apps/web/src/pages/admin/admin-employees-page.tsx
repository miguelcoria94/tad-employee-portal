import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  type CreateEmployeeInput,
  type Employee,
  fullName,
  initials,
} from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type Editing =
  | { kind: "create"; draft: CreateEmployeeInput }
  | { kind: "edit"; id: string; avatarUrl: string | null; draft: CreateEmployeeInput }
  | null;

const blankDraft: CreateEmployeeInput = {
  email: "",
  firstName: "",
  lastName: "",
  title: "",
  department: "",
  subDepartment: "",
  isActive: true,
};

export function AdminEmployeesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Editing>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading } = useQuery<{ employees: Employee[] }>({
    queryKey: ["employees", "all"],
    queryFn: () => api("/api/v1/employees?includeInactive=true"),
  });

  const employees = (data?.employees ?? []).filter((e) =>
    [e.firstName, e.lastName, e.email, e.title, e.department]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const create = useMutation({
    mutationFn: (input: CreateEmployeeInput) =>
      api("/api/v1/employees", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setEditing(null);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateEmployeeInput }) =>
      api(`/api/v1/employees/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setEditing(null);
    },
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/employees/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  async function uploadAvatar(file: File) {
    if (editing?.kind !== "edit") return;
    setUploading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/v1/employees/${editing.id}/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (res.ok) {
        const { employee } = await res.json();
        setEditing({ ...editing, avatarUrl: employee.avatarUrl });
        qc.invalidateQueries({ queryKey: ["employees"] });
      }
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (!editing) return;
    if (editing.kind === "create") create.mutate(editing.draft);
    else update.mutate({ id: editing.id, input: editing.draft });
  }

  const error = (create.error ?? update.error) as Error | undefined;
  const errorMessage =
    error instanceof ApiError ? error.message : error?.message;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search employees…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button
          onClick={() => setEditing({ kind: "create", draft: { ...blankDraft } })}
        >
          <Plus className="h-4 w-4" />
          New employee
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Spinner />
        </div>
      ) : (
        <Card>
          <ul className="divide-y divide-brand-100">
            {employees.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-brand-50/40"
              >
                <Avatar initials={initials(e)} src={e.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-900">
                    {fullName(e)}{" "}
                    {!e.isActive && (
                      <Badge variant="neutral" className="ml-2">
                        Inactive
                      </Badge>
                    )}
                  </p>
                  <p className="truncate text-xs text-brand-500">
                    {e.title} · {e.email}
                  </p>
                </div>
                <Badge variant="highlight">{e.department}</Badge>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setEditing({
                        kind: "edit",
                        id: e.id,
                        avatarUrl: e.avatarUrl,
                        draft: {
                          email: e.email,
                          firstName: e.firstName,
                          lastName: e.lastName,
                          title: e.title,
                          department: e.department,
                          subDepartment: e.subDepartment,
                          phone: e.phone,
                          bio: e.bio,
                          isActive: e.isActive,
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
                      if (confirm(`Delete ${fullName(e)}?`)) del.mutate(e.id);
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
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-brand-900">
                  {editing.kind === "create" ? "New employee" : "Edit employee"}
                </h3>
                <button
                  onClick={() => setEditing(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {editing.kind === "edit" && (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar
                      initials={initials({
                        firstName: editing.draft.firstName,
                        lastName: editing.draft.lastName,
                      } as Employee)}
                      src={editing.avatarUrl}
                      size="lg"
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-brand-100 bg-white text-brand-700 shadow-sm hover:bg-brand-50 disabled:opacity-60"
                      title="Upload photo"
                    >
                      {uploading ? (
                        <Spinner className="h-3.5 w-3.5" />
                      ) : (
                        <Camera className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) uploadAvatar(file);
                      }}
                    />
                  </div>
                  <div className="text-xs text-brand-500">
                    Click the camera icon to upload a profile photo.
                    <br />
                    PNG, JPEG, WebP, or GIF — max 2 MB.
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="First name">
                  <Input
                    value={editing.draft.firstName}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, firstName: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Last name">
                  <Input
                    value={editing.draft.lastName ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, lastName: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Email" className="sm:col-span-2">
                  <Input
                    type="email"
                    value={editing.draft.email}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, email: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Title" className="sm:col-span-2">
                  <Input
                    value={editing.draft.title}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, title: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Department">
                  <Input
                    value={editing.draft.department}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, department: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Sub-department">
                  <Input
                    value={editing.draft.subDepartment ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: {
                          ...editing.draft,
                          subDepartment: e.target.value,
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Phone" className="sm:col-span-2">
                  <Input
                    value={editing.draft.phone ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, phone: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Bio" className="sm:col-span-2">
                  <Textarea
                    rows={3}
                    value={editing.draft.bio ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, bio: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Active" className="sm:col-span-2">
                  <Select
                    value={String(editing.draft.isActive ?? true)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: {
                          ...editing.draft,
                          isActive: e.target.value === "true",
                        },
                      })
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </Field>
              </div>

              {errorMessage && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
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

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={"flex flex-col gap-1.5 " + (className ?? "")}>
      <span className="text-xs font-medium text-brand-700">{label}</span>
      {children}
    </label>
  );
}
