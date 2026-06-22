-- =============================================================================
-- PickleIT — 0008 pending game status index
-- Extends the one-active-game-per-court constraint to cover 'pending' games
-- too, so a court can't have both a pending and in-progress row at once.
-- Split into its own migration because the new enum value from 0007 must be
-- committed before it can be referenced.
-- =============================================================================

drop index games_one_active_per_court;

create unique index games_one_active_per_court
  on games (session_id, court_number)
  where status in ('pending', 'in_progress');
