export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type GridValue = 0 | Digit;
export type Grid = GridValue[][];
export type BoolGrid = boolean[][];
export type NotesGrid = Digit[][][];

export interface CellPosition {
  row: number;
  col: number;
}

export type Difficulty = "easy" | "medium" | "hard";
export type GameMode = "normal" | "tutorial";
export type GameStatus = "idle" | "playing" | "won";
export type HintHighlightMode = "board-selected" | "observe-digit";

export interface DifficultyDefinition {
  label: string;
  clues: number;
}

export interface PuzzleBundle {
  difficulty: Difficulty;
  seed: number;
  puzzle: Grid;
  solution: Grid;
}

export interface HintDetail {
  row: number;
  col: number;
  value: Digit;
  technique: "裸单" | "隐藏单" | "揭示";
  summary: string;
  steps: string[];
  highlightMode: HintHighlightMode;
}

export interface TutorialLevel {
  id: string;
  title: string;
  technique: string;
  objective: string;
  summary: string;
  steps: string[];
  puzzle: string;
  solution: string;
  guideDigit?: Digit;
}

export interface BoardEvaluation {
  empty: number;
  wrong: number;
  conflicts: Set<string>;
}
