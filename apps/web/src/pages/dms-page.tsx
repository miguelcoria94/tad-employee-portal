import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  Search,
  Send,
  SquarePen,
  X,
  ArrowUp,
} from "lucide-react";
import type { DmMessageRow } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/auth-context";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type Participant = {
  userId: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  title: string | null;
};

type Conversation = {
  id: string;
  lastMessageAt: string | null;
  lastMessageBody: string | null;
  unreadCount: number;
  otherParticipant: Participant;
};

type ConversationsResponse = { conversations: Conversation[] };
type MessagesResponse = { messages: DmMessageRow[]; nextCursor: string | null };
type Employee = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  title: string | null;
  department: string | null;
};
type EmployeesResponse = { employees: Employee[] };

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const m = Math.floor((Date.now() - t) / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTimestamp(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Supabase Realtime delivers raw DB rows with snake_case column names. Map them
// to the camelCase shape the rest of the app uses, otherwise createdAt /
// senderUserId come back undefined (→ "Invalid Date" + wrong bubble alignment).
function normalizeRealtimeMessage(row: Record<string, unknown>): DmMessageRow {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id ?? row.conversationId ?? ""),
    senderUserId: String(row.sender_user_id ?? row.senderUserId ?? ""),
    body: String(row.body ?? ""),
    readAt: (row.read_at ?? row.readAt ?? null) as string | null,
    createdAt: String(row.created_at ?? row.createdAt ?? ""),
  };
}

// Single source of truth: merge by id (incoming wins) and keep chronological
// order. Guarantees a message can never appear twice regardless of whether it
// arrives via the initial fetch, the send response, or a realtime event.
function mergeMessages(
  prev: DmMessageRow[],
  incoming: DmMessageRow[],
): DmMessageRow[] {
  const byId = new Map<string, DmMessageRow>();
  for (const m of prev) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function participantInitials(p: Participant | Employee) {
  return `${p.firstName.charAt(0)}${(p.lastName ?? "").charAt(0) || ""}`.toUpperCase();
}

/* ─── New Conversation Modal ─── */

function NewConversationModal({
  onSelect,
  onClose,
}: {
  onSelect: (userId: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const { user } = useAuth();

  const { data, isLoading } = useQuery<EmployeesResponse>({
    queryKey: ["employees"],
    queryFn: () => api("/api/v1/employees"),
  });

  const employees = (data?.employees ?? []).filter(
    (e) => e.userId && e.userId !== user?.id,
  );

  const filtered = search.trim()
    ? employees.filter((e) => {
        const q = search.toLowerCase();
        const name = `${e.firstName} ${e.lastName ?? ""}`.toLowerCase();
        return name.includes(q);
      })
    : employees;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div
        className="absolute inset-0 bg-brand-900/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-brand-100 bg-white shadow-soft">
        <header className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
          <h2 className="text-base font-semibold text-brand-900">
            New conversation
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-50 hover:text-brand-900"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="border-b border-brand-100 px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
            <Input
              placeholder="Search colleagues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        <ul className="max-h-72 overflow-y-auto">
          {isLoading ? (
            <li className="grid place-items-center py-10">
              <Spinner />
            </li>
          ) : filtered.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-brand-500">
              No colleagues found.
            </li>
          ) : (
            filtered.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => onSelect(e.userId)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-brand-50"
                >
                  <Avatar
                    initials={participantInitials(e)}
                    src={e.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-900">
                      {e.firstName} {e.lastName}
                    </p>
                    {e.title && (
                      <p className="truncate text-xs text-brand-500">
                        {e.title}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

/* ─── Conversation List (left panel) ─── */

function ConversationList({
  conversations,
  selected,
  onSelect,
  onNew,
  isLoading,
}: {
  conversations: Conversation[];
  selected: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  isLoading: boolean;
}) {
  const [filter, setFilter] = useState("");
  const visible = filter.trim()
    ? conversations.filter((c) => {
        const name =
          `${c.otherParticipant.firstName ?? ""} ${c.otherParticipant.lastName ?? ""}`.toLowerCase();
        return name.includes(filter.toLowerCase());
      })
    : conversations;

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-brand-100 bg-white">
      <header className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-brand-900">Messages</h2>
        <button
          onClick={onNew}
          title="New conversation"
          className="grid h-8 w-8 place-items-center rounded-lg text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-900"
        >
          <SquarePen className="h-4 w-4" />
        </button>
      </header>

      <div className="border-b border-brand-100 px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search conversations"
            className="h-8 w-full rounded-lg border border-brand-100 bg-white pl-8 pr-3 text-xs text-brand-900 placeholder:text-brand-400 focus:border-highlight-400 focus:outline-none focus:ring-2 focus:ring-highlight-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid place-items-center py-10">
            <Spinner />
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-brand-500">
            No messages yet.
          </div>
        ) : visible.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-brand-500">
            No conversations match “{filter}”.
          </div>
        ) : (
          <ul>
            {visible.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50/60",
                    selected === c.id && "bg-brand-50",
                  )}
                >
                  <Avatar
                    initials={participantInitials(c.otherParticipant)}
                    src={c.otherParticipant.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "truncate text-sm",
                          c.unreadCount > 0
                            ? "font-bold text-brand-900"
                            : "font-medium text-brand-900",
                        )}
                      >
                        {c.otherParticipant.firstName}{" "}
                        {c.otherParticipant.lastName}
                      </p>
                      {c.lastMessageAt && (
                        <span className="shrink-0 text-[10px] text-brand-400">
                          {timeAgo(c.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {c.lastMessageBody && (
                      <p
                        className={cn(
                          "mt-0.5 truncate text-xs",
                          c.unreadCount > 0
                            ? "font-medium text-brand-700"
                            : "text-brand-500",
                        )}
                      >
                        {c.lastMessageBody}
                      </p>
                    )}
                  </div>
                  {c.unreadCount > 0 && (
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent-500"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

/* ─── Message Thread (right panel) ─── */

function MessageThread({
  conversationId,
  otherParticipant,
}: {
  conversationId: string;
  otherParticipant: Participant;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<DmMessageRow[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const prevConversationId = useRef<string | null>(null);

  if (prevConversationId.current !== conversationId) {
    prevConversationId.current = conversationId;
    isInitialLoad.current = true;
    setAllMessages([]);
    setCursor(null);
    setHasMore(true);
    setDraft("");
  }

  const { data, isLoading, isFetching } = useQuery<MessagesResponse>({
    queryKey: ["dm-messages", conversationId, cursor],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (cursor) params.set("before", cursor);
      return api(`/api/v1/dms/${conversationId}/messages?${params}`);
    },
  });

  useEffect(() => {
    if (!data) return;
    setAllMessages((prev) => mergeMessages(prev, data.messages));
    setHasMore(!!data.nextCursor);
  }, [data, cursor]);

  useEffect(() => {
    if (isInitialLoad.current && allMessages.length > 0) {
      isInitialLoad.current = false;
      bottomRef.current?.scrollIntoView();
    }
  }, [allMessages]);

  useEffect(() => {
    api(`/api/v1/dms/${conversationId}/read`, { method: "POST" }).catch(
      () => {},
    );
  }, [conversationId]);

  useEffect(() => {
    // Unique topic per effect run so StrictMode's double-mount can't hand us a
    // channel that's already subscribed (which makes `.on(...)` throw).
    const channel = supabase
      .channel(`dms:${conversationId}:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = normalizeRealtimeMessage(
            payload.new as Record<string, unknown>,
          );
          setAllMessages((prev) => mergeMessages(prev, [msg]));
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          qc.invalidateQueries({ queryKey: ["dm-conversations"] });
          if (msg.senderUserId !== user?.id) {
            api(`/api/v1/dms/${conversationId}/read`, {
              method: "POST",
            }).catch(() => {});
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id, qc]);

  // Synchronous guard: send.isPending only flips on the next render, so two
  // rapid submits (e.g. double Enter) could otherwise both fire a POST and
  // create two messages.
  const sendingRef = useRef(false);
  const send = useMutation({
    // The API wraps the row as { message }. Unwrap it before merging — merging
    // the raw envelope would insert a bodyless / senderless ghost bubble.
    mutationFn: (body: string) =>
      api<{ message: DmMessageRow }>(`/api/v1/dms/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    onSuccess: ({ message }) => {
      setDraft("");
      setAllMessages((prev) => mergeMessages(prev, [message]));
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      qc.invalidateQueries({ queryKey: ["dm-conversations"] });
    },
    onSettled: () => {
      sendingRef.current = false;
    },
  });

  const trimmedSearch = searchQ.trim();
  const searchResults = useQuery<{ messages: DmMessageRow[] }>({
    queryKey: ["dm-search", conversationId, trimmedSearch],
    enabled: searchOpen && trimmedSearch.length >= 2,
    queryFn: () =>
      api(
        `/api/v1/dms/${conversationId}/messages?limit=50&q=${encodeURIComponent(trimmedSearch)}`,
      ),
  });

  const handleSend = useCallback(() => {
    const body = draft.trim();
    if (!body || send.isPending || sendingRef.current) return;
    sendingRef.current = true;
    send.mutate(body);
  }, [draft, send]);

  function loadMore() {
    const oldest = allMessages[0];
    if (!oldest || !hasMore || isFetching) return;
    setCursor(oldest.id);
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Thread header */}
      <header className="flex items-center gap-3 border-b border-brand-100 bg-white px-5 py-3">
        <Avatar
          initials={participantInitials(otherParticipant)}
          src={otherParticipant.avatarUrl}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-900">
            {otherParticipant.firstName} {otherParticipant.lastName}
          </p>
          {otherParticipant.title && (
            <p className="truncate text-xs text-brand-500">
              {otherParticipant.title}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setSearchOpen((v) => !v);
            setSearchQ("");
          }}
          title="Search messages"
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
            searchOpen
              ? "bg-brand-900 text-white"
              : "text-brand-600 hover:bg-brand-50 hover:text-brand-900",
          )}
        >
          <Search className="h-4 w-4" />
        </button>
      </header>

      {searchOpen && (
        <div className="border-b border-brand-100 bg-white px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
            <Input
              autoFocus
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search this conversation…"
              className="pl-9"
            />
          </div>
          {trimmedSearch.length >= 2 && (
            <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-brand-100">
              {searchResults.isLoading ? (
                <div className="grid place-items-center py-6">
                  <Spinner className="h-4 w-4" />
                </div>
              ) : (searchResults.data?.messages.length ?? 0) === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-brand-500">
                  No messages match “{trimmedSearch}”.
                </p>
              ) : (
                <ul className="divide-y divide-brand-50">
                  {searchResults.data?.messages.map((m) => (
                    <li key={m.id} className="px-4 py-2.5">
                      <p className="text-sm text-brand-800">{m.body}</p>
                      <p className="mt-0.5 text-[10px] text-brand-400">
                        {m.senderUserId === user?.id
                          ? "You"
                          : otherParticipant.firstName}{" "}
                        · {formatTimestamp(m.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 py-4"
      >
        {hasMore && (
          <div className="mb-2 flex justify-center">
            <button
              onClick={loadMore}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-100"
            >
              {isFetching ? (
                <Spinner className="h-3 w-3" />
              ) : (
                <ArrowUp className="h-3 w-3" />
              )}
              Load older messages
            </button>
          </div>
        )}

        {isLoading && allMessages.length === 0 ? (
          <div className="grid flex-1 place-items-center">
            <Spinner />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="grid flex-1 place-items-center">
            <p className="text-sm text-brand-500">
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          allMessages.map((msg) => {
            const isMine = msg.senderUserId === user?.id;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col",
                  isMine ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2.5",
                    isMine
                      ? "bg-brand-900 text-white rounded-br-sm"
                      : "bg-white border border-brand-100 text-brand-900 rounded-bl-sm",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {msg.body}
                  </p>
                </div>
                <span className="mt-1 text-[10px] text-brand-400">
                  {formatTimestamp(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="sticky bottom-0 border-t border-brand-100 bg-white px-5 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="Type a message..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button
            type="submit"
            size="md"
            disabled={!draft.trim() || send.isPending}
            className="shrink-0"
          >
            {send.isPending ? (
              <Spinner className="h-4 w-4 border-white/40 border-t-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ─── Main DMs Page ─── */

export function DmsPage() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("c"),
  );
  const [showNewModal, setShowNewModal] = useState(false);

  const { data, isLoading } = useQuery<ConversationsResponse>({
    queryKey: ["dm-conversations"],
    queryFn: () => api("/api/v1/dms"),
  });

  const conversations = data?.conversations ?? [];
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const createConversation = useMutation({
    mutationFn: (recipientUserId: string) =>
      api<{ conversation: { id: string } }>("/api/v1/dms", {
        method: "POST",
        body: JSON.stringify({ recipientUserId }),
      }),
    onSuccess: (res) => {
      setSelectedId(res.conversation.id);
      setShowNewModal(false);
      qc.invalidateQueries({ queryKey: ["dm-conversations"] });
    },
  });

  function handleNewConversation(userId: string) {
    createConversation.mutate(userId);
  }

  return (
    <div
      className="flex bg-brand-mesh"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      <ConversationList
        conversations={conversations}
        selected={selectedId}
        onSelect={setSelectedId}
        onNew={() => setShowNewModal(true)}
        isLoading={isLoading}
      />

      {selected ? (
        <MessageThread
          key={selected.id}
          conversationId={selected.id}
          otherParticipant={selected.otherParticipant}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            title="No messages yet"
            description="Start a conversation with a colleague."
            action={
              <Button
                variant="secondary"
                onClick={() => setShowNewModal(true)}
              >
                <SquarePen className="h-4 w-4" />
                New conversation
              </Button>
            }
            className="max-w-sm border-0 bg-transparent shadow-none"
          />
        </div>
      )}

      {showNewModal && (
        <NewConversationModal
          onSelect={handleNewConversation}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
}
