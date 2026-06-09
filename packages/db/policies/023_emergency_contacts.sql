-- emergency_contacts: employees can read their own contacts only.
-- Admins read all via the API with service role.

alter table public.emergency_contacts enable row level security;

drop policy if exists "emergency_contacts_select_own" on public.emergency_contacts;
create policy "emergency_contacts_select_own"
  on public.emergency_contacts for select
  to authenticated
  using (
    employee_id in (
      select employee_id from public.profiles where id = auth.uid()
    )
  );
