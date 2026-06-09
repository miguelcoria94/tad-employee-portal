-- time_off_balances: employees see their own balances; writes go through the
-- API via the service role only.

alter table public.time_off_balances enable row level security;

drop policy if exists "time_off_balances_select_own" on public.time_off_balances;
create policy "time_off_balances_select_own"
  on public.time_off_balances for select
  to authenticated
  using (
    employee_id in (
      select employee_id from public.profiles where id = auth.uid()
    )
  );
