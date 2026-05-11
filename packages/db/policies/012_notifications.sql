-- notifications: a row per recipient per event. Users can read + mark their
-- own notifications via the anon JWT (used for Realtime subscriptions);
-- writes go through the API using the service role only.

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Enable Supabase Realtime change-feed for this table so the frontend can
-- subscribe to INSERTs for the signed-in user. Idempotent — only adds the
-- table to the publication if it isn't already in it.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
