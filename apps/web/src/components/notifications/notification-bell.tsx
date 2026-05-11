import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar,
  CheckCheck,
  ClipboardList,
  FolderOpen,
  Megaphone,
  MessageSquare,
} from "lucide-react";
import type { NotificationKind, NotificationRow } from "@tadhealth/shared";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

const ICON_BY_KIND: Record<NotificationKind, typeof Bell> = {
  new_update: Megaphone,
  new_event: Calendar,
  new_survey: ClipboardList,
  new_resource: FolderOpen,
  survey_response: MessageSquare,
  changelog: Bell,
};

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

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function handleClick(n: NotificationRow) {
    if (!n.readAt) markRead(n.id);
    setOpen(false);
    navigate(n.link);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-900"
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft">
          <header className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
            <p className="text-sm font-semibold text-brand-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </header>

          <ul className="max-h-[28rem] divide-y divide-brand-50 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-brand-500">
                You're all caught up.
              </li>
            ) : (
              notifications.map((n) => {
                const Icon = ICON_BY_KIND[n.kind] ?? Bell;
                const unread = !n.readAt;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50/60",
                        unread && "bg-highlight-50/40",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                          unread
                            ? "bg-highlight-400 text-brand-950"
                            : "bg-brand-50 text-brand-600",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-brand-900">
                          {n.title}
                        </span>
                        {n.body && (
                          <span className="mt-0.5 block line-clamp-2 text-xs text-brand-600">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-1 block text-[11px] font-medium uppercase tracking-wider text-brand-400">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                      {unread && (
                        <span
                          aria-hidden
                          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent-500"
                        />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
