import { beforeEach, describe, expect, it } from "vitest";
import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  TUTORIAL_LEVELS,
  gridFromString,
  makeNoteGrid
} from "../../src/domain/sudoku";
import { loadPersistedGame } from "../../src/features/game/storage";

describe("storage migration", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("loads a legacy v1 snapshot into the new runtime payload", () => {
    const tutorial = TUTORIAL_LEVELS[0];
    const puzzle = gridFromString(tutorial.puzzle, true);
    const solution = gridFromString(tutorial.solution, false);

    if (!puzzle || !solution) {
      throw new Error("tutorial payload failed to load");
    }

    window.localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({
        difficulty: "medium",
        puzzle,
        solution,
        board: puzzle,
        notes: makeNoteGrid(),
        selected: { row: 0, col: 0 },
        focusDigit: null,
        focusScope: null,
        noteMode: false,
        mistakes: 0,
        elapsedSeconds: 12,
        status: "playing",
        mode: "tutorial",
        tutorialId: tutorial.id
      })
    );

    const restored = loadPersistedGame();
    expect(restored).not.toBeNull();
    expect(restored?.mode).toBe("tutorial");
    expect(restored?.tutorialId).toBe(tutorial.id);
    expect(restored?.elapsedSeconds).toBe(12);
  });

  it("restores selectedDigit from the v4 focus payload", () => {
    const tutorial = TUTORIAL_LEVELS[0];
    const puzzle = gridFromString(tutorial.puzzle, true);
    const solution = gridFromString(tutorial.solution, false);

    if (!puzzle || !solution) {
      throw new Error("tutorial payload failed to load");
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 4,
        difficulty: "medium",
        seed: 7,
        mode: "normal",
        tutorialId: null,
        puzzle: tutorial.puzzle,
        solution: tutorial.solution,
        board: tutorial.puzzle,
        notes: makeNoteGrid(),
        focus: {
          digitMode: "input",
          cell: { row: 0, col: 0 },
          selectedDigit: 4,
          observedDigit: null
        },
        noteMode: false,
        mistakes: 0,
        elapsedSeconds: 18,
        status: "playing"
      })
    );

    const restored = loadPersistedGame();
    expect(restored?.focus?.digitMode).toBe("input");
    expect(restored?.focus?.selectedDigit).toBe(4);
    expect(restored?.focus?.cell).toEqual({ row: 0, col: 0 });
  });
});
