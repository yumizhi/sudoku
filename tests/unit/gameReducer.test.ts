import { describe, expect, it } from "vitest";
import { TUTORIAL_LEVELS, cloneGrid, gridFromString } from "../../src/domain/sudoku";
import { createGameStateFromPayload, gameReducer } from "../../src/features/game/gameReducer";

function makeState() {
  const tutorial = TUTORIAL_LEVELS[0];
  const puzzle = gridFromString(tutorial.puzzle, true);
  const solution = gridFromString(tutorial.solution, false);

  if (!puzzle || !solution) {
    throw new Error("tutorial payload failed to load");
  }

  return createGameStateFromPayload({
    difficulty: "medium",
    seed: 1,
    puzzle,
    solution,
    mode: "normal",
    tutorialId: null
  });
}

describe("gameReducer", () => {
  it("does not overwrite a filled editable cell without erasing first", () => {
    let state = makeState();

    state = gameReducer(state, { type: "inputDigit", digit: 5 });
    expect(state.board[0][0]).toBe(5);

    const next = gameReducer(state, { type: "inputDigit", digit: 3 });
    expect(next.board[0][0]).toBe(5);
    expect(next.message.text).toContain("先擦除");
    expect(next.history).toHaveLength(1);
  });

  it("refuses to generate a hint when the board already contains errors", () => {
    const state = makeState();
    const board = cloneGrid(state.board);
    board[0][0] = 1;

    const next = gameReducer(
      createGameStateFromPayload({
        difficulty: "medium",
        seed: 1,
        puzzle: state.puzzle,
        solution: state.solution,
        board,
        mode: "normal",
        tutorialId: null
      }),
      { type: "requestHint" }
    );

    expect(next.pendingHint).toBeNull();
    expect(next.showValidation).toBe(true);
    expect(next.message.text).toContain("先修正后再请求提示");
  });
});
