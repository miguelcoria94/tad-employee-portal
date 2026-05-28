import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { Employee, UpdateMyProfileInput } from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fullName, initials } from "@tadhealth/shared";

type Draft = {
  location: string;
  phone: string;
  bio: string;
};

function draftFromEmployee(e: Employee | null | undefined): Draft {
  return {
    location: e?.location ?? "",
    phone: e?.phone ?? "",
    bio: e?.bio ?? "",
  };
}

export function MePage() {
  const { me, loading, refresh } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft>(draftFromEmployee(me?.employee));
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync local draft when /me data first lands or refreshes.
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
      // Refresh /me + the directory in case it's open in another tab.
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
    (draft.bio ?? "") !== (e.bio ?? "");

  function submit() {
    save.mutate({
      location: draft.location.trim() || null,
      phone: draft.phone.trim() || null,
      bio: draft.bio.trim() || null,
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
            <Avatar
              initials={initials(e).toUpperCase()}
              className="h-16 w-16 text-lg"
            />
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
      </div>
    </div>
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