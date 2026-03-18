import {
  HISTORY_LIMIT,
  clearPeerNotes,
  cloneGrid,
  cloneNotes,
  deriveFixedGrid,
  evaluateBoard,
  findHint,
  makeBoolGrid,
  makeGrid,
  makeNoteGrid,
  toggleNote
} from "../../domain/sudoku";
import type { CellPosition, Difficulty, Digit } from "../../domain/sudoku";
import type {
  DigitMode,
  FocusState,
  GameLoadPayload,
  GameState,
  HistorySnapshot,
  MessageState
} from "./types";

type GameAction =
  | { type: "setDifficulty"; difficulty: Difficulty }
  | { type: "setGenerating"; generating: boolean; message?: MessageState }
  | { type: "loadGame"; payload: GameLoadPayload }
  | { type: "replaceState"; state: GameState }
  | { type: "tick" }
  | { type: "selectCell"; row: number; col: number }
  | { type: "moveSelection"; deltaRow: number; deltaCol: number }
  | { type: "toggleNoteMode"; forceValue?: boolean }
  | { type: "setDigitMode"; mode: DigitMode }
  | { type: "pressDigit"; digit: Digit }
  | { type: "inputDigit"; digit: Digit; fromHint?: boolean }
  | { type: "eraseCell" }
  | { type: "requestHint" }
  | { type: "dismissHint" }
  | { type: "applyHint" }
  | { type: "checkBoard" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "clearMessage" };

function createMessage(text: string, tone: MessageState["tone"] = "info"): MessageState {
  return { text, tone };
}

function findDefaultSelectedCell(
  puzzle: GameLoadPayload["puzzle"],
  board: GameLoadPayload["puzzle"]
): CellPosition {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (board[row][col] === 0) {
        return { row, col };
      }
    }
  }

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (puzzle[row][col] === 0) {
        return { row, col };
      }
    }
  }

  return { row: 0, col: 0 };
}

function cloneFocus(focus: FocusState): FocusState {
  return {
    digitMode: focus.digitMode,
    cell: focus.cell ? { ...focus.cell } : null,
    selectedDigit: focus.selectedDigit,
    observedDigit: focus.observedDigit
  };
}

function normalizeFocusState(focus: FocusState): FocusState {
  return {
    digitMode: focus.digitMode,
    cell: focus.cell ? { ...focus.cell } : null,
    selectedDigit: focus.digitMode === "input" ? focus.selectedDigit : null,
    observedDigit: focus.digitMode === "observe" ? focus.observedDigit : null
  };
}

function createDefaultFocus(puzzle: GameLoadPayload["puzzle"], board: GameLoadPayload["puzzle"]): FocusState {
  return {
    digitMode: "input",
    cell: findDefaultSelectedCell(puzzle, board),
    selectedDigit: null,
    observedDigit: null
  };
}

function createFocusFromPayload(
  payload: GameLoadPayload,
  board: GameLoadPayload["puzzle"]
): FocusState {
  const fallback = createDefaultFocus(payload.puzzle, board);
  const legacyDigitMode: DigitMode =
    payload.interactionMode === "observe-digit" ? "observe" : "input";
  const cell = payload.focus?.cell ?? payload.selected ?? payload.selectedCell ?? fallback.cell;

  return normalizeFocusState({
    digitMode: payload.focus?.digitMode ?? legacyDigitMode,
    cell,
    selectedDigit: payload.focus?.selectedDigit ?? payload.selectedDigit ?? null,
    observedDigit: payload.focus?.observedDigit ?? payload.observedDigit ?? null
  });
}

export function getExplicitFocusDigit(state: GameState): Digit | null {
  return state.focus.digitMode === "observe" ? state.focus.observedDigit : state.focus.selectedDigit;
}

export function getFocusDigit(state: GameState): Digit | null {
  const cell = state.focus.cell;
  if (cell) {
    const value = state.board[cell.row][cell.col];
    if (value !== 0) {
      return value as Digit;
    }
  }

  return getExplicitFocusDigit(state);
}

export function getCandidateFocusDigit(state: GameState): Digit | null {
  const cell = state.focus.cell;
  if (cell && state.board[cell.row][cell.col] !== 0) {
    return null;
  }

  return getExplicitFocusDigit(state);
}

function makeSnapshot(state: GameState): HistorySnapshot {
  return {
    board: cloneGrid(state.board),
    notes: cloneNotes(state.notes),
    focus: cloneFocus(state.focus),
    lastChangedCell: state.lastChangedCell ? { ...state.lastChangedCell } : null,
    noteMode: state.noteMode,
    mistakes: state.mistakes,
    status: state.status
  };
}

function restoreSnapshot(state: GameState, snapshot: HistorySnapshot): GameState {
  return {
    ...state,
    board: cloneGrid(snapshot.board),
    notes: cloneNotes(snapshot.notes),
    focus: cloneFocus(snapshot.focus),
    lastChangedCell: snapshot.lastChangedCell ? { ...snapshot.lastChangedCell } : null,
    noteMode: snapshot.noteMode,
    mistakes: snapshot.mistakes,
    status: snapshot.status,
    pendingHint: null,
    showValidation: false
  };
}

function pushHistory(state: GameState): GameState {
  const history = [...state.history, makeSnapshot(state)];
  if (history.length > HISTORY_LIMIT) {
    history.shift();
  }

  return {
    ...state,
    history,
    future: []
  };
}

function finalizeBoardState(nextState: GameState): GameState {
  const result = evaluateBoard(nextState.board, nextState.solution);
  if (result.empty === 0 && result.wrong === 0 && result.conflicts.size === 0) {
    return {
      ...nextState,
      status: "won",
      pendingHint: null,
      message: createMessage(`完成！用时 ${formatTime(nextState.elapsedSeconds)}。`, "success")
    };
  }

  return nextState;
}

function setDigitModeState(state: GameState, mode: DigitMode): GameState {
  if (state.focus.digitMode === mode) {
    return state;
  }

  return {
    ...state,
    focus: normalizeFocusState({
      ...state.focus,
      digitMode: mode,
      selectedDigit: mode === "observe" ? null : state.focus.selectedDigit,
      observedDigit: mode === "input" ? null : state.focus.observedDigit
    })
  };
}

function selectCellState(state: GameState, row: number, col: number): GameState {
  return {
    ...state,
    focus: normalizeFocusState({
      ...state.focus,
      cell: { row, col }
    })
  };
}

function applyDigitPlacement(state: GameState, digit: Digit, fromHint: boolean): GameState {
  const cell = state.focus.cell;
  if (!cell) {
    return {
      ...state,
      focus: normalizeFocusState({
        ...state.focus,
        selectedDigit: state.focus.selectedDigit === digit ? null : digit
      })
    };
  }

  const { row, col } = cell;
  if (state.fixed[row][col]) {
    return fromHint
      ? state
      : {
          ...state,
          message: createMessage("题目给定格不可修改。", "warn")
        };
  }

  if (state.noteMode && !fromHint) {
    if (state.board[row][col] !== 0) {
      return {
        ...state,
        message: createMessage("当前格已有数字，先擦除后再记录笔记。", "warn")
      };
    }

    const withHistory = pushHistory(state);
    const notes = cloneNotes(withHistory.notes);
    toggleNote(notes, row, col, digit);

    return {
      ...withHistory,
      notes,
      focus: normalizeFocusState({
        ...withHistory.focus,
        selectedDigit: digit
      }),
      lastChangedCell: { row, col },
      pendingHint: null,
      message: createMessage(`已切换 ${digit} 的笔记。`)
    };
  }

  if (state.board[row][col] === digit && !fromHint) {
    return {
      ...state,
      focus:
        state.focus.digitMode === "input"
          ? normalizeFocusState({
              ...state.focus,
              selectedDigit: digit
            })
          : cloneFocus(state.focus),
      message: createMessage(`当前格已经是 ${digit}。`)
    };
  }

  const withHistory = pushHistory(state);
  const board = cloneGrid(withHistory.board);
  const notes = cloneNotes(withHistory.notes);
  board[row][col] = digit;
  notes[row][col] = [];
  clearPeerNotes(notes, row, col, digit);

  return finalizeBoardState({
    ...withHistory,
    board,
    notes,
    focus:
      withHistory.focus.digitMode === "input"
        ? normalizeFocusState({
            ...withHistory.focus,
            selectedDigit: digit
          })
        : cloneFocus(withHistory.focus),
    lastChangedCell: { row, col },
    pendingHint: null,
    showValidation: false,
    status: "playing",
    message: fromHint
      ? createMessage(`已应用提示：R${row + 1}C${col + 1} = ${digit}。`)
      : createMessage(`已填入 ${digit}。`)
  });
}

function eraseSelectedCell(state: GameState): GameState {
  const cell = state.focus.cell;
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

  const withHistory = pushHistory(state);
  const board = cloneGrid(withHistory.board);
  const notes = cloneNotes(withHistory.notes);
  board[row][col] = 0;
  notes[row][col] = [];

  return {
    ...withHistory,
    board,
    notes,
    focus: cloneFocus(withHistory.focus),
    lastChangedCell: { row, col },
    pendingHint: null,
    showValidation: false,
    status: "playing",
    message: createMessage("已擦除当前格。")
  };
}

function pressDigitState(state: GameState, digit: Digit): GameState {
  if (state.focus.digitMode === "observe") {
    return {
      ...state,
      focus: normalizeFocusState({
        ...state.focus,
        observedDigit: state.focus.observedDigit === digit ? null : digit
      })
    };
  }

  return applyDigitPlacement(state, digit, false);
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
    notes: makeNoteGrid(),
    focus: {
      digitMode: "input",
      cell: null,
      selectedDigit: null,
      observedDigit: null
    },
    lastChangedCell: null,
    pendingHint: null,
    noteMode: false,
    mistakes: 0,
    elapsedSeconds: 0,
    history: [],
    future: [],
    status: "idle",
    mode: "normal",
    tutorialId: null,
    showValidation: false,
    generating: false,
    message: createMessage("正在准备棋盘…")
  };
}

export function createGameStateFromPayload(payload: GameLoadPayload): GameState {
  const board = payload.board ? cloneGrid(payload.board) : cloneGrid(payload.puzzle);
  const notes = payload.notes ? cloneNotes(payload.notes) : makeNoteGrid();

  return {
    difficulty: payload.difficulty,
    seed: payload.seed,
    puzzle: cloneGrid(payload.puzzle),
    solution: cloneGrid(payload.solution),
    board,
    fixed: deriveFixedGrid(payload.puzzle),
    notes,
    focus: createFocusFromPayload(payload, board),
    lastChangedCell: payload.lastChangedCell ?? null,
    pendingHint: null,
    noteMode: payload.noteMode ?? false,
    mistakes: payload.mistakes ?? 0,
    elapsedSeconds: payload.elapsedSeconds ?? 0,
    history: [],
    future: [],
    status: payload.status ?? "playing",
    mode: payload.mode,
    tutorialId: payload.mode === "tutorial" ? payload.tutorialId : null,
    showValidation: false,
    generating: false,
    message: payload.message ?? createMessage("新棋盘已准备好。")
  };
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

    case "selectCell":
      return selectCellState(state, action.row, action.col);

    case "moveSelection": {
      const current = state.focus.cell ?? { row: 0, col: 0 };
      const row = (current.row + action.deltaRow + 9) % 9;
      const col = (current.col + action.deltaCol + 9) % 9;
      return selectCellState(state, row, col);
    }

    case "toggleNoteMode":
      return {
        ...state,
        noteMode: action.forceValue ?? !state.noteMode,
        message: createMessage((action.forceValue ?? !state.noteMode) ? "笔记模式已开启。" : "笔记模式已关闭。")
      };

    case "setDigitMode":
      return setDigitModeState(state, action.mode);

    case "pressDigit":
      return pressDigitState(state, action.digit);

    case "inputDigit":
      return applyDigitPlacement(state, action.digit, action.fromHint === true);

    case "eraseCell":
      return eraseSelectedCell(state);

    case "requestHint": {
      if (state.status === "won") {
        return {
          ...state,
          message: createMessage("本局已完成，可以直接开始新的一局。", "success")
        };
      }

      const hint = findHint(state.board, state.solution);
      if (!hint) {
        return {
          ...state,
          message: createMessage("当前没有可以提示的空格。")
        };
      }

      return {
        ...state,
        pendingHint: hint,
        focus: normalizeFocusState({
          digitMode: "input",
          cell: { row: hint.row, col: hint.col },
          selectedDigit: hint.value,
          observedDigit: null
        }),
        noteMode: false,
        message: createMessage(`${hint.technique} 已准备好。先看解释，再决定是否应用。`)
      };
    }

    case "dismissHint":
      return {
        ...state,
        pendingHint: null
      };

    case "applyHint":
      return state.pendingHint ? applyDigitPlacement(state, state.pendingHint.value, true) : state;

    case "checkBoard": {
      const result = evaluateBoard(state.board, state.solution);
      if (result.empty === 0 && result.wrong === 0 && result.conflicts.size === 0) {
        return finalizeBoardState({
          ...state,
          showValidation: true
        });
      }

      const progress = Math.round(((81 - result.empty) / 81) * 100);
      return {
        ...state,
        showValidation: true,
        message:
          result.wrong === 0 && result.conflicts.size === 0
            ? createMessage(`检查完成，目前没有显式错误。进度 ${progress}%。`)
            : createMessage("检查完成，已标出冲突或错误。", "warn")
      };
    }

    case "undo": {
      if (state.history.length === 0) {
        return {
          ...state,
          message: createMessage("没有可撤销的操作。")
        };
      }

      const history = [...state.history];
      const previous = history.pop();
      if (!previous) {
        return state;
      }

      const restored = restoreSnapshot(
        {
          ...state,
          history,
          future: [...state.future, makeSnapshot(state)]
        },
        previous
      );

      return {
        ...restored,
        message: createMessage("已撤销一步。")
      };
    }

    case "redo": {
      if (state.future.length === 0) {
        return {
          ...state,
          message: createMessage("没有可重做的操作。")
        };
      }

      const future = [...state.future];
      const next = future.pop();
      if (!next) {
        return state;
      }

      const restored = restoreSnapshot(
        {
          ...state,
          future,
          history: [...state.history, makeSnapshot(state)]
        },
        next
      );

      return {
        ...restored,
        message: createMessage("已重做一步。")
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

export function describeSelectedCell(state: GameState): {
  title: string;
  summary: string;
} {
  if (!state.focus.cell) {
    return {
      title: "未选中",
      summary: "选中一个格子。"
    };
  }

  const { row, col } = state.focus.cell;
  const value = state.board[row][col];
  const fixed = state.fixed[row][col];
  const label = `R${row + 1}C${col + 1}`;

  if (fixed) {
    return {
      title: `${label} 给定`,
      summary: `题目给定 ${value}。`
    };
  }

  if (value !== 0) {
    return {
      title: `${label} 已填`,
      summary: `当前填入 ${value}。`
    };
  }

  return {
    title: `${label} 空格`,
    summary: "空格。"
  };
}

export type { GameAction };
