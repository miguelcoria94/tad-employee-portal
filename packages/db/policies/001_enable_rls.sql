-- Enable RLS on all app tables. Defense-in-depth — the API uses the service
-- role and bypasses RLS, but we never want a misconfigured anon client to
-- accidentally read/write these tables directly.

alter table public.employees enable row level security;
alter table public.profiles  enable row level security;