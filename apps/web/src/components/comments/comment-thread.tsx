import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import type { UpdateCommentRow } from "@tadhealth/shared";
import { api, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function avatarInitials(name: string) {
  const parts = name.split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function CommentThread({ updateId }: { updateId: string }) {
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ comments: UpdateCommentRow[] }>({
    queryKey: ["comments", updateId],
    queryFn: () => api(`/api/v1/company-updates/${updateId}/comments`),
  });

  // Real-time: refresh when a new comment lands.
  useEffect(() => {
    // Unique topic per effect run so StrictMode's double-mount can't hand us a
    // channel that's already subscribed (which makes `.on(...)` throw).
    const channel = supabase
      .channel(`update-comments:${updateId}:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "update_comments",
          filter: `update_id=eq.${updateId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["comments", updateId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [updateId, qc]);

  const post = useMutation({
    mutationFn: (text: string) =>
      api(`/api/v1/company-updates/${updateId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: text }),
      }),
    onSuccess: () => {
      setBody("");
      setError(null);
      qc.invalidateQueries({ queryKey: ["comments", updateId] });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : (err as Error).message),
  });

  const edit = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      api(`/api/v1/comments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ body: text }),
      }),
    onSuccess: () => {
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["comments", updateId] });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/comments/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", updateId] }),
  });

  const comments = data?.comments ?? [];

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
        Comments {comments.length > 0 && (
          <span className="text-brand-400">· {comments.length}</span>
        )}
      </h2>

      <Card className="mb-4">
        <CardBody className="space-y-3">
          <Textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
          />
          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex justify-end">
            <Button
              onClick={() => post.mutate(body)}
              disabled={!body.trim() || post.isPending}
            >
              {post.isPending ? (
                <Spinner className="border-white/40 border-t-white" />
              ) : (
                "Post comment"
              )}
            </Button>
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="grid place-items-center py-8">
          <Spinner />
        </div>
      ) : comments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-200 bg-white px-4 py-6 text-center text-sm text-brand-500">
          Be the first to comment.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const mine = user?.id === c.authorUserId;
            const canDelete = mine || isAdmin;
            const editing = editingId === c.id;
            return (
              <li
                key={c.id}
                className={cn(
                  "rounded-2xl border border-brand-100 bg-white p-4 shadow-soft",
                  mine && "border-highlight-200",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-brand-900">
                    <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-highlight-200 text-[10px] font-bold text-brand-900">
                      {avatarInitials(c.authorName)}
                    </span>
                    {c.authorName}
                    {mine && (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-brand-400">
                        You
                      </span>
                    )}
                  </p>
                  <span className="text-xs text-brand-400">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>

                {editing ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      rows={3}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          edit.mutate({ id: c.id, text: editBody })
                        }
                        disabled={!editBody.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-700">
                      {c.body}
                    </p>
                    {(mine || canDelete) && (
                      <div className="mt-2 flex justify-end gap-1">
                        {mine && (
                          <button
                            onClick={() => {
                              setEditingId(c.id);
                              setEditBody(c.body);
                            }}
                            className="grid h-7 w-7 place-items-center rounded-md text-brand-500 hover:bg-brand-50"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (confirm("Delete this comment?"))
                                del.mutate(c.id);
                            }}
                            className="grid h-7 w-7 place-items-center rounded-md text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
