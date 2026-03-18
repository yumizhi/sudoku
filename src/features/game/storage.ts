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
import type { Difficulty, Digit, FocusScope, GameMode, Grid, NotesGrid } from "../../domain/sudoku";
import type { GameLoadPayload, GameState } from "./types";

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
  focusScope: FocusScope | null;
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
  focusScope: FocusScope | null;
  noteMode: boolean;
  mistakes: number;
  elapsedSeconds: number;
  status: "playing" | "won";
  mode: GameMode;
  tutorialId: string | null;
}

function isValidFocusScope(value: unknown): value is FocusScope | null {
  return value === null || value === "local" || value === "global";
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
    !isValidFocusScope(candidate.focusScope) ||
    !(candidate.focusDigit === null || (Number.isInteger(candidate.focusDigit) && candidate.focusDigit >= 1 && candidate.focusDigit <= 9)) ||
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
    selected: candidate.selected,
    focusDigit: candidate.focusDigit,
    focusScope: candidate.focusScope,
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
    !isValidFocusScope(candidate.focusScope) ||
    !(candidate.focusDigit === null || (Number.isInteger(candidate.focusDigit) && candidate.focusDigit >= 1 && candidate.focusDigit <= 9)) ||
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
    selected: candidate.selected,
    focusDigit: candidate.focusDigit,
    focusScope: candidate.focusScope,
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
      return parsePersistedV2(JSON.parse(modern));
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

  const payload: PersistedGameV2 = {
    version: 2,
    difficulty: state.difficulty,
    seed: state.seed,
    mode: state.mode,
    tutorialId: state.mode === "tutorial" ? state.tutorialId : null,
    puzzle: gridToString(state.puzzle),
    solution: gridToString(state.solution),
    board: gridToString(state.board),
    notes: cloneNotes(state.notes),
    selected: state.selected ? { ...state.selected } : null,
    focusDigit: state.focusDigit,
    focusScope: state.focusScope,
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
