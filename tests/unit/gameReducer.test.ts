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
    throw new Error("puzzle failed to load");
  }

  return createGameStateFromPayload({
    difficulty: "medium",
    seed: 1,
    puzzle,
    solution
  });
}

describe("gameReducer", () => {
  it("selects the first editable cell when a game loads", () => {
    const state = makeState();

    expect(state.selectedCell).toEqual({ row: 0, col: 0 });
    expect(state.highlightedDigit).toBeNull();
    expect(state.board[0][0]).toBe(0);
  });

  it("clicking a filled cell toggles same-digit highlighting", () => {
    let state = makeState();

    state = gameReducer(state, { type: "clickCell", row: 0, col: 1 });
    expect(state.selectedCell).toEqual({ row: 0, col: 1 });
    expect(state.highlightedDigit).toBe(3);

    state = gameReducer(state, { type: "clickCell", row: 0, col: 1 });
    expect(state.selectedCell).toEqual({ row: 0, col: 1 });
    expect(state.highlightedDigit).toBe(3);
  });

  it("clicking an empty cell clears any previous digit highlight", () => {
    let state = makeState();

    state = gameReducer(state, { type: "clickCell", row: 0, col: 1 });
    state = gameReducer(state, { type: "clickCell", row: 0, col: 0 });

    expect(state.selectedCell).toEqual({ row: 0, col: 0 });
    expect(state.highlightedDigit).toBeNull();
  });

  it("fills the selected editable cell immediately", () => {
    const state = gameReducer(makeState(), { type: "inputDigit", digit: 5 });

    expect(state.board[0][0]).toBe(5);
    expect(state.highlightedDigit).toBe(5);
    expect(state.status).toBe("won");
  });

  it("clears a selected editable cell", () => {
    let state = gameReducer(makeState(), { type: "inputDigit", digit: 5 });
    state = gameReducer(state, { type: "clearCell" });

    expect(state.board[0][0]).toBe(0);
    expect(state.status).toBe("playing");
  });

  it("marks the game won only when the full board matches the solution", () => {
    const solvedPuzzle = gridFromString(
      "034678912672195348198342567859761423426853791713924856961537284287419635345286179",
      true
    );
    const solvedBoard = gridFromString(
      "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
      false
    );

    if (!solvedPuzzle || !solvedBoard) {
      throw new Error("puzzle failed to load");
    }

    const state = createGameStateFromPayload({
      difficulty: "medium",
      seed: 1,
      puzzle: solvedPuzzle,
      solution: solvedBoard,
      board: solvedPuzzle,
      selectedCell: { row: 0, col: 0 }
    });

    const next = gameReducer(state, { type: "inputDigit", digit: 5 });
    expect(next.status).toBe("won");
  });

  it("restores same-digit highlighting when the selected saved cell already has a value", () => {
    const puzzle = gridFromString(
      "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
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
      seed: 3,
      puzzle,
      solution,
      selectedCell: { row: 0, col: 0 }
    });

    expect(state.highlightedDigit).toBe(5);
  });

  it("toggles peer highlighting independently from same-digit highlighting", () => {
    const state = gameReducer(makeState(), { type: "togglePeerHighlights" });

    expect(state.showPeerHighlights).toBe(false);
    expect(state.message.text).toBe("已关闭占线高亮。");
  });
});
