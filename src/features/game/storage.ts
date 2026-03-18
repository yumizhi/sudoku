import { STORAGE_KEY, cloneGrid, gridFromString, gridToString } from "../../domain/sudoku";
import type { Difficulty } from "../../domain/sudoku";
import type { GameLoadPayload, GameState } from "./types";

interface PersistedGameV5 {
  version: 5;
  difficulty: Difficulty;
  seed: number;
  puzzle: string;
  solution: string;
  board: string;
  selectedCell: { row: number; col: number } | null;
  elapsedSeconds: number;
  status: "playing" | "won";
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === "easy" || value === "medium" || value === "hard";
}

function isCell(value: unknown): value is { row: number; col: number } | null {
  return (
    value === null ||
    (typeof value === "object" &&
      value !== null &&
      Number.isInteger((value as { row: number }).row) &&
      (value as { row: number }).row >= 0 &&
      (value as { row: number }).row < 9 &&
      Number.isInteger((value as { col: number }).col) &&
      (value as { col: number }).col >= 0 &&
      (value as { col: number }).col < 9)
  );
}

export function loadPersistedGame(): GameLoadPayload | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedGameV5;
    const puzzle = gridFromString(parsed.puzzle, true);
    const solution = gridFromString(parsed.solution, false);
    const board = gridFromString(parsed.board, true);

    if (
      parsed.version !== 5 ||
      !isDifficulty(parsed.difficulty) ||
      !Number.isInteger(parsed.seed) ||
      parsed.seed < 1 ||
      !puzzle ||
      !solution ||
      !board ||
      !isCell(parsed.selectedCell) ||
      !Number.isInteger(parsed.elapsedSeconds) ||
      parsed.elapsedSeconds < 0 ||
      (parsed.status !== "playing" && parsed.status !== "won")
    ) {
      return null;
    }

    return {
      difficulty: parsed.difficulty,
      seed: parsed.seed,
      puzzle,
      solution,
      board,
      selectedCell: parsed.selectedCell,
      elapsedSeconds: parsed.elapsedSeconds,
      status: parsed.status
    };
  } catch (error) {
    console.warn("Failed to load persisted Sudoku game.", error);
    return null;
  }
}

export function savePersistedGame(state: GameState): void {
  try {
    const payload: PersistedGameV5 = {
      version: 5,
      difficulty: state.difficulty,
      seed: state.seed,
      puzzle: gridToString(state.puzzle),
      solution: gridToString(state.solution),
      board: gridToString(state.board),
      selectedCell: state.selectedCell,
      elapsedSeconds: state.elapsedSeconds,
      status: state.status === "won" ? "won" : "playing"
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Failed to save Sudoku game.", error);
  }
}

export function clearPersistedGame(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function clonePersistedBoard(state: GameState): GameLoadPayload {
  return {
    difficulty: state.difficulty,
    seed: state.seed,
    puzzle: cloneGrid(state.puzzle),
    solution: cloneGrid(state.solution),
    board: cloneGrid(state.board),
    selectedCell: state.selectedCell,
    elapsedSeconds: state.elapsedSeconds,
    status: state.status === "won" ? "won" : "playing"
  };
}
