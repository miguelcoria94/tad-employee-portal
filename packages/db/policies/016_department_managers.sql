-- department_managers: any signed-in employee can read who manages what
-- (so we can show "Managed by X" on the dept page). Writes go through the
-- API with service role and require admin.

alter table public.department_managers enable row level security;

drop policy if exists "department_managers_select_authenticated" on public.department_managers;
create policy "department_managers_select_authenticated"
  on public.department_managers for select
  to authenticated
  using (true);
