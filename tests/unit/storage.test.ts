import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, gridFromString, gridToString } from "../../src/domain/sudoku";
import { loadPersistedGame, savePersistedGame } from "../../src/features/game/storage";
import { createGameStateFromPayload } from "../../src/features/game/gameReducer";

describe("storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("loads a persisted v5 game snapshot and defaults peer highlighting on", () => {
    const puzzle = gridFromString(
      "034678912672195348198342567859761423426853791713924856961537284287419635345286179",
      true
    );
    const solution = gridFromString(
      "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
      false
    );

    if (!puzzle || !solution) {
      throw new Error("puzzle failed to load");
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 5,
        difficulty: "medium",
        seed: 7,
        puzzle: gridToString(puzzle),
        solution: gridToString(solution),
        board: gridToString(puzzle),
        selectedCell: { row: 0, col: 0 },
        elapsedSeconds: 18,
        status: "playing"
      })
    );

    const restored = loadPersistedGame();
    expect(restored?.difficulty).toBe("medium");
    expect(restored?.selectedCell).toEqual({ row: 0, col: 0 });
    expect(restored?.showPeerHighlights).toBe(true);
    expect(restored?.elapsedSeconds).toBe(18);
  });

  it("saves the current board using the v6 payload", () => {
    const puzzle = gridFromString(
      "034678912672195348198342567859761423426853791713924856961537284287419635345286179",
      true
    );
    const solution = gridFromString(
      "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
      false
    );

    if (!puzzle || !solution) {
      throw new Error("puzzle failed to load");
    }

    const state = createGameStateFromPayload({
      difficulty: "medium",
      seed: 2,
      puzzle,
      solution,
      board: solution,
      selectedCell: { row: 0, col: 0 },
      showPeerHighlights: false,
      elapsedSeconds: 42,
      status: "won"
    });

    savePersistedGame(state);

    const payload = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as {
      version: number;
      status: string;
      elapsedSeconds: number;
      selectedCell: { row: number; col: number } | null;
      showPeerHighlights: boolean;
    } | null;

    expect(payload?.version).toBe(6);
    expect(payload?.status).toBe("won");
    expect(payload?.elapsedSeconds).toBe(42);
    expect(payload?.selectedCell).toEqual({ row: 0, col: 0 });
    expect(payload?.showPeerHighlights).toBe(false);
  });
});
