-- department_resources: any authenticated user can read; writes go through
-- the API via the service role only.

alter table public.department_resources enable row level security;

drop policy if exists "department_resources_select_authenticated" on public.department_resources;
create policy "department_resources_select_authenticated"
  on public.department_resources for select
  to authenticated
  using (true);
