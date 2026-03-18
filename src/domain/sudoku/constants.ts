import type { Difficulty, DifficultyDefinition, Digit } from "./types";

export const GRID_SIZE = 9;
export const BOX_SIZE = 3;
export const HISTORY_LIMIT = 240;
export const STORAGE_KEY = "sudoku-studio-state-v2";
export const LEGACY_STORAGE_KEY = "sudoku-studio-state-v1";
export const DIGITS: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyDefinition> = {
  easy: { label: "简单", clues: 40 },
  medium: { label: "中等", clues: 33 },
  hard: { label: "困难", clues: 28 }
};
