-- departments: any authenticated user can read; writes go through the API
-- via the service role only.

alter table public.departments enable row level security;

drop policy if exists "departments_select_authenticated" on public.departments;
create policy "departments_select_authenticated"
  on public.departments for select
  to authenticated
  using (true);
