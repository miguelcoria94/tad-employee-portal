-- company_events: any authenticated user can read; writes go through the API
-- via the service role only.

alter table public.company_events enable row level security;

drop policy if exists "company_events_select_authenticated" on public.company_events;
create policy "company_events_select_authenticated"
  on public.company_events for select
  to authenticated
  using (true);
