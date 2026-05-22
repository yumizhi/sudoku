import {
  HISTORY_LIMIT,
  cloneGrid,
  cloneNotes,
  clearPeerNotes,
  deriveFixedGrid,
  findHint,
  makeBoolGrid,
  makeGrid,
  makeNoteGrid,
  normalizeNotes,
  toggleNote
} from "../../domain/sudoku";
import type { CellPosition, Digit } from "../../domain/sudoku";
import type { GameLoadPayload, GameState, MessageState, UndoSnapshot } from "./types";

export type GameAction =
  | { type: "setGenerating"; generating: boolean; message?: MessageState }
  | { type: "loadGame"; payload: GameLoadPayload }
  | { type: "replaceState"; state: GameState }
  | { type: "tick" }
  | { type: "clickCell"; row: number; col: number }
  | { type: "moveSelection"; deltaRow: number; deltaCol: number }
  | { type: "inputDigit"; digit: Digit }
  | { type: "clearCell" }
  | { type: "toggleNotesMode" }
  | { type: "undo" }
  | { type: "requestHint" }
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

function createUndoSnapshot(state: GameState): UndoSnapshot {
  return {
    board: cloneGrid(state.board),
    notes: cloneNotes(state.notes),
    selectedCell: state.selectedCell,
    highlightedDigit: state.highlightedDigit,
    lastFilledCell: state.lastFilledCell,
    status: state.status
  };
}

function appendUndo(state: GameState): UndoSnapshot[] {
  return [...state.undoStack, createUndoSnapshot(state)].slice(-HISTORY_LIMIT);
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
    notes: makeNoteGrid(),
    fixed: makeBoolGrid(false),
    selectedCell: null,
    highlightedDigit: null,
    notesMode: false,
    lastFilledCell: null,
    elapsedSeconds: 0,
    status: "idle",
    generating: false,
    message: createMessage("正在准备棋盘…"),
    undoStack: []
  };
}

export function createGameStateFromPayload(payload: GameLoadPayload): GameState {
  const board = payload.board ? cloneGrid(payload.board) : cloneGrid(payload.puzzle);
  const notes = payload.notes ? normalizeNotes(payload.notes) : makeNoteGrid();
  const selectedCell = payload.selectedCell ?? findFirstEditableCell(payload.puzzle, board);
  const selectedValue = selectedCell ? board[selectedCell.row][selectedCell.col] : 0;

  return {
    difficulty: payload.difficulty,
    seed: payload.seed,
    puzzle: cloneGrid(payload.puzzle),
    solution: cloneGrid(payload.solution),
    board,
    notes,
    fixed: deriveFixedGrid(payload.puzzle),
    selectedCell,
    highlightedDigit: selectedValue === 0 ? null : (selectedValue as Digit),
    notesMode: payload.notesMode ?? false,
    lastFilledCell: null,
    elapsedSeconds: payload.elapsedSeconds ?? 0,
    status: payload.status ?? "playing",
    generating: false,
    message: payload.message ?? createMessage("新棋盘已准备好。"),
    undoStack: []
  };
}

function clickCellState(state: GameState, row: number, col: number): GameState {
  const value = state.board[row][col];
  const clickedSameCell = state.selectedCell?.row === row && state.selectedCell?.col === col;

  if (value !== 0 && clickedSameCell && state.highlightedDigit === value) {
    return {
      ...state,
      selectedCell: null,
      highlightedDigit: null
    };
  }

  return {
    ...state,
    selectedCell: { row, col },
    highlightedDigit: value === 0 ? null : (value as Digit)
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

  if (state.notesMode) {
    if (state.board[row][col] !== 0) {
      return {
        ...state,
        message: createMessage("已有数字的格子不能写候选数。", "warn")
      };
    }

    const notes = cloneNotes(state.notes);
    toggleNote(notes, row, col, digit);
    const isAdded = notes[row][col].includes(digit);

    return {
      ...state,
      notes,
      selectedCell: cell,
      highlightedDigit: digit,
      lastFilledCell: null,
      undoStack: appendUndo(state),
      message: createMessage(isAdded ? `已记录候选 ${digit}。` : `已移除候选 ${digit}。`)
    };
  }

  if (state.board[row][col] === digit) {
    return {
      ...state,
      highlightedDigit: digit,
      message: createMessage(`当前格已经是 ${digit}。`)
    };
  }

  const board = cloneGrid(state.board);
  const notes = cloneNotes(state.notes);
  board[row][col] = digit;
  notes[row][col] = [];
  clearPeerNotes(notes, row, col, digit);

  return withSolvedState({
    ...state,
    board,
    notes,
    selectedCell: cell,
    highlightedDigit: digit,
    lastFilledCell: cell,
    undoStack: appendUndo(state),
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

  if (state.board[row][col] === 0 && state.notes[row][col].length === 0) {
    return state;
  }

  const board = cloneGrid(state.board);
  const notes = cloneNotes(state.notes);
  const hadValue = board[row][col] !== 0;
  if (hadValue) {
    board[row][col] = 0;
  } else {
    notes[row][col] = [];
  }

  return {
    ...state,
    board,
    notes,
    highlightedDigit: null,
    lastFilledCell: cell,
    status: "playing",
    undoStack: appendUndo(state),
    message: createMessage(hadValue ? "已清除当前格。" : "已清除当前格笔记。")
  };
}

function undoState(state: GameState): GameState {
  const snapshot = state.undoStack[state.undoStack.length - 1];
  if (!snapshot) {
    return {
      ...state,
      message: createMessage("没有可撤销的操作。")
    };
  }

  return {
    ...state,
    board: cloneGrid(snapshot.board),
    notes: cloneNotes(snapshot.notes),
    selectedCell: snapshot.selectedCell,
    highlightedDigit: snapshot.highlightedDigit,
    lastFilledCell: snapshot.lastFilledCell,
    status: snapshot.status,
    undoStack: state.undoStack.slice(0, -1),
    message: createMessage("已撤销上一步。")
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

    case "toggleNotesMode":
      return {
        ...state,
        notesMode: !state.notesMode,
        message: createMessage(state.notesMode ? "已关闭笔记模式。" : "已开启笔记模式。")
      };

    case "undo":
      return undoState(state);

    case "requestHint": {
      const hint = findHint(state.board, state.solution);
      if (!hint) {
        return {
          ...state,
          message: createMessage("当前棋盘已经没有可提示的空格。", "success")
        };
      }

      return {
        ...state,
        selectedCell: { row: hint.row, col: hint.col },
        highlightedDigit: hint.value,
        message: createMessage(hint.summary)
      };
    }

    case "clearMessage":
      return {
        ...state,
        message: createMessage("")
      };

    default:
      return state;
  }
}
