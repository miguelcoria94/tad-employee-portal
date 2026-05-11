-- profiles.id is a FK to auth.users(id). We add the constraint here (after
-- migrations) instead of in the Drizzle schema because the auth schema is
-- owned by Supabase and CREATE TABLE permission isn't granted to the
-- migration role — but adding a constraint that REFERENCES an existing
-- auth.users row is allowed.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_id_auth_users_fk'
  ) then
    alter table public.profiles
      add constraint profiles_id_auth_users_fk
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end $$;
