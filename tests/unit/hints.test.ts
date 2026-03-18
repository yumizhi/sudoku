import { describe, expect, it } from "vitest";
import { TUTORIAL_LEVELS, findHiddenSingle, findNakedSingle, gridFromString } from "../../src/domain/sudoku";

describe("hint engine", () => {
  it("finds the naked single tutorial move", () => {
    const board = gridFromString(TUTORIAL_LEVELS[0].puzzle, true);
    if (!board) {
      throw new Error("tutorial board failed to load");
    }

    const hint = findNakedSingle(board);
    expect(hint?.technique).toBe("裸单");
    expect(hint?.value).toBe(5);
  });

  it("finds a hidden single on the hidden-single tutorial board", () => {
    const board = gridFromString(TUTORIAL_LEVELS[1].puzzle, true);
    if (!board) {
      throw new Error("tutorial board failed to load");
    }

    const hint = findHiddenSingle(board);
    expect(hint?.technique).toBe("隐藏单");
  });
});
