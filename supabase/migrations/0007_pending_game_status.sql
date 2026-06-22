-- =============================================================================
-- PickleIT — 0007 pending game status
-- Adds a 'pending' game_status so a court's timer doesn't start until a
-- manager explicitly taps "Start Game". Games are now inserted as 'pending'
-- and promoted to 'in_progress' by the new startGame action.
-- =============================================================================

alter type game_status add value 'pending';
