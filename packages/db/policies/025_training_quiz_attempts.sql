-- training_quiz_attempts: employees can read their own quiz attempts (via the
-- enrollment that owns them). Writes (grading) happen via the service role.

alter table public.training_quiz_attempts enable row level security;

drop policy if exists "training_quiz_attempts_select_own" on public.training_quiz_attempts;
create policy "training_quiz_attempts_select_own"
  on public.training_quiz_attempts for select
  to authenticated
  using (
    enrollment_id in (
      select id from public.training_enrollments
      where employee_id in (
        select employee_id from public.profiles where id = auth.uid()
      )
    )
  );
