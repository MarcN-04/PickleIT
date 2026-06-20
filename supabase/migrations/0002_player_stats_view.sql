-- =============================================================================
-- PickleIT — 0002 player_stats view
-- Lifetime aggregate per player across ALL completed games (every session).
-- Used by player profiles and the leaderboard.
-- Current streak is computed in the app from recent games (not here).
-- =============================================================================

create or replace view player_stats as
with played as (
  -- One row per (player, completed game) with whether that player won.
  select
    gp.player_id,
    g.id as game_id,
    (g.winner = gp.team) as did_win
  from game_players gp
  join games g on g.id = gp.game_id
  where g.status = 'completed'
    and g.winner is not null
)
select
  p.id   as player_id,
  p.name,
  p.category,
  count(pl.game_id)                                  as games,
  count(pl.game_id) filter (where pl.did_win)        as wins,
  count(pl.game_id) filter (where not pl.did_win)    as losses,
  case
    when count(pl.game_id) = 0 then 0
    else round(
      count(pl.game_id) filter (where pl.did_win)::numeric
      / count(pl.game_id), 4
    )
  end as win_rate
from players p
left join played pl on pl.player_id = p.id
group by p.id, p.name, p.category;

-- Views run with the privileges of the querying user, so RLS on the
-- underlying tables (added in 0004) governs access automatically.
