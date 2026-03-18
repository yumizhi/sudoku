import { cloneGrid, deriveFixedGrid, makeBoolGrid, makeGrid } from "../../domain/sudoku";
import type { CellPosition, Difficulty, Digit } from "../../domain/sudoku";
import type { GameLoadPayload, GameState, MessageState } from "./types";

export type GameAction =
  | { type: "setDifficulty"; difficulty: Difficulty }
  | { type: "setGenerating"; generating: boolean; message?: MessageState }
  | { type: "loadGame"; payload: GameLoadPayload }
  | { type: "replaceState"; state: GameState }
  | { type: "tick" }
  | { type: "clickCell"; row: number; col: number }
  | { type: "moveSelection"; deltaRow: number; deltaCol: number }
  | { type: "inputDigit"; digit: Digit }
  | { type: "clearCell" }
  | { type: "restartGame" }
  | { type: "clearMessage" };

function createMessage(text: string, tone: MessageState["tone"] = "info"): MessageState {
  return { text, tone };
}

function findFirstEditableCell(puzzle: GameLoadPayload["puzzle"], board: GameLoadPayload["puzzle"]): CellPosition | null {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (board[row][col] === 0 || puzzle[row][col] === 0) {
        return { row, col };
      }
    }
  }

  return null;
}

function isBoardSolved(board: GameState["board"], solution: GameState["solution"]): boolean {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (board[row][col] !== solution[row][col]) {
        return false;
      }
    }
  }

  return true;
}

function withSolvedState(state: GameState): GameState {
  if (!isBoardSolved(state.board, state.solution)) {
    return {
      ...state,
      status: "playing"
    };
  }

  return {
    ...state,
    status: "won",
    message: createMessage(`完成！用时 ${formatTime(state.elapsedSeconds)}。`, "success")
  };
}

function createSelectionState(
  state: GameState,
  cell: CellPosition | null,
  highlightedDigit: Digit | null
): GameState {
  return {
    ...state,
    selectedCell: cell,
    highlightedDigit,
    message: state.message.text ? state.message : createMessage("")
  };
}

export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function createInitialGameState(): GameState {
  return {
    difficulty: "medium",
    seed: 1,
    puzzle: makeGrid(0),
    solution: makeGrid(0),
    board: makeGrid(0),
    fixed: makeBoolGrid(false),
    selectedCell: null,
    highlightedDigit: null,
    lastFilledCell: null,
    elapsedSeconds: 0,
    status: "idle",
    generating: false,
    message: createMessage("正在准备棋盘…")
  };
}

export function createGameStateFromPayload(payload: GameLoadPayload): GameState {
  const board = payload.board ? cloneGrid(payload.board) : cloneGrid(payload.puzzle);

  return {
    difficulty: payload.difficulty,
    seed: payload.seed,
    puzzle: cloneGrid(payload.puzzle),
    solution: cloneGrid(payload.solution),
    board,
    fixed: deriveFixedGrid(payload.puzzle),
    selectedCell: payload.selectedCell ?? findFirstEditableCell(payload.puzzle, board),
    highlightedDigit: null,
    lastFilledCell: null,
    elapsedSeconds: payload.elapsedSeconds ?? 0,
    status: payload.status ?? "playing",
    generating: false,
    message: payload.message ?? createMessage("新棋盘已准备好。")
  };
}

function clickCellState(state: GameState, row: number, col: number): GameState {
  const value = state.board[row][col];
  const clickedSameCell = state.selectedCell?.row === row && state.selectedCell?.col === col;

  if (value !== 0) {
    if (clickedSameCell && state.highlightedDigit === value) {
      return {
        ...state,
        selectedCell: null,
        highlightedDigit: null
      };
    }

    return {
      ...state,
      selectedCell: { row, col },
      highlightedDigit: value
    };
  }

  return {
    ...state,
    selectedCell: { row, col },
    highlightedDigit: null
  };
}

function moveSelectionState(state: GameState, deltaRow: number, deltaCol: number): GameState {
  const current = state.selectedCell ?? findFirstEditableCell(state.puzzle, state.board) ?? { row: 0, col: 0 };
  const next = {
    row: (current.row + deltaRow + 9) % 9,
    col: (current.col + deltaCol + 9) % 9
  };
  const value = state.board[next.row][next.col];

  return {
    ...state,
    selectedCell: next,
    highlightedDigit: value !== 0 ? value : null
  };
}

function inputDigitState(state: GameState, digit: Digit): GameState {
  const cell = state.selectedCell;
  if (!cell) {
    return {
      ...state,
      message: createMessage("先选择一个空格。")
    };
  }

  const { row, col } = cell;
  if (state.fixed[row][col]) {
    return {
      ...state,
      message: createMessage("题目给定格不可修改。", "warn")
    };
  }

  const board = cloneGrid(state.board);
  board[row][col] = digit;

  return withSolvedState({
    ...state,
    board,
    selectedCell: cell,
    highlightedDigit: null,
    lastFilledCell: cell,
    message: createMessage(`已填入 ${digit}。`)
  });
}

function clearCellState(state: GameState): GameState {
  const cell = state.selectedCell;
  if (!cell) {
    return state;
  }

  const { row, col } = cell;
  if (state.fixed[row][col]) {
    return {
      ...state,
      message: createMessage("题目给定格不可修改。", "warn")
    };
  }

  if (state.board[row][col] === 0) {
    return state;
  }

  const board = cloneGrid(state.board);
  board[row][col] = 0;

  return {
    ...state,
    board,
    highlightedDigit: null,
    lastFilledCell: cell,
    status: "playing",
    message: createMessage("已清除当前格。")
  };
}

function restartGameState(state: GameState): GameState {
  return {
    ...state,
    board: cloneGrid(state.puzzle),
    selectedCell: findFirstEditableCell(state.puzzle, state.puzzle),
    highlightedDigit: null,
    lastFilledCell: null,
    elapsedSeconds: 0,
    status: "playing",
    message: createMessage("已重新开始当前棋盘。")
  };
}

export function getSelectedCellLabel(state: GameState): string {
  if (!state.selectedCell) {
    return "点击一个空格开始。";
  }

  const { row, col } = state.selectedCell;
  const value = state.board[row][col];

  if (value === 0) {
    return `R${row + 1}C${col + 1}`;
  }

  return `R${row + 1}C${col + 1} · ${value}`;
}

export function getFilledCount(state: GameState): number {
  let count = 0;
  for (const row of state.board) {
    for (const value of row) {
      if (value !== 0) {
        count += 1;
      }
    }
  }
  return count;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "setDifficulty":
      return {
        ...state,
        difficulty: action.difficulty
      };

    case "setGenerating":
      return {
        ...state,
        generating: action.generating,
        message: action.message ?? state.message
      };

    case "loadGame":
      return createGameStateFromPayload(action.payload);

    case "replaceState":
      return action.state;

    case "tick":
      if (state.status !== "playing" || state.generating) {
        return state;
      }

      return {
        ...state,
        elapsedSeconds: state.elapsedSeconds + 1
      };

    case "clickCell":
      return clickCellState(state, action.row, action.col);

    case "moveSelection":
      return moveSelectionState(state, action.deltaRow, action.deltaCol);

    case "inputDigit":
      return inputDigitState(state, action.digit);

    case "clearCell":
      return clearCellState(state);

    case "restartGame":
      return restartGameState(state);

    case "clearMessage":
      return {
        ...state,
        message: createMessage("")
      };

    default:
      return state;
  }
}
