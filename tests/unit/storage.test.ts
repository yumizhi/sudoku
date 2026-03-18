import { beforeEach, describe, expect, it } from "vitest";
import {
  LEGACY_STORAGE_KEY,
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
});
