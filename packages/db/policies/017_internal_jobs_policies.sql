-- internal_jobs: any authenticated user can read published listings; writes
-- go through the API via the service role only.

alter table public.internal_jobs enable row level security;

drop policy if exists "internal_jobs_select_authenticated" on public.internal_jobs;
create policy "internal_jobs_select_authenticated"
  on public.internal_jobs for select
  to authenticated
  using (is_published = true);

-- job_referrals: employees see their own referrals; writes go through the API.

alter table public.job_referrals enable row level security;

drop policy if exists "job_referrals_select_own" on public.job_referrals;
create policy "job_referrals_select_own"
  on public.job_referrals for select
  to authenticated
  using (
    referrer_employee_id in (
      select employee_id from public.profiles where id = auth.uid()
    )
  );
