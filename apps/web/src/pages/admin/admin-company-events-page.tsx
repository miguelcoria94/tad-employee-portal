import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type {
  CompanyEvent,
  CreateCompanyEventInput,
} from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { RichTextEditor } from "@/components/editor/rich-text-editor";

type Draft = {
  title: string;
  description: string;
  location: string;
  url: string;
  startsAt: string;
  endsAt: string;
};

type Editing =
  | { kind: "create"; draft: Draft }
  | { kind: "edit"; id: string; draft: Draft }
  | null;

const blank: Draft = {
  title: "",
  description: "",
  location: "",
  url: "",
  startsAt: "",
  endsAt: "",
};

function isoForInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function draftToPayload(d: Draft): CreateCompanyEventInput {
  return {
    title: d.title,
    description: d.description,
    location: d.location || null,
    url: d.url || null,
    startsAt: new Date(d.startsAt).toISOString(),
    endsAt: d.endsAt ? new Date(d.endsAt).toISOString() : null,
  };
}

export function AdminCompanyEventsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Editing>(null);

  const { data, isLoading } = useQuery<{ events: CompanyEvent[] }>({
    queryKey: ["company-events", "all"],
    queryFn: () => api("/api/v1/company-events"),
  });

  const create = useMutation({
    mutationFn: (input: CreateCompanyEventInput) =>
      api("/api/v1/admin/company-events", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-events"] });
      setEditing(null);
    },
  });

  const update = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateCompanyEventInput;
    }) =>
      api(`/api/v1/admin/company-events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-events"] });
      setEditing(null);
    },
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/admin/company-events/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-events"] }),
  });

  const error = (create.error ?? update.error) as Error | undefined;
  const errorMessage =
    error instanceof ApiError ? error.message : error?.message;

  function submit() {
    if (!editing) return;
    if (!editing.draft.title || !editing.draft.startsAt) return;
    const payload = draftToPayload(editing.draft);
    if (editing.kind === "create") create.mutate(payload);
    else update.mutate({ id: editing.id, input: payload });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-brand-600">
          Events shown under "Upcoming Events" on the Updates & Events page.
          Past events stay in this list for editing.
        </p>
        <Button
          onClick={() => setEditing({ kind: "create", draft: { ...blank } })}
        >
          <Plus className="h-4 w-4" />
          New event
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Spinner />
        </div>
      ) : (
        <Card>
          <ul className="divide-y divide-brand-100">
            {data?.events.map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-brand-50/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                    {new Date(e.startsAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">
                    {e.title}
                  </p>
                  {e.location && (
                    <p className="mt-0.5 text-xs text-brand-500">
                      {e.location}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setEditing({
                        kind: "edit",
                        id: e.id,
                        draft: {
                          title: e.title,
                          description: e.description,
                          location: e.location ?? "",
                          url: e.url ?? "",
                          startsAt: isoForInput(e.startsAt),
                          endsAt: isoForInput(e.endsAt),
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
                      if (confirm(`Delete "${e.title}"?`)) del.mutate(e.id);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
            {data?.events.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-brand-500">
                No events yet. Click "New event" to add the first one.
              </li>
            )}
          </ul>
        </Card>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brand-950/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl">
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-brand-900">
                  {editing.kind === "create" ? "New event" : "Edit event"}
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

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-brand-700">
                    Starts at
                  </span>
                  <Input
                    type="datetime-local"
                    value={editing.draft.startsAt}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, startsAt: e.target.value },
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-brand-700">
                    Ends at (optional)
                  </span>
                  <Input
                    type="datetime-local"
                    value={editing.draft.endsAt}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, endsAt: e.target.value },
                      })
                    }
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-brand-700">
                  Location
                </span>
                <Input
                  placeholder="e.g. HQ Conference Room or Zoom"
                  value={editing.draft.location}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      draft: { ...editing.draft, location: e.target.value },
                    })
                  }
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-brand-700">
                  Link (optional)
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
                  Description
                </span>
                <RichTextEditor
                  value={editing.draft.description}
                  onChange={(html) =>
                    setEditing({
                      ...editing,
                      draft: { ...editing.draft, description: html },
                    })
                  }
                  placeholder="Add details, agenda, dial-in info…"
                  minHeight="min-h-[180px]"
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
                  onClick={submit}
                  disabled={
                    create.isPending ||
                    update.isPending ||
                    !editing.draft.title ||
                    !editing.draft.startsAt
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
