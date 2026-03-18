import { describe, expect, it } from "vitest";
import { gridFromString } from "../../src/domain/sudoku";
import { createGameStateFromPayload, gameReducer } from "../../src/features/game/gameReducer";

function makeState() {
  const puzzle = gridFromString(
    "034678912672195348198342567859761423426853791713924856961537284287419635345286179",
    true
  );
  const solution = gridFromString(
    "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
    false
  );

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
  it("starts with no board or observe highlight", () => {
    const state = makeState();

    expect(state.interactionMode).toBe("none");
    expect(state.selectedCell).toBeNull();
    expect(state.observedDigit).toBeNull();
  });

  it("allows overwriting a filled editable cell directly", () => {
    let state = makeState();

    state = gameReducer(state, { type: "inputDigit", digit: 1 });
    expect(state.board[0][0]).toBe(1);

    const next = gameReducer(state, { type: "inputDigit", digit: 3 });
    expect(next.board[0][0]).toBe(3);
    expect(next.message.text).toBe("已填入 3。");
    expect(next.history).toHaveLength(2);
  });

  it("keeps fill feedback neutral even when the number is wrong", () => {
    const state = makeState();
    const next = gameReducer(state, { type: "inputDigit", digit: 1 });

    expect(next.message.text).toBe("已填入 1。");
    expect(next.message.tone).toBe("info");
  });

  it("enters board-selected when clicking a filled cell and toggles off on second click", () => {
    let state = makeState();
    state = gameReducer(state, { type: "interactWithBoardCell", row: 0, col: 2 });

    expect(state.interactionMode).toBe("board-selected");
    expect(state.selectedCell).toEqual({ row: 0, col: 2 });
    expect(state.observedDigit).toBeNull();

    state = gameReducer(state, { type: "interactWithBoardCell", row: 0, col: 2 });
    expect(state.interactionMode).toBe("none");
    expect(state.selectedCell).toBeNull();
    expect(state.observedDigit).toBeNull();
  });

  it("keeps empty-cell selection visible without entering digit highlight mode", () => {
    const state = gameReducer(makeState(), { type: "interactWithBoardCell", row: 0, col: 0 });

    expect(state.selected).toEqual({ row: 0, col: 0 });
    expect(state.interactionMode).toBe("none");
    expect(state.selectedCell).toBeNull();
    expect(state.observedDigit).toBeNull();
  });

  it("observe digit replaces board-selected and toggles off on repeated click", () => {
    let state = makeState();
    state = gameReducer(state, { type: "interactWithBoardCell", row: 0, col: 2 });
    state = gameReducer(state, { type: "toggleObserveDigit", digit: 5 });

    expect(state.interactionMode).toBe("observe-digit");
    expect(state.selectedCell).toBeNull();
    expect(state.observedDigit).toBe(5);

    state = gameReducer(state, { type: "toggleObserveDigit", digit: 5 });
    expect(state.interactionMode).toBe("none");
    expect(state.selectedCell).toBeNull();
    expect(state.observedDigit).toBeNull();
  });

  it("switches from observe-digit to board-selected when clicking a filled cell", () => {
    let state = makeState();
    state = gameReducer(state, { type: "toggleObserveDigit", digit: 5 });
    state = gameReducer(state, { type: "interactWithBoardCell", row: 0, col: 2 });

    expect(state.interactionMode).toBe("board-selected");
    expect(state.selectedCell).toEqual({ row: 0, col: 2 });
    expect(state.observedDigit).toBeNull();
  });

  it("promotes a successful digit input into board-selected same-digit highlight", () => {
    const state = gameReducer(makeState(), { type: "inputDigit", digit: 1 });

    expect(state.interactionMode).toBe("board-selected");
    expect(state.selectedCell).toEqual({ row: 0, col: 0 });
    expect(state.observedDigit).toBeNull();
  });
});
