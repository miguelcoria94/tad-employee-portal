-- surveys: authenticated users can read published surveys; question/response/
-- answer tables stay locked down so direct reads can't leak who responded.
-- All meaningful access goes through the API using the service role.

alter table public.surveys           enable row level security;
alter table public.survey_questions  enable row level security;
alter table public.survey_responses  enable row level security;
alter table public.survey_answers    enable row level security;

drop policy if exists "surveys_select_published" on public.surveys;
create policy "surveys_select_published"
  on public.surveys for select
  to authenticated
  using (is_published = true);

drop policy if exists "survey_questions_select_via_survey" on public.survey_questions;
create policy "survey_questions_select_via_survey"
  on public.survey_questions for select
  to authenticated
  using (
    exists (
      select 1 from public.surveys s
      where s.id = survey_id and s.is_published = true
    )
  );
