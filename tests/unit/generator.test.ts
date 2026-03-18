import { describe, expect, it } from "vitest";
import { cloneGrid, countSolutions, generateGameBundle, gridToString } from "../../src/domain/sudoku";

describe("generator", () => {
  it("produces deterministic bundles from the same seed", () => {
    const first = generateGameBundle("medium", 123456);
    const second = generateGameBundle("medium", 123456);

    expect(gridToString(first.solution)).toBe(gridToString(second.solution));
    expect(gridToString(first.puzzle)).toBe(gridToString(second.puzzle));
  });

  it("creates a puzzle with a unique solution", () => {
    const bundle = generateGameBundle("easy", 42);
    const probe = cloneGrid(bundle.puzzle);

    expect(countSolutions(probe, 2)).toBe(1);
  });
});
