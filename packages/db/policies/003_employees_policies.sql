-- employees: any authenticated user (anyone with a TadHealth account) can read
-- the directory. Writes go through the API via the service role only.

drop policy if exists "employees_select_authenticated" on public.employees;
create policy "employees_select_authenticated"
  on public.employees for select
  to authenticated
  using (true);