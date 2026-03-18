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
  it("does not overwrite a filled editable cell without erasing first", () => {
    let state = makeState();

    state = gameReducer(state, { type: "inputDigit", digit: 1 });
    expect(state.board[0][0]).toBe(1);

    const next = gameReducer(state, { type: "inputDigit", digit: 3 });
    expect(next.board[0][0]).toBe(1);
    expect(next.message.text).toContain("先擦除");
    expect(next.history).toHaveLength(1);
  });

  it("keeps fill feedback neutral even when the number is wrong", () => {
    const state = makeState();
    const next = gameReducer(state, { type: "inputDigit", digit: 1 });

    expect(next.message.text).toBe("已填入 1。");
    expect(next.message.tone).toBe("info");
  });

  it("keeps global observation active while moving selection", () => {
    let state = makeState();
    state = gameReducer(state, { type: "toggleGlobalInspect", digit: 5 });

    const moved = gameReducer(state, { type: "moveSelection", deltaRow: 1, deltaCol: 0 });
    expect(moved.focusScope).toBe("global");
    expect(moved.focusDigit).toBe(5);
  });
});
