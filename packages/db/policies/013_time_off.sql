-- time_off_requests: writes go through the API via the service role only.
-- Employees see their own requests (joined via profiles.employee_id =
-- time_off_requests.employee_id). Admins see everything through the API.

alter table public.time_off_requests enable row level security;

drop policy if exists "time_off_select_own" on public.time_off_requests;
create policy "time_off_select_own"
  on public.time_off_requests for select
  to authenticated
  using (
    employee_id in (
      select employee_id from public.profiles where id = auth.uid()
    )
  );