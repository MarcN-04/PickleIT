/**
 * The rotation engine — pure, deterministic, UI/DB-independent.
 *
 * Two entry points:
 *   - initializeSession(): from a flat list of players, fill the courts with
 *     balanced teams and put the remainder in a fair waiting queue.
 *   - applyGameResult(): on a "game over", update games_played, re-queue the
 *     four players per the pairing mode, and pull the next group onto the court.
 *
 * Determinism: given identical inputs, output is identical. All ordering falls
 * back to (gamesPlayed, seq, id) and pairing falls back to (diff, repeat, id).
 */

import type {
  EngineState,
  EnginePlayer,
  EngineGame,
  GameResult,
  GameHistoryEntry,
  PairingMode,
} from "./types";
import { bestPairing } from "./teams";
import { orderQueue, takeFront } from "./queue";

const SEATS_PER_COURT = 4;

/** Clamp helper. */
function activePlayerIds(players: Record<string, EnginePlayer>): string[] {
  return Object.keys(players);
}

/** Build a game on a court from 4 ids, with balanced teams. */
function makeGame(
  court: number,
  fourIds: string[],
  players: Record<string, EnginePlayer>,
  history: GameHistoryEntry[]
): EngineGame {
  const four = fourIds as [string, string, string, string];
  const { teamA, teamB } = bestPairing(four, players, history);
  return { court, teamA, teamB };
}

/**
 * Create the initial state: order all players fairly, fill as many courts as
 * possible (4 per court, up to courtCount), queue the rest.
 * Players already carry gamesPlayed (usually 0 at start) and seq.
 */
export function initializeSession(
  players: Record<string, EnginePlayer>,
  courtCount: number,
  mode: PairingMode
): EngineState {
  const ordered = orderQueue(activePlayerIds(players), players);

  const maxOnCourt = Math.min(
    courtCount * SEATS_PER_COURT,
    Math.floor(ordered.length / SEATS_PER_COURT) * SEATS_PER_COURT
  );

  const onCourt = ordered.slice(0, maxOnCourt);
  const waiting = ordered.slice(maxOnCourt);

  const games: EngineGame[] = [];
  for (let c = 0; c < onCourt.length / SEATS_PER_COURT; c++) {
    const group = onCourt.slice(c * SEATS_PER_COURT, c * SEATS_PER_COURT + SEATS_PER_COURT);
    games.push(makeGame(c + 1, group, players, []));
  }

  return {
    courtCount,
    mode,
    games,
    queue: orderQueue(waiting, players),
    players,
    history: [],
  };
}

/** All player ids currently seated in a game. */
function playersOnCourt(game: EngineGame): string[] {
  return [...game.teamA, ...game.teamB];
}

/**
 * Apply a completed game. Returns a NEW state (does not mutate the input).
 * Records history, increments games_played for the four, re-queues per mode,
 * and refills the freed court from the queue.
 */
export function applyGameResult(
  state: EngineState,
  result: GameResult
): EngineState {
  const game = state.games.find((g) => g.court === result.court);
  if (!game) return state; // unknown court — no-op

  // Clone players (immutability) and bump games_played for the four.
  const players: Record<string, EnginePlayer> = {};
  for (const [id, p] of Object.entries(state.players)) players[id] = { ...p };
  const four = playersOnCourt(game);
  for (const id of four) {
    if (players[id]) players[id].gamesPlayed += 1;
  }

  const winners = result.winner === "a" ? game.teamA : game.teamB;
  const losers = result.winner === "a" ? game.teamB : game.teamA;

  const history: GameHistoryEntry[] = [
    { teamA: game.teamA, teamB: game.teamB },
    ...state.history,
  ];

  // Remaining games (other courts unchanged).
  const otherGames = state.games.filter((g) => g.court !== result.court);

  let queue = [...state.queue];
  let newGame: EngineGame | null = null;

  if (state.mode === "balance") {
    // All four to the back of the queue; pull next four from the front.
    queue = orderQueue([...queue, ...four], players);
    const [next, rest] = takeFront(queue, SEATS_PER_COURT);
    queue = rest;
    if (next.length === SEATS_PER_COURT) {
      newGame = makeGame(result.court, next, players, history);
    } else {
      // Not enough to fill the court — put them back; court sits idle.
      queue = orderQueue([...rest, ...next], players);
    }
  } else {
    // King of the court: winners stay (split), losers to back of queue.
    queue = orderQueue([...queue, ...losers], players);

    // Pull up to 2 challengers from the front to partner the split winners.
    const [challengers, rest] = takeFront(queue, 2);
    queue = rest;

    if (challengers.length === 2) {
      // Split winners, each paired with one challenger; balance the assignment.
      newGame = splitWinnersGame(
        result.court,
        winners,
        [challengers[0], challengers[1]],
        players,
        history
      );
    } else if (challengers.length === 1) {
      // Only one challenger: keep winners paired vs (challenger + nobody) is
      // impossible; instead winners stay paired and the single challenger waits
      // until a second is available. Put challenger back; court keeps winners
      // paired only if we can field 4 — otherwise the winners re-queue too.
      queue = orderQueue([...queue, ...challengers], players);
      // Try to form a normal 4 from winners + next two if possible.
      const [more, rest2] = takeFront(queue, 2);
      if (more.length === 2) {
        queue = rest2;
        newGame = splitWinnersGame(
          result.court,
          winners,
          [more[0], more[1]],
          players,
          history
        );
      } else {
        // Can't fill: winners go back to the queue, court sits idle.
        queue = orderQueue([...queue, ...more, ...winners], players);
      }
    } else {
      // No challengers waiting: winners stay paired only if the court can be
      // filled; with nobody waiting it can't, so winners re-queue and the court
      // sits idle until enough players are available.
      queue = orderQueue([...queue, ...winners], players);
    }
  }

  const games = newGame ? [...otherGames, newGame] : otherGames;
  games.sort((a, b) => a.court - b.court);

  return {
    ...state,
    players,
    games,
    queue: orderQueue(queue, players),
    history,
  };
}

/**
 * King-of-the-court refill: the two winners must end up on OPPOSITE teams,
 * each with one challenger. Two assignments are possible; pick the more
 * balanced by combined skill weight (ties broken deterministically by id).
 */
function splitWinnersGame(
  court: number,
  winners: [string, string],
  challengers: [string, string],
  players: Record<string, EnginePlayer>,
  history: GameHistoryEntry[]
): EngineGame {
  const four: [string, string, string, string] = [
    winners[0],
    challengers[0],
    winners[1],
    challengers[1],
  ];
  // bestPairing enumerates all 3 splits, but we need winners separated. Two of
  // the three pairings separate them; bestPairing may pick the one that keeps
  // them together (the [w0,w1] vs [c0,c1] split). Guard against that:
  const pairing = bestPairing(four, players, history);
  const together =
    sameTeam(pairing.teamA, winners) || sameTeam(pairing.teamB, winners);
  if (!together) return { court, teamA: pairing.teamA, teamB: pairing.teamB };

  // Winners landed together; force a split and pick the more balanced of the
  // two separating assignments.
  const optionX = {
    teamA: [winners[0], challengers[0]] as [string, string],
    teamB: [winners[1], challengers[1]] as [string, string],
  };
  const optionY = {
    teamA: [winners[0], challengers[1]] as [string, string],
    teamB: [winners[1], challengers[0]] as [string, string],
  };
  const diff = (g: { teamA: [string, string]; teamB: [string, string] }) =>
    Math.abs(weight(g.teamA, players) - weight(g.teamB, players));
  const chosen = diff(optionX) <= diff(optionY) ? optionX : optionY;
  return { court, teamA: chosen.teamA, teamB: chosen.teamB };
}

function sameTeam(team: [string, string], pair: [string, string]): boolean {
  return (
    (team[0] === pair[0] && team[1] === pair[1]) ||
    (team[0] === pair[1] && team[1] === pair[0])
  );
}

function weight(
  team: [string, string],
  players: Record<string, EnginePlayer>
): number {
  // local copy of teamWeight to avoid cross-import churn
  const W = { beginner: 1, intermediate: 2, pro: 3 } as const;
  return team.reduce((s, id) => s + W[players[id].category], 0);
}

/** Remove a player mid-session (they left). Drops them from queue/state.
 *  If they were on a court, that game is left short — caller decides whether to
 *  refill; for v1 we re-queue the remaining three onto the back so the court can
 *  be refilled on the next event. Returns new state. */
export function removePlayer(state: EngineState, playerId: string): EngineState {
  if (!state.players[playerId]) return state;

  const players = { ...state.players };
  delete players[playerId];

  // If on a court, dissolve that game; remaining 3 go to the queue.
  let queue = state.queue.filter((id) => id !== playerId);
  const games: EngineGame[] = [];
  for (const g of state.games) {
    const ids = playersOnCourt(g);
    if (ids.includes(playerId)) {
      for (const id of ids) if (id !== playerId) queue.push(id);
    } else {
      games.push(g);
    }
  }

  return {
    ...state,
    players,
    games,
    queue: orderQueue(queue, players),
  };
}

/** Add a late arrival to the BACK of the queue. */
export function addLatePlayer(
  state: EngineState,
  player: EnginePlayer
): EngineState {
  const players = { ...state.players, [player.id]: player };
  // Late arrivals sit behind everyone present: give them the current max seq+1
  // if not already higher, so fairness ordering puts them last among equals.
  const maxSeq = Math.max(0, ...Object.values(state.players).map((p) => p.seq));
  const normalized: EnginePlayer = {
    ...player,
    seq: Math.max(player.seq, maxSeq + 1),
  };
  players[player.id] = normalized;

  return {
    ...state,
    players,
    queue: orderQueue([...state.queue, player.id], players),
  };
}
