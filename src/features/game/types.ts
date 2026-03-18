import type {
  BoolGrid,
  CellPosition,
  Difficulty,
  Digit,
  GameStatus,
  Grid
} from "../../domain/sudoku";

export type MessageTone = "info" | "success" | "warn";

export interface MessageState {
  text: string;
  tone: MessageTone;
}

export interface GameState {
  difficulty: Difficulty;
  seed: number;
  puzzle: Grid;
  solution: Grid;
  board: Grid;
  fixed: BoolGrid;
  selectedCell: CellPosition | null;
  highlightedDigit: Digit | null;
  lastFilledCell: CellPosition | null;
  elapsedSeconds: number;
  status: GameStatus;
  generating: boolean;
  message: MessageState;
}

export interface GameLoadPayload {
  difficulty: Difficulty;
  seed: number;
  puzzle: Grid;
  solution: Grid;
  board?: Grid;
  selectedCell?: CellPosition | null;
  elapsedSeconds?: number;
  status?: Extract<GameStatus, "playing" | "won">;
  message?: MessageState;
}
