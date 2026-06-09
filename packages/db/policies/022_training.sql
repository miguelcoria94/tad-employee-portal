-- training_courses: published courses readable by all authenticated users.
-- Writes via service role.

alter table public.training_courses enable row level security;

drop policy if exists "training_courses_select_published" on public.training_courses;
create policy "training_courses_select_published"
  on public.training_courses for select
  to authenticated
  using (is_published = true);

-- training_lessons: readable when the parent course is published.

alter table public.training_lessons enable row level security;

drop policy if exists "training_lessons_select_published" on public.training_lessons;
create policy "training_lessons_select_published"
  on public.training_lessons for select
  to authenticated
  using (
    course_id in (
      select id from public.training_courses where is_published = true
    )
  );

-- training_quiz_questions: readable when the parent course is published.

alter table public.training_quiz_questions enable row level security;

drop policy if exists "training_quiz_questions_select_published" on public.training_quiz_questions;
create policy "training_quiz_questions_select_published"
  on public.training_quiz_questions for select
  to authenticated
  using (
    lesson_id in (
      select id from public.training_lessons
      where course_id in (
        select id from public.training_courses where is_published = true
      )
    )
  );

-- training_enrollments: employees can read their own enrollments.

alter table public.training_enrollments enable row level security;

drop policy if exists "training_enrollments_select_own" on public.training_enrollments;
create policy "training_enrollments_select_own"
  on public.training_enrollments for select
  to authenticated
  using (
    employee_id in (
      select employee_id from public.profiles where id = auth.uid()
    )
  );

-- training_quiz_answers: employees can read their own answers.

alter table public.training_quiz_answers enable row level security;

drop policy if exists "training_quiz_answers_select_own" on public.training_quiz_answers;
create policy "training_quiz_answers_select_own"
  on public.training_quiz_answers for select
  to authenticated
  using (
    enrollment_id in (
      select id from public.training_enrollments
      where employee_id in (
        select employee_id from public.profiles where id = auth.uid()
      )
    )
  );
