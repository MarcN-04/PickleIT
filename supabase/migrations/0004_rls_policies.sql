-- =============================================================================
-- PickleIT — 0004 Row Level Security policies
--
-- Roles (from current_user_role(), defined in 0003):
--   admin     -> full read/write on everything, incl. managing profiles/roles
--   organizer -> read everything + write players/sessions/session_players/
--                games/game_players (run sessions, log results)
--   viewer    -> read-only on game data
--   pending   -> NO access to any data
--
-- AUTH SEAM: This is the single place that defines who can do what. To add
-- finer-grained auth later, adjust these policies (and current_user_role()).
-- =============================================================================

alter table players          enable row level security;
alter table sessions         enable row level security;
alter table session_players  enable row level security;
alter table games            enable row level security;
alter table game_players     enable row level security;
alter table profiles         enable row level security;

-- Convenience predicates -----------------------------------------------------
--   can_read  : admin/organizer/viewer (anyone with an assigned role)
--   can_write : admin/organizer
-- Implemented inline per policy since Postgres policies can't call a shared
-- boolean helper as cleanly; current_user_role() centralizes the lookup.

-- ============================ game-data tables ===============================
-- players
create policy players_read   on players for select
  using (current_user_role() in ('admin','organizer','viewer'));
create policy players_write  on players for all
  using      (current_user_role() in ('admin','organizer'))
  with check (current_user_role() in ('admin','organizer'));

-- sessions
create policy sessions_read  on sessions for select
  using (current_user_role() in ('admin','organizer','viewer'));
create policy sessions_write on sessions for all
  using      (current_user_role() in ('admin','organizer'))
  with check (current_user_role() in ('admin','organizer'));

-- session_players
create policy session_players_read  on session_players for select
  using (current_user_role() in ('admin','organizer','viewer'));
create policy session_players_write on session_players for all
  using      (current_user_role() in ('admin','organizer'))
  with check (current_user_role() in ('admin','organizer'));

-- games
create policy games_read  on games for select
  using (current_user_role() in ('admin','organizer','viewer'));
create policy games_write on games for all
  using      (current_user_role() in ('admin','organizer'))
  with check (current_user_role() in ('admin','organizer'));

-- game_players
create policy game_players_read  on game_players for select
  using (current_user_role() in ('admin','organizer','viewer'));
create policy game_players_write on game_players for all
  using      (current_user_role() in ('admin','organizer'))
  with check (current_user_role() in ('admin','organizer'));

-- ================================ profiles ===================================
-- Everyone signed-in can read their OWN profile (needed so the app can show
-- the pending/approval screen and the user's role).
create policy profiles_read_self on profiles for select
  using (id = auth.uid());

-- Admins can read ALL profiles (user management screen).
create policy profiles_read_admin on profiles for select
  using (current_user_role() = 'admin');

-- Only admins can change profiles (assign/approve roles, edit usernames).
create policy profiles_write_admin on profiles for all
  using      (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- NOTE: profile INSERT happens via the SECURITY DEFINER trigger in 0003,
-- which bypasses RLS — so no insert policy is needed for sign-up to work.
