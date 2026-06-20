-- =============================================================================
-- PickleIT — 0005 Realtime
-- Publish the live-state tables so multiple phones viewing the same active
-- session receive row-level changes and stay in sync.
--
-- The active dashboard is reconstructable from:
--   session_players (state / current_court / queue_position / games_played)
--   games           (in_progress + winner on completion)
--   game_players    (team composition)
-- =============================================================================

-- The 'supabase_realtime' publication is created by Supabase by default.
-- Add our tables to it (idempotent-ish: wrap to ignore "already member").
do $$
begin
  begin
    alter publication supabase_realtime add table session_players;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table games;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table game_players;
  exception when duplicate_object then null;
  end;
end$$;

-- Ensure UPDATE/DELETE events carry the full old row (so clients can react to
-- a player leaving the queue, a game completing, etc.).
alter table session_players replica identity full;
alter table games           replica identity full;
alter table game_players    replica identity full;
