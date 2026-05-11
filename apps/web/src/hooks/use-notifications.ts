import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NotificationRow } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/auth-context";

type NotificationsResponse = {
  notifications: NotificationRow[];
  unreadCount: number;
};

const KEY = ["notifications"] as const;

export function useNotifications() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const qc = useQueryClient();

  const query = useQuery<NotificationsResponse>({
    queryKey: KEY,
    enabled: !!userId,
    queryFn: () => api("/api/v1/notifications?limit=30"),
    // Real-time pushes new rows; mutations are optimistic. Skip background
    // polling so we don't fight the optimistic state.
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: KEY });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  const markOne = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/notifications/${id}/read`, { method: "POST" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<NotificationsResponse>(KEY);
      if (previous) {
        const now = new Date().toISOString();
        const wasUnread = previous.notifications.some(
          (n) => n.id === id && !n.readAt,
        );
        qc.setQueryData<NotificationsResponse>(KEY, {
          notifications: previous.notifications.map((n) =>
            n.id === id && !n.readAt ? { ...n, readAt: now } : n,
          ),
          unreadCount: wasUnread
            ? Math.max(0, previous.unreadCount - 1)
            : previous.unreadCount,
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const markAll = useMutation({
    mutationFn: () =>
      api("/api/v1/notifications/mark-all-read", { method: "POST" }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<NotificationsResponse>(KEY);
      if (previous) {
        const now = new Date().toISOString();
        qc.setQueryData<NotificationsResponse>(KEY, {
          notifications: previous.notifications.map((n) =>
            n.readAt ? n : { ...n, readAt: now },
          ),
          unreadCount: 0,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
    markRead: (id: string) => markOne.mutate(id),
    markAllRead: () => markAll.mutate(),
  };
}
