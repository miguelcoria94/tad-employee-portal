-- company_updates: any authenticated user can read; writes go through the
-- API via the service role only.

alter table public.company_updates enable row level security;

drop policy if exists "company_updates_select_authenticated" on public.company_updates;
create policy "company_updates_select_authenticated"
  on public.company_updates for select
  to authenticated
  using (true);
