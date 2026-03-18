import {
  DIFFICULTY_CONFIG,
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  cloneGrid,
  cloneNotes,
  gridFromString,
  gridToString,
  isValidGrid,
  isValidNoteGrid,
  isValidSelectedCell,
  isValidTutorialId
} from "../../domain/sudoku";
import type { Difficulty, Digit, GameMode, Grid, NotesGrid } from "../../domain/sudoku";
import type { DigitMode, FocusState, GameLoadPayload, GameState } from "./types";

interface PersistedFocusV4 {
  digitMode: DigitMode;
  cell: { row: number; col: number } | null;
  selectedDigit: Digit | null;
  observedDigit: Digit | null;
}

interface PersistedGameV4 {
  version: 4;
  difficulty: Difficulty;
  seed: number;
  mode: GameMode;
  tutorialId: string | null;
  puzzle: string;
  solution: string;
  board: string;
  notes: number[][][];
  focus: PersistedFocusV4;
  noteMode: boolean;
  mistakes: number;
  elapsedSeconds: number;
  status: "playing" | "won";
}

interface PersistedGameV3 {
  version: 3;
  difficulty: Difficulty;
  seed: number;
  mode: GameMode;
  tutorialId: string | null;
  puzzle: string;
  solution: string;
  board: string;
  notes: number[][][];
  selected: { row: number; col: number } | null;
  interactionMode: "none" | "board-selected" | "observe-digit";
  selectedCell: { row: number; col: number } | null;
  observedDigit: Digit | null;
  noteMode: boolean;
  mistakes: number;
  elapsedSeconds: number;
  status: "playing" | "won";
}

interface PersistedGameV2 {
  version: 2;
  difficulty: Difficulty;
  seed: number;
  mode: GameMode;
  tutorialId: string | null;
  puzzle: string;
  solution: string;
  board: string;
  notes: number[][][];
  selected: { row: number; col: number } | null;
  focusDigit: Digit | null;
  focusScope: "local" | "global" | null;
  noteMode: boolean;
  mistakes: number;
  elapsedSeconds: number;
  status: "playing" | "won";
}

interface LegacyGameV1 {
  difficulty: Difficulty;
  puzzle: Grid;
  solution: Grid;
  board: Grid;
  notes: number[][][];
  selected: { row: number; col: number } | null;
  focusDigit: Digit | null;
  focusScope: "local" | "global" | null;
  noteMode: boolean;
  mistakes: number;
  elapsedSeconds: number;
  status: "playing" | "won";
  mode: GameMode;
  tutorialId: string | null;
}

function isValidDigit(value: unknown): value is Digit | null {
  return value === null || (typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 9);
}

function isValidDigitMode(value: unknown): value is DigitMode {
  return value === "input" || value === "observe";
}

function isValidLegacyFocusScope(value: unknown): value is "local" | "global" | null {
  return value === null || value === "local" || value === "global";
}

function isValidLegacyInteractionMode(
  value: unknown
): value is "none" | "board-selected" | "observe-digit" {
  return value === "none" || value === "board-selected" || value === "observe-digit";
}

function normalizeFocus(focus: FocusState): FocusState {
  return {
    digitMode: focus.digitMode,
    cell: focus.cell ? { ...focus.cell } : null,
    selectedDigit: focus.digitMode === "input" ? focus.selectedDigit : null,
    observedDigit: focus.digitMode === "observe" ? focus.observedDigit : null
  };
}

function deriveFocusFromLegacy(
  selected: { row: number; col: number } | null,
  selectedCell: { row: number; col: number } | null,
  focusDigit: Digit | null,
  focusScope: "local" | "global" | null,
  interactionMode?: "none" | "board-selected" | "observe-digit"
): FocusState {
  const digitMode: DigitMode =
    interactionMode === "observe-digit" || focusScope === "global" ? "observe" : "input";

  return normalizeFocus({
    digitMode,
    cell: selected ?? selectedCell ?? null,
    selectedDigit: digitMode === "input" ? focusDigit : null,
    observedDigit: digitMode === "observe" ? focusDigit : null
  });
}

function parsePersistedV4(payload: unknown): GameLoadPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as PersistedGameV4;
  const puzzle = gridFromString(candidate.puzzle, true);
  const solution = gridFromString(candidate.solution, false);
  const board = gridFromString(candidate.board, true);

  if (
    candidate.version !== 4 ||
    !(candidate.difficulty in DIFFICULTY_CONFIG) ||
    !Number.isInteger(candidate.seed) ||
    candidate.seed < 1 ||
    !puzzle ||
    !solution ||
    !board ||
    !isValidNoteGrid(candidate.notes) ||
    !candidate.focus ||
    !isValidDigitMode(candidate.focus.digitMode) ||
    !isValidSelectedCell(candidate.focus.cell) ||
    !isValidDigit(candidate.focus.selectedDigit) ||
    !isValidDigit(candidate.focus.observedDigit) ||
    typeof candidate.noteMode !== "boolean" ||
    !Number.isInteger(candidate.mistakes) ||
    candidate.mistakes < 0 ||
    !Number.isInteger(candidate.elapsedSeconds) ||
    candidate.elapsedSeconds < 0 ||
    (candidate.status !== "playing" && candidate.status !== "won") ||
    (candidate.mode !== "normal" && candidate.mode !== "tutorial") ||
    !(candidate.tutorialId === null || isValidTutorialId(candidate.tutorialId))
  ) {
    return null;
  }

  return {
    difficulty: candidate.difficulty,
    seed: candidate.seed,
    puzzle,
    solution,
    board,
    notes: cloneNotes(candidate.notes as NotesGrid),
    focus: normalizeFocus(candidate.focus),
    noteMode: candidate.noteMode,
    mistakes: candidate.mistakes,
    elapsedSeconds: candidate.elapsedSeconds,
    status: candidate.status,
    mode: candidate.mode,
    tutorialId: candidate.mode === "tutorial" ? candidate.tutorialId : null
  };
}

function parsePersistedV3(payload: unknown): GameLoadPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as PersistedGameV3;
  const puzzle = gridFromString(candidate.puzzle, true);
  const solution = gridFromString(candidate.solution, false);
  const board = gridFromString(candidate.board, true);

  if (
    candidate.version !== 3 ||
    !(candidate.difficulty in DIFFICULTY_CONFIG) ||
    !Number.isInteger(candidate.seed) ||
    candidate.seed < 1 ||
    !puzzle ||
    !solution ||
    !board ||
    !isValidNoteGrid(candidate.notes) ||
    !isValidSelectedCell(candidate.selected) ||
    !isValidLegacyInteractionMode(candidate.interactionMode) ||
    !isValidSelectedCell(candidate.selectedCell) ||
    !isValidDigit(candidate.observedDigit) ||
    typeof candidate.noteMode !== "boolean" ||
    !Number.isInteger(candidate.mistakes) ||
    candidate.mistakes < 0 ||
    !Number.isInteger(candidate.elapsedSeconds) ||
    candidate.elapsedSeconds < 0 ||
    (candidate.status !== "playing" && candidate.status !== "won") ||
    (candidate.mode !== "normal" && candidate.mode !== "tutorial") ||
    !(candidate.tutorialId === null || isValidTutorialId(candidate.tutorialId))
  ) {
    return null;
  }

  return {
    difficulty: candidate.difficulty,
    seed: candidate.seed,
    puzzle,
    solution,
    board,
    notes: cloneNotes(candidate.notes as NotesGrid),
    focus: deriveFocusFromLegacy(
      candidate.selected,
      candidate.selectedCell,
      candidate.observedDigit,
      candidate.interactionMode === "observe-digit" ? "global" : null,
      candidate.interactionMode
    ),
    noteMode: candidate.noteMode,
    mistakes: candidate.mistakes,
    elapsedSeconds: candidate.elapsedSeconds,
    status: candidate.status,
    mode: candidate.mode,
    tutorialId: candidate.mode === "tutorial" ? candidate.tutorialId : null
  };
}

function parsePersistedV2(payload: unknown): GameLoadPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as PersistedGameV2;
  const puzzle = gridFromString(candidate.puzzle, true);
  const solution = gridFromString(candidate.solution, false);
  const board = gridFromString(candidate.board, true);

  if (
    candidate.version !== 2 ||
    !(candidate.difficulty in DIFFICULTY_CONFIG) ||
    !Number.isInteger(candidate.seed) ||
    candidate.seed < 1 ||
    !puzzle ||
    !solution ||
    !board ||
    !isValidNoteGrid(candidate.notes) ||
    !isValidSelectedCell(candidate.selected) ||
    !isValidLegacyFocusScope(candidate.focusScope) ||
    !isValidDigit(candidate.focusDigit) ||
    typeof candidate.noteMode !== "boolean" ||
    !Number.isInteger(candidate.mistakes) ||
    candidate.mistakes < 0 ||
    !Number.isInteger(candidate.elapsedSeconds) ||
    candidate.elapsedSeconds < 0 ||
    (candidate.status !== "playing" && candidate.status !== "won") ||
    (candidate.mode !== "normal" && candidate.mode !== "tutorial") ||
    !(candidate.tutorialId === null || isValidTutorialId(candidate.tutorialId))
  ) {
    return null;
  }

  return {
    difficulty: candidate.difficulty,
    seed: candidate.seed,
    puzzle,
    solution,
    board,
    notes: cloneNotes(candidate.notes as NotesGrid),
    focus: deriveFocusFromLegacy(candidate.selected, null, candidate.focusDigit, candidate.focusScope),
    noteMode: candidate.noteMode,
    mistakes: candidate.mistakes,
    elapsedSeconds: candidate.elapsedSeconds,
    status: candidate.status,
    mode: candidate.mode,
    tutorialId: candidate.mode === "tutorial" ? candidate.tutorialId : null
  };
}

function parseLegacyV1(payload: unknown): GameLoadPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as LegacyGameV1;

  if (
    !(candidate.difficulty in DIFFICULTY_CONFIG) ||
    !isValidGrid(candidate.puzzle, true) ||
    !isValidGrid(candidate.solution, false) ||
    !isValidGrid(candidate.board, true) ||
    !isValidNoteGrid(candidate.notes) ||
    !isValidSelectedCell(candidate.selected) ||
    !isValidLegacyFocusScope(candidate.focusScope) ||
    !isValidDigit(candidate.focusDigit) ||
    typeof candidate.noteMode !== "boolean" ||
    !Number.isInteger(candidate.mistakes) ||
    candidate.mistakes < 0 ||
    !Number.isInteger(candidate.elapsedSeconds) ||
    candidate.elapsedSeconds < 0 ||
    (candidate.status !== "playing" && candidate.status !== "won") ||
    (candidate.mode !== "normal" && candidate.mode !== "tutorial") ||
    !(candidate.tutorialId === null || isValidTutorialId(candidate.tutorialId))
  ) {
    return null;
  }

  return {
    difficulty: candidate.difficulty,
    seed: 1,
    puzzle: cloneGrid(candidate.puzzle),
    solution: cloneGrid(candidate.solution),
    board: cloneGrid(candidate.board),
    notes: cloneNotes(candidate.notes as NotesGrid),
    focus: deriveFocusFromLegacy(candidate.selected, null, candidate.focusDigit, candidate.focusScope),
    noteMode: candidate.noteMode,
    mistakes: candidate.mistakes,
    elapsedSeconds: candidate.elapsedSeconds,
    status: candidate.status,
    mode: candidate.mode,
    tutorialId: candidate.mode === "tutorial" ? candidate.tutorialId : null
  };
}

export function loadPersistedGame(): GameLoadPayload | null {
  try {
    const modern = window.localStorage.getItem(STORAGE_KEY);
    if (modern) {
      const parsed = JSON.parse(modern);
      return parsePersistedV4(parsed) ?? parsePersistedV3(parsed) ?? parsePersistedV2(parsed);
    }

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      return parseLegacyV1(JSON.parse(legacy));
    }
  } catch (error) {
    console.warn("Failed to load saved game.", error);
  }

  return null;
}

export function savePersistedGame(state: GameState): void {
  if (state.status !== "playing" && state.status !== "won") {
    return;
  }

  const payload: PersistedGameV4 = {
    version: 4,
    difficulty: state.difficulty,
    seed: state.seed,
    mode: state.mode,
    tutorialId: state.mode === "tutorial" ? state.tutorialId : null,
    puzzle: gridToString(state.puzzle),
    solution: gridToString(state.solution),
    board: gridToString(state.board),
    notes: cloneNotes(state.notes),
    focus: normalizeFocus(state.focus),
    noteMode: state.noteMode,
    mistakes: state.mistakes,
    elapsedSeconds: state.elapsedSeconds,
    status: state.status
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Failed to save game.", error);
  }
}
