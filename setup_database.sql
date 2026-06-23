-- Create a table to track active multiplayer rooms
create table if not exists quiz_rooms (
  room_code text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'lobby' not null -- 'lobby', 'playing', 'finished'
);

-- Create a table to store the final quiz results
create table if not exists quiz_scores (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  room_code text not null,
  player_name text not null,
  score integer not null,
  total_questions integer not null
);

-- Create a table to store birthday messages written to Nisreen
create table if not exists quiz_messages (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  room_code text not null,
  player_name text not null,
  message text not null
);

-- Enable Realtime only if not already enabled (safe idempotent approach)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'quiz_rooms'
  ) then
    alter publication supabase_realtime add table quiz_rooms;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'quiz_scores'
  ) then
    alter publication supabase_realtime add table quiz_scores;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'quiz_messages'
  ) then
    alter publication supabase_realtime add table quiz_messages;
  end if;
end $$;
