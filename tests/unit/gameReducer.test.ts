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

describe("gameReducer focus model", () => {
  it("starts in global input mode with the first empty cell selected", () => {
    const state = makeState();

    expect(state.focus.digitMode).toBe("input");
    expect(state.focus.cell).toEqual({ row: 0, col: 0 });
    expect(state.focus.selectedDigit).toBeNull();
    expect(state.focus.observedDigit).toBeNull();
  });

  it("uses pressDigit for input mode and keeps the input focus digit active", () => {
    const state = gameReducer(makeState(), { type: "pressDigit", digit: 1 });

    expect(state.board[0][0]).toBe(1);
    expect(state.focus.digitMode).toBe("input");
    expect(state.focus.cell).toEqual({ row: 0, col: 0 });
    expect(state.focus.selectedDigit).toBe(1);
    expect(state.focus.observedDigit).toBeNull();
  });

  it("switching input -> observe clears selectedDigit", () => {
    let state = gameReducer(makeState(), { type: "pressDigit", digit: 1 });
    state = gameReducer(state, { type: "setDigitMode", mode: "observe" });

    expect(state.focus.digitMode).toBe("observe");
    expect(state.focus.selectedDigit).toBeNull();
    expect(state.focus.observedDigit).toBeNull();
  });

  it("observe mode toggles observedDigit without editing the board", () => {
    let state = gameReducer(makeState(), { type: "setDigitMode", mode: "observe" });
    state = gameReducer(state, { type: "pressDigit", digit: 5 });

    expect(state.focus.digitMode).toBe("observe");
    expect(state.focus.observedDigit).toBe(5);
    expect(state.board[0][0]).toBe(0);

    state = gameReducer(state, { type: "pressDigit", digit: 5 });
    expect(state.focus.observedDigit).toBeNull();
    expect(state.board[0][0]).toBe(0);
  });

  it("switching observe -> input clears observedDigit", () => {
    let state = gameReducer(makeState(), { type: "setDigitMode", mode: "observe" });
    state = gameReducer(state, { type: "pressDigit", digit: 5 });
    state = gameReducer(state, { type: "setDigitMode", mode: "input" });

    expect(state.focus.digitMode).toBe("input");
    expect(state.focus.observedDigit).toBeNull();
  });

  it("keeps focus digit when selecting a new empty cell in input mode", () => {
    let state = gameReducer(makeState(), { type: "pressDigit", digit: 4 });
    state = gameReducer(state, { type: "selectCell", row: 1, col: 1 });

    expect(state.focus.cell).toEqual({ row: 1, col: 1 });
    expect(state.focus.selectedDigit).toBe(4);
  });

  it("allows overwriting a filled editable cell directly through the same pressDigit path", () => {
    let state = gameReducer(makeState(), { type: "pressDigit", digit: 1 });
    const next = gameReducer(state, { type: "pressDigit", digit: 3 });

    expect(next.board[0][0]).toBe(3);
    expect(next.message.text).toBe("已填入 3。");
    expect(next.history).toHaveLength(2);
    expect(next.focus.selectedDigit).toBe(3);
  });
});
