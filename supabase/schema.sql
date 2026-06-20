-- =========================================================================
-- Online Chat Room -- Supabase schema
-- Run this once in your project's SQL editor (Supabase Dashboard -> SQL Editor).
--
-- Before running this, enable Anonymous Sign-Ins:
--   Dashboard -> Authentication -> Sign In / Up -> enable "Allow anonymous sign-ins"
-- The app uses anonymous auth so every visitor gets a stable, unguessable
-- user id (auth.uid()) without needing an account. That id is what the
-- policies below use to decide who can read/write what.
-- =========================================================================

create extension if not exists "pgcrypto";

-- One row per room. Deleting a room is how a chat "ends" -- it cascades
-- and wipes its participants and messages along with it.
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_at timestamptz not null default now()
);

-- At most two rows per room_id, enforced by the trigger below.
create table public.room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  sender_id uuid not null,
  type text not null default 'text' check (type in ('text', 'emoji', 'gif')),
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_room_id_created_at_idx on public.messages (room_id, created_at);

-- -------------------------------------------------------------------------
-- Enforce "only 2 people per room" atomically, server-side, regardless of
-- what the client does. SECURITY DEFINER so it can count rows even though
-- RLS would otherwise scope a participant's own view.
-- -------------------------------------------------------------------------
create or replace function public.enforce_room_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count int;
begin
  select count(*) into current_count
  from public.room_participants
  where room_id = new.room_id;

  if current_count >= 2 then
    raise exception 'ROOM_FULL';
  end if;

  return new;
end;
$$;

create trigger trg_enforce_room_capacity
before insert on public.room_participants
for each row execute function public.enforce_room_capacity();

-- -------------------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------------------
alter table public.rooms enable row level security;
alter table public.room_participants enable row level security;
alter table public.messages enable row level security;

-- Rooms: the room code itself is the "secret" (it's an unguessable string
-- in a private link), so anyone holding it can look up the room to attempt
-- to join. Only an existing participant can delete (= end) it.
create policy "rooms_select_anyone" on public.rooms
  for select using (true);

create policy "rooms_insert_anyone" on public.rooms
  for insert with check (true);

create policy "rooms_delete_participants_only" on public.rooms
  for delete using (
    exists (
      select 1 from public.room_participants p
      where p.room_id = rooms.id and p.user_id = auth.uid()
    )
  );

-- Participants: anyone who can see a room can see who's in it (needed to
-- detect "full"), but you may only ever insert/delete YOUR OWN row.
create policy "participants_select_anyone" on public.room_participants
  for select using (true);

create policy "participants_insert_self" on public.room_participants
  for insert with check (user_id = auth.uid());

create policy "participants_delete_self" on public.room_participants
  for delete using (user_id = auth.uid());

-- Messages: strictly limited to the two participants of that room.
create policy "messages_select_participants" on public.messages
  for select using (
    exists (
      select 1 from public.room_participants p
      where p.room_id = messages.room_id and p.user_id = auth.uid()
    )
  );

create policy "messages_insert_participants" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.room_participants p
      where p.room_id = messages.room_id and p.user_id = auth.uid()
    )
  );

create policy "messages_delete_participants" on public.messages
  for delete using (
    exists (
      select 1 from public.room_participants p
      where p.room_id = messages.room_id and p.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------------------
-- Realtime: let clients subscribe to changes on these tables.
-- -------------------------------------------------------------------------
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_participants;
alter publication supabase_realtime add table public.messages;
