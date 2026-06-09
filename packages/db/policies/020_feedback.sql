-- feedback_requests: authenticated users can read requests where they are the
-- requester or a respondent (via feedback_responses). Writes via service role.

alter table public.feedback_requests enable row level security;

drop policy if exists "feedback_requests_select_own" on public.feedback_requests;
create policy "feedback_requests_select_own"
  on public.feedback_requests for select
  to authenticated
  using (
    requester_user_id = auth.uid()
    or id in (
      select request_id from public.feedback_responses
      where respondent_user_id = auth.uid()
    )
  );

-- feedback_responses: authenticated users can read responses for requests they
-- created or responses they themselves submitted. Writes via service role.

alter table public.feedback_responses enable row level security;

drop policy if exists "feedback_responses_select_own" on public.feedback_responses;
create policy "feedback_responses_select_own"
  on public.feedback_responses for select
  to authenticated
  using (
    respondent_user_id = auth.uid()
    or request_id in (
      select id from public.feedback_requests
      where requester_user_id = auth.uid()
    )
  );
