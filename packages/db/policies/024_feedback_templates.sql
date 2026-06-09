-- feedback_templates: authenticated users can read their own templates and any
-- template shared org-wide. Writes go through the API (service role), so no
-- insert/update/delete policies are needed for the anon/authenticated roles.

alter table public.feedback_templates enable row level security;

drop policy if exists "feedback_templates_select_own_or_shared" on public.feedback_templates;
create policy "feedback_templates_select_own_or_shared"
  on public.feedback_templates for select
  to authenticated
  using (
    owner_user_id = auth.uid()
    or scope = 'shared'
  );
