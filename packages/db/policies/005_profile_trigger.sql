-- Auto-create a profile row whenever a new auth.users row is inserted, and
-- mark Ben + Claire as admins by email match. Add or remove admins by
-- updating profiles.is_admin directly.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id uuid;
  v_is_admin    boolean;
begin
  select id into v_employee_id from public.employees where email = new.email;
  v_is_admin := new.email in ('ben@tadhealth.com', 'claire@tadhealth.com');

  insert into public.profiles (id, employee_id, is_admin)
  values (new.id, v_employee_id, v_is_admin)
  on conflict (id) do update
    set employee_id = excluded.employee_id,
        is_admin    = profiles.is_admin or excluded.is_admin;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();