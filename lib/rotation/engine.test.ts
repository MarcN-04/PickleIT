import { describe, it, expect } from "vitest";
import {
  initializeSession,
  applyGameResult,
  removePlayer,
  addLatePlayer,
} from "./engine";
import type { EnginePlayer, EngineState } from "./types";
import type { Category } from "@/lib/categories";

// ---- helpers ---------------------------------------------------------------

let seqCounter = 0;
function player(
  id: string,
  category: Category = "intermediate",
  gamesPlayed = 0
): EnginePlayer {
  return { id, category, gamesPlayed, seq: seqCounter++ };
}

function makePlayers(
  specs: Array<[string, Category?]>
): Record<string, EnginePlayer> {
  seqCounter = 0;
  const out: Record<string, EnginePlayer> = {};
  for (const [id, cat] of specs) out[id] = player(id, cat ?? "intermediate");
  return out;
}

function ids(specs: string[]): Array<[string, Category?]> {
  return specs.map((s) => [s] as [string, Category?]);
}

/** All ids currently seated across all courts. */
function seated(state: EngineState): string[] {
  return state.games.flatMap((g) => [...g.teamA, ...g.teamB]);
}

// ---- session start ---------------------------------------------------------

describe("initializeSession", () => {
  it("fills one court and queues the rest (8 players, 1 court)", () => {
    const players = makePlayers(ids(["a", "b", "c", "d", "e", "f", "g", "h"]));
    const s = initializeSession(players, 1, "balance");
    expect(s.games).toHaveLength(1);
    expect(seated(s)).toHaveLength(4);
    expect(s.queue).toHaveLength(4);
    // No overlap between court and queue.
    expect(seated(s).filter((id) => s.queue.includes(id))).toHaveLength(0);
  });

  it("fills two courts (8 players, 2 courts) with empty queue", () => {
    const players = makePlayers(ids(["a", "b", "c", "d", "e", "f", "g", "h"]));
    const s = initializeSession(players, 2, "balance");
    expect(s.games).toHaveLength(2);
    expect(seated(s)).toHaveLength(8);
    expect(s.queue).toHaveLength(0);
  });

  it("handles counts not divisible by 4 (6 players, 2 courts -> 1 game, 2 wait)", () => {
    const players = makePlayers(ids(["a", "b", "c", "d", "e", "f"]));
    const s = initializeSession(players, 2, "balance");
    expect(s.games).toHaveLength(1); // only 4 of 6 can play
    expect(s.queue).toHaveLength(2);
  });

  it("balances teams by skill weight", () => {
    // pro=3, beginner=1. Balanced split puts one pro + one beginner per team.
    const players = makePlayers([
      ["p1", "pro"],
      ["p2", "pro"],
      ["b1", "beginner"],
      ["b2", "beginner"],
    ]);
    const s = initializeSession(players, 1, "balance");
    const g = s.games[0];
    const w = (t: [string, string]) =>
      t.reduce((sum, id) => sum + ({ pro: 3, beginner: 1, intermediate: 2 }[players[id].category]), 0);
    expect(w(g.teamA)).toBe(w(g.teamB)); // 4 == 4
  });

  it("is deterministic for identical inputs", () => {
    const a = initializeSession(makePlayers(ids(["a", "b", "c", "d", "e"])), 1, "balance");
    const b = initializeSession(makePlayers(ids(["a", "b", "c", "d", "e"])), 1, "balance");
    expect(a.games).toEqual(b.games);
    expect(a.queue).toEqual(b.queue);
  });
});

// ---- balance mode ----------------------------------------------------------

describe("balance mode game over", () => {
  it("sends all four to the back and pulls the next four", () => {
    const players = makePlayers(ids(["a", "b", "c", "d", "e", "f", "g", "h"]));
    const s0 = initializeSession(players, 1, "balance");
    const first4 = seated(s0);
    const queued4 = [...s0.queue];

    const s1 = applyGameResult(s0, { court: 1, winner: "a" });

    // The next group on court is exactly the previously-queued four.
    expect(new Set(seated(s1))).toEqual(new Set(queued4));
    // The previous four are now waiting.
    expect(new Set(s1.queue)).toEqual(new Set(first4));
  });

  it("increments games_played for the four who played", () => {
    const players = makePlayers(ids(["a", "b", "c", "d", "e", "f", "g", "h"]));
    const s0 = initializeSession(players, 1, "balance");
    const played = seated(s0);
    const s1 = applyGameResult(s0, { court: 1, winner: "b" });
    for (const id of played) expect(s1.players[id].gamesPlayed).toBe(1);
    for (const id of s0.queue) expect(s1.players[id].gamesPlayed).toBe(0);
  });

  it("winner does not affect queue priority in balance mode", () => {
    const players = makePlayers(ids(["a", "b", "c", "d", "e", "f", "g", "h"]));
    const s0 = initializeSession(players, 1, "balance");
    const sWinA = applyGameResult(s0, { court: 1, winner: "a" });
    const sWinB = applyGameResult(s0, { court: 1, winner: "b" });
    // Same court occupants regardless of who won.
    expect(new Set(seated(sWinA))).toEqual(new Set(seated(sWinB)));
  });

  it("fairness: fewest games played go on next", () => {
    // 5 players, 1 court. After a game, the 1 who sat (0 games) must be on court.
    const players = makePlayers(ids(["a", "b", "c", "d", "e"]));
    const s0 = initializeSession(players, 1, "balance");
    const satOut = s0.queue[0];
    const s1 = applyGameResult(s0, { court: 1, winner: "a" });
    expect(seated(s1)).toContain(satOut);
    expect(s1.players[satOut].gamesPlayed).toBe(0);
  });
});

// ---- king of the court -----------------------------------------------------

describe("king of the court game over", () => {
  it("winners stay (split), losers to back, challengers in", () => {
    const players = makePlayers(ids(["a", "b", "c", "d", "e", "f", "g", "h"]));
    const s0 = initializeSession(players, 1, "king_of_the_court");
    const g0 = s0.games[0];
    const winners = g0.teamA;
    const losers = g0.teamB;

    const s1 = applyGameResult(s0, { court: 1, winner: "a" });
    const onCourt = seated(s1);

    // Both winners still on court.
    expect(onCourt).toContain(winners[0]);
    expect(onCourt).toContain(winners[1]);
    // Winners are split onto opposite teams.
    const g1 = s1.games[0];
    const winnersTogether =
      (g1.teamA.includes(winners[0]) && g1.teamA.includes(winners[1])) ||
      (g1.teamB.includes(winners[0]) && g1.teamB.includes(winners[1]));
    expect(winnersTogether).toBe(false);
    // Losers are now waiting.
    expect(s1.queue).toEqual(expect.arrayContaining([losers[0], losers[1]]));
    // Two fresh challengers came from the old queue.
    const oldQueue = new Set(s0.queue);
    expect(onCourt.filter((id) => oldQueue.has(id))).toHaveLength(2);
  });

  it("increments games_played for all four who played", () => {
    const players = makePlayers(ids(["a", "b", "c", "d", "e", "f", "g", "h"]));
    const s0 = initializeSession(players, 1, "king_of_the_court");
    const played = seated(s0);
    const s1 = applyGameResult(s0, { court: 1, winner: "a" });
    for (const id of played) expect(s1.players[id].gamesPlayed).toBe(1);
  });

  it("with fewer than two waiting, winners are not left in a partial game", () => {
    // Exactly 4 players, 1 court: nobody waiting. After a game, winners can't
    // get challengers, so the court can't be refilled (no partial games).
    const players = makePlayers(ids(["a", "b", "c", "d"]));
    const s0 = initializeSession(players, 1, "king_of_the_court");
    expect(s0.queue).toHaveLength(0);
    const s1 = applyGameResult(s0, { court: 1, winner: "a" });
    // No game with fewer than 4 should exist.
    for (const g of s1.games) {
      expect([...g.teamA, ...g.teamB]).toHaveLength(4);
    }
  });
});

// ---- edge cases ------------------------------------------------------------

describe("edge cases", () => {
  it("removePlayer drops them from the queue", () => {
    const players = makePlayers(ids(["a", "b", "c", "d", "e", "f"]));
    const s0 = initializeSession(players, 1, "balance");
    const waiting = s0.queue[0];
    const s1 = removePlayer(s0, waiting);
    expect(s1.queue).not.toContain(waiting);
    expect(s1.players[waiting]).toBeUndefined();
  });

  it("removePlayer on a court dissolves that game and re-queues the rest", () => {
    const players = makePlayers(ids(["a", "b", "c", "d", "e", "f"]));
    const s0 = initializeSession(players, 1, "balance");
    const onCourt = seated(s0)[0];
    const s1 = removePlayer(s0, onCourt);
    expect(s1.games).toHaveLength(0);
    // The other three from that court are now waiting.
    expect(s1.queue.length).toBe(5);
    expect(s1.players[onCourt]).toBeUndefined();
  });

  it("addLatePlayer puts the arrival at the back of the queue", () => {
    const players = makePlayers(ids(["a", "b", "c", "d", "e"]));
    const s0 = initializeSession(players, 1, "balance");
    const late = player("zz", "pro");
    const s1 = addLatePlayer(s0, late);
    expect(s1.queue[s1.queue.length - 1]).toBe("zz");
    expect(s1.players["zz"]).toBeDefined();
  });

  it("late arrival with 0 games still queues behind current waiters (seq tiebreak)", () => {
    // Existing waiter also has 0 games; late arrival must not jump ahead.
    const players = makePlayers(ids(["a", "b", "c", "d", "e"]));
    const s0 = initializeSession(players, 1, "balance");
    const existingWaiter = s0.queue[0];
    const late = { id: "zz", category: "pro" as Category, gamesPlayed: 0, seq: 0 };
    const s1 = addLatePlayer(s0, late);
    expect(s1.queue.indexOf(existingWaiter)).toBeLessThan(s1.queue.indexOf("zz"));
  });

  it("applyGameResult on an unknown court is a no-op", () => {
    const players = makePlayers(ids(["a", "b", "c", "d"]));
    const s0 = initializeSession(players, 1, "balance");
    const s1 = applyGameResult(s0, { court: 99, winner: "a" });
    expect(s1).toBe(s0);
  });

  it("does not mutate the input state", () => {
    const players = makePlayers(ids(["a", "b", "c", "d", "e", "f", "g", "h"]));
    const s0 = initializeSession(players, 1, "balance");
    const snapshotQueue = [...s0.queue];
    const snapshotGames = JSON.parse(JSON.stringify(s0.games));
    applyGameResult(s0, { court: 1, winner: "a" });
    expect(s0.queue).toEqual(snapshotQueue);
    expect(s0.games).toEqual(snapshotGames);
  });
});

// ---- multi-game fairness over time ----------------------------------------

describe("fairness over a run of games", () => {
  it("keeps games_played within 1 of each other (balance, 5 players)", () => {
    const players = makePlayers(ids(["a", "b", "c", "d", "e"]));
    let s = initializeSession(players, 1, "balance");
    for (let i = 0; i < 15; i++) {
      s = applyGameResult(s, { court: 1, winner: i % 2 === 0 ? "a" : "b" });
    }
    const counts = Object.values(s.players).map((p) => p.gamesPlayed);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });
});
