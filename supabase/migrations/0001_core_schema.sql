-- =============================================================================
-- PickleIT — 0001 core schema
-- Players, sessions, live session state, games, and the per-game roster.
-- UUID primary keys + created_at timestamps throughout.
-- Apply migrations in filename order (0001, 0002, ...).
-- =============================================================================

-- gen_random_uuid() lives in pgcrypto.
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type player_category as enum ('beginner', 'intermediate', 'pro');
create type pairing_mode    as enum ('balance', 'king_of_the_court');
create type session_status  as enum ('active', 'ended');
create type session_player_state as enum ('playing', 'waiting', 'left');
create type game_status     as enum ('in_progress', 'completed');
create type team_side       as enum ('a', 'b');

-- ----------------------------------------------------------------------------
-- players — the permanent roster (persists across sessions)
-- ----------------------------------------------------------------------------
create table players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  age        int,                       -- nullable
  category   player_category not null default 'beginner',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- sessions — one play session on 1–3 courts
-- ----------------------------------------------------------------------------
create table sessions (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,                       -- e.g. a date label
  court_count  int  not null check (court_count between 1 and 3),
  pairing_mode pairing_mode not null,
  status       session_status not null default 'active',
  created_at   timestamptz not null default now(),
  ended_at     timestamptz
);

-- ----------------------------------------------------------------------------
-- session_players — attendance + live state, so the dashboard is fully
-- reconstructable from the DB for realtime sync.
-- ----------------------------------------------------------------------------
create table session_players (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references sessions(id) on delete cascade,
  player_id      uuid not null references players(id)  on delete cascade,
  state          session_player_state not null default 'waiting',
  current_court  int,                  -- set when playing
  queue_position int,                  -- set when waiting; lower = next up
  games_played   int  not null default 0,  -- in-session fairness counter
  created_at     timestamptz not null default now(),
  unique (session_id, player_id)
);

create index session_players_session_idx on session_players (session_id);
create index session_players_queue_idx
  on session_players (session_id, queue_position)
  where state = 'waiting';

-- ----------------------------------------------------------------------------
-- games — one game on a court within a session
-- ----------------------------------------------------------------------------
create table games (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references sessions(id) on delete cascade,
  court_number int  not null,
  status       game_status not null default 'in_progress',
  winner       team_side,             -- nullable until completed
  started_at   timestamptz not null default now(),
  ended_at     timestamptz
);

create index games_session_idx on games (session_id);
-- At most one in-progress game per court per session.
create unique index games_one_active_per_court
  on games (session_id, court_number)
  where status = 'in_progress';

-- ----------------------------------------------------------------------------
-- game_players — join: who played a game, and on which team
-- ----------------------------------------------------------------------------
create table game_players (
  id        uuid primary key default gen_random_uuid(),
  game_id   uuid not null references games(id)   on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  team      team_side not null,
  unique (game_id, player_id)
);

create index game_players_game_idx   on game_players (game_id);
create index game_players_player_idx on game_players (player_id);
