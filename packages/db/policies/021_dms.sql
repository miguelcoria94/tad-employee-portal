-- dm_conversations: users can read conversations where they are a participant.
-- Writes via service role.

alter table public.dm_conversations enable row level security;

drop policy if exists "dm_conversations_select_participant" on public.dm_conversations;
create policy "dm_conversations_select_participant"
  on public.dm_conversations for select
  to authenticated
  using (
    participant1_id = auth.uid()
    or participant2_id = auth.uid()
  );

-- dm_messages: users can read messages in conversations they belong to.
-- Writes via service role.

alter table public.dm_messages enable row level security;

drop policy if exists "dm_messages_select_participant" on public.dm_messages;
create policy "dm_messages_select_participant"
  on public.dm_messages for select
  to authenticated
  using (
    conversation_id in (
      select id from public.dm_conversations
      where participant1_id = auth.uid()
        or participant2_id = auth.uid()
    )
  );

-- Supabase Realtime publication for dm_messages (idempotent: adding a table
-- that's already a member raises 42710, so guard it).
DO $$ BEGIN
  alter publication supabase_realtime add table public.dm_messages;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
