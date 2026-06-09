import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  GraduationCap,
  MessageCircle,
  Star,
} from "lucide-react";
import type {
  Employee,
  UpdateMyProfileInput,
  EmergencyContactRow,
} from "@tadhealth/shared";
import { useRef } from "react";
import { api, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/auth-context";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fullName, initials } from "@tadhealth/shared";

type Draft = {
  location: string;
  phone: string;
  bio: string;
  birthday: string;
  startDate: string;
};

function draftFromEmployee(e: Employee | null | undefined): Draft {
  return {
    location: e?.location ?? "",
    phone: e?.phone ?? "",
    bio: e?.bio ?? "",
    birthday: e?.birthday ?? "",
    startDate: e?.startDate ?? "",
  };
}

const RELATIONSHIP_OPTIONS = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Friend",
  "Other",
] as const;

type ContactDraft = {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  isPrimary: boolean;
};

const emptyContactDraft: ContactDraft = {
  name: "",
  relationship: "Spouse",
  phone: "",
  email: "",
  isPrimary: false,
};

export function MePage() {
  const { me, loading, refresh } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft>(draftFromEmployee(me?.employee));
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me?.employee) setDraft(draftFromEmployee(me.employee));
  }, [me?.employee?.id, me?.employee?.updatedAt]);

  const save = useMutation({
    mutationFn: (input: UpdateMyProfileInput) =>
      api<{ employee: Employee; changedFields: string[] }>(
        "/api/v1/me/profile",
        { method: "PATCH", body: JSON.stringify(input) },
      ),
    onSuccess: () => {
      setSavedAt(Date.now());
      setError(null);
      qc.invalidateQueries({ queryKey: ["employees"] });
      refresh();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    },
  });

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!me?.employee) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center text-brand-600">
        Your account isn't linked to a directory entry yet. Ask Claire or Ben
        to add you to the employee list, then sign back in.
      </div>
    );
  }

  const e = me.employee;
  const dirty =
    (draft.location ?? "") !== (e.location ?? "") ||
    (draft.phone ?? "") !== (e.phone ?? "") ||
    (draft.bio ?? "") !== (e.bio ?? "") ||
    (draft.birthday ?? "") !== (e.birthday ?? "") ||
    (draft.startDate ?? "") !== (e.startDate ?? "");

  function submit() {
    save.mutate({
      location: draft.location.trim() || null,
      phone: draft.phone.trim() || null,
      bio: draft.bio.trim() || null,
      birthday: draft.birthday || null,
      startDate: draft.startDate || null,
    });
  }

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

        <header className="mt-8 flex flex-col gap-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-highlight-600">
            Your Profile
          </p>
          <div className="flex items-center gap-4">
            <AvatarUploader employee={e} onUpdated={refresh} />
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-brand-900">
                {fullName(e)}
              </h1>
              <p className="mt-0.5 text-sm text-brand-600">{e.title}</p>
            </div>
          </div>
        </header>

        <Card className="mt-8">
          <CardBody className="space-y-4">
            <h2 className="text-base font-semibold text-brand-900">
              At a glance
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">{e.email}</Field>
              <Field label="Title">{e.title}</Field>
              <Field label="Department">
                <Badge variant="highlight">{e.department}</Badge>
                {e.subDepartment && (
                  <Badge variant="neutral" className="ml-1">
                    {e.subDepartment}
                  </Badge>
                )}
              </Field>
              <Field label="Manager">
                {me.manager ? (
                  <span>
                    {me.manager.firstName}
                    {me.manager.lastName ? ` ${me.manager.lastName}` : ""}{" "}
                    <span className="text-brand-400">· {me.manager.title}</span>
                  </span>
                ) : (
                  <span className="text-brand-400">—</span>
                )}
              </Field>
            </dl>
            <p className="text-xs text-brand-400">
              Need to update your title, department, or manager? Message Claire
              or Ben — those fields are admin-managed.
            </p>
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-brand-900">
                Editable info
              </h2>
              {savedAt && !dirty && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved
                </span>
              )}
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">
                Location
              </span>
              <Input
                placeholder="e.g. Newport Beach, CA"
                value={draft.location}
                onChange={(e) =>
                  setDraft({ ...draft, location: e.target.value })
                }
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">Phone</span>
              <Input
                placeholder="(optional)"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-brand-700">
                  Birthday
                </span>
                <Input
                  type="date"
                  value={draft.birthday}
                  onChange={(e) =>
                    setDraft({ ...draft, birthday: e.target.value })
                  }
                />
                <span className="text-[11px] text-brand-400">
                  Year is ignored when displayed — only month + day are shown.
                </span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-brand-700">
                  Start date at TadHealth
                </span>
                <Input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) =>
                    setDraft({ ...draft, startDate: e.target.value })
                  }
                />
                <span className="text-[11px] text-brand-400">
                  Powers your work-iversary on the home page.
                </span>
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-brand-700">Bio</span>
              <Textarea
                rows={4}
                placeholder="A line or two about you, your work, or what you like to do outside of TadHealth."
                value={draft.bio}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              />
            </label>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-brand-400">
                Heads up: admins are notified when you update your profile so
                the directory stays trustworthy.
              </p>
              <Button
                onClick={submit}
                disabled={!dirty || save.isPending}
              >
                {save.isPending && (
                  <Spinner className="border-white/40 border-t-white" />
                )}
                Save changes
              </Button>
            </div>
          </CardBody>
        </Card>

        <EmergencyContactsSection />

        <Card className="mt-6">
          <CardBody className="space-y-3">
            <h2 className="text-base font-semibold text-brand-900">
              Quick links
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <QuickLinkCard
                to="/feedback"
                icon={<MessageSquare className="h-5 w-5 text-highlight-600" />}
                title="My Feedback"
                subtitle="View & give feedback"
              />
              <QuickLinkCard
                to="/training"
                icon={<GraduationCap className="h-5 w-5 text-highlight-600" />}
                title="My Training"
                subtitle="Courses & progress"
              />
              <QuickLinkCard
                to="/dms"
                icon={<MessageCircle className="h-5 w-5 text-highlight-600" />}
                title="Messages"
                subtitle="Direct messages"
              />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function QuickLinkCard({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-3 shadow-sm transition-all hover:border-highlight-200 hover:shadow-md"
    >
      {icon}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-900">{title}</p>
        <p className="text-xs text-brand-500">{subtitle}</p>
      </div>
    </Link>
  );
}

function EmergencyContactsSection() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contactDraft, setContactDraft] = useState<ContactDraft>(emptyContactDraft);
  const [contactError, setContactError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["emergency-contacts"],
    queryFn: () =>
      api<{ contacts: EmergencyContactRow[] }>("/api/v1/me/emergency-contacts"),
  });

  const contacts = data?.contacts ?? [];

  const addMutation = useMutation({
    mutationFn: (input: ContactDraft) =>
      api<{ contact: EmergencyContactRow }>("/api/v1/me/emergency-contacts", {
        method: "POST",
        body: JSON.stringify({
          name: input.name,
          relationship: input.relationship,
          phone: input.phone,
          email: input.email || null,
          isPrimary: input.isPrimary,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emergency-contacts"] });
      resetForm();
    },
    onError: (err) => {
      setContactError(
        err instanceof ApiError ? err.message : (err as Error).message,
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ContactDraft }) =>
      api<{ contact: EmergencyContactRow }>(
        `/api/v1/me/emergency-contacts/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: input.name,
            relationship: input.relationship,
            phone: input.phone,
            email: input.email || null,
            isPrimary: input.isPrimary,
          }),
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emergency-contacts"] });
      resetForm();
    },
    onError: (err) => {
      setContactError(
        err instanceof ApiError ? err.message : (err as Error).message,
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/me/emergency-contacts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emergency-contacts"] });
    },
  });

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setContactDraft(emptyContactDraft);
    setContactError(null);
  }

  function startEdit(c: EmergencyContactRow) {
    setEditingId(c.id);
    setContactDraft({
      name: c.name,
      relationship: c.relationship,
      phone: c.phone,
      email: c.email ?? "",
      isPrimary: c.isPrimary,
    });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!contactDraft.name.trim() || !contactDraft.phone.trim()) {
      setContactError("Name and phone are required.");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, input: contactDraft });
    } else {
      addMutation.mutate(contactDraft);
    }
  }

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <Card className="mt-6">
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-brand-900">
            Emergency Contacts
          </h2>
          {!showForm && (
            <Button
              onClick={() => {
                setEditingId(null);
                setContactDraft(emptyContactDraft);
                setContactError(null);
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add contact
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}

        {!isLoading && contacts.length === 0 && !showForm && (
          <p className="text-sm text-brand-500">
            No emergency contacts added yet. Add one so we can reach someone if
            needed.
          </p>
        )}

        {contacts.length > 0 && (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between rounded-lg border border-brand-100 bg-brand-50/50 p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-900">
                      {c.name}
                    </span>
                    {c.isPrimary && (
                      <Badge variant="highlight">
                        <Star className="mr-0.5 h-3 w-3" />
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-brand-600">
                    {c.relationship}
                  </p>
                  <p className="mt-1 text-xs text-brand-600">{c.phone}</p>
                  {c.email && (
                    <p className="text-xs text-brand-500">{c.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(c)}
                    className="rounded-md p-1.5 text-brand-500 hover:bg-brand-100 hover:text-brand-800"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(c.id)}
                    disabled={deleteMutation.isPending}
                    className="rounded-md p-1.5 text-brand-500 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="rounded-xl border border-highlight-200 bg-highlight-50/30 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-brand-900">
              {editingId ? "Edit contact" : "New emergency contact"}
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-brand-700">Name</span>
                <Input
                  placeholder="Full name"
                  value={contactDraft.name}
                  onChange={(e) =>
                    setContactDraft({ ...contactDraft, name: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-brand-700">
                  Relationship
                </span>
                <Select
                  value={contactDraft.relationship}
                  onChange={(e) =>
                    setContactDraft({
                      ...contactDraft,
                      relationship: e.target.value,
                    })
                  }
                >
                  {RELATIONSHIP_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-brand-700">Phone</span>
                <Input
                  placeholder="(555) 123-4567"
                  value={contactDraft.phone}
                  onChange={(e) =>
                    setContactDraft({ ...contactDraft, phone: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-brand-700">
                  Email (optional)
                </span>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={contactDraft.email}
                  onChange={(e) =>
                    setContactDraft({ ...contactDraft, email: e.target.value })
                  }
                />
              </label>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={contactDraft.isPrimary}
                onChange={(e) =>
                  setContactDraft({
                    ...contactDraft,
                    isPrimary: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-brand-300 text-highlight-600 focus:ring-highlight-500"
              />
              <span className="text-xs font-medium text-brand-700">
                Primary contact
              </span>
            </label>

            {contactError && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {contactError}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && (
                  <Spinner className="border-white/40 border-t-white" />
                )}
                {editingId ? "Update" : "Save"}
              </Button>
              <Button
                onClick={resetForm}
                className="bg-brand-100 text-brand-700 hover:bg-brand-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-brand-900">{children}</dd>
    </div>
  );
}

function AvatarUploader({
  employee,
  onUpdated,
}: {
  employee: Employee;
  onUpdated: () => void;
}) {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    setUploading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Not signed in");
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/v1/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Upload failed (${res.status})`);
      }
      onUpdated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative">
      <Avatar
        initials={initials(employee).toUpperCase()}
        src={employee.avatarUrl}
        alt={fullName(employee)}
        className="h-16 w-16 text-lg"
      />
      <button
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-brand-100 bg-white text-brand-700 shadow-sm hover:bg-brand-50 disabled:opacity-60"
        title="Upload photo"
      >
        {uploading ? <Spinner /> : <Camera className="h-3.5 w-3.5" />}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
      {err && (
        <p className="absolute left-20 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-red-600">
          {err}
        </p>
      )}
    </div>
  );
}
