-- update_comments: authenticated users can read all comments and add to the
-- Realtime publication so threads update live. Writes go through the API via
-- the service role (which enforces "edit/delete only your own; admins can
-- delete any").

alter table public.update_comments enable row level security;

drop policy if exists "update_comments_select_authenticated" on public.update_comments;
create policy "update_comments_select_authenticated"
  on public.update_comments for select
  to authenticated
  using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'update_comments'
  ) then
    alter publication supabase_realtime add table public.update_comments;
  end if;
end $$;
