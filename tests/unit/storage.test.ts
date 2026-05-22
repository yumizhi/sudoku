import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, gridFromString, gridToString, makeNoteGrid } from "../../src/domain/sudoku";
import { loadPersistedGame, savePersistedGame } from "../../src/features/game/storage";
import { createGameStateFromPayload } from "../../src/features/game/gameReducer";

describe("storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("loads a persisted v7 game snapshot with notes", () => {
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

    const notes = makeNoteGrid();
    notes[0][0] = [1, 2];

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 7,
        difficulty: "medium",
        seed: 7,
        puzzle: gridToString(puzzle),
        solution: gridToString(solution),
        board: gridToString(puzzle),
        notes,
        selectedCell: { row: 0, col: 0 },
        notesMode: true,
        elapsedSeconds: 18,
        status: "playing"
      })
    );

    const restored = loadPersistedGame();
    expect(restored?.difficulty).toBe("medium");
    expect(restored?.selectedCell).toEqual({ row: 0, col: 0 });
    expect(restored?.notes?.[0][0]).toEqual([1, 2]);
    expect(restored?.notesMode).toBe(true);
    expect(restored?.elapsedSeconds).toBe(18);
  });

  it("saves the current board using the v7 payload", () => {
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

    const notes = makeNoteGrid();
    notes[0][0] = [3, 4];

    const state = createGameStateFromPayload({
      difficulty: "medium",
      seed: 2,
      puzzle,
      solution,
      board: puzzle,
      notes,
      selectedCell: { row: 0, col: 0 },
      notesMode: true,
      elapsedSeconds: 42,
      status: "playing"
    });

    savePersistedGame(state);

    const payload = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as {
      version: number;
      status: string;
      elapsedSeconds: number;
      selectedCell: { row: number; col: number } | null;
      notes: number[][][];
      notesMode: boolean;
    } | null;

    expect(payload?.version).toBe(7);
    expect(payload?.status).toBe("playing");
    expect(payload?.elapsedSeconds).toBe(42);
    expect(payload?.selectedCell).toEqual({ row: 0, col: 0 });
    expect(payload?.notes?.[0][0]).toEqual([3, 4]);
    expect(payload?.notesMode).toBe(true);
  });
});
