import type {
  BoolGrid,
  CellPosition,
  Difficulty,
  Digit,
  GameStatus,
  Grid,
  NotesGrid
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
  notes: NotesGrid;
  fixed: BoolGrid;
  selectedCell: CellPosition | null;
  highlightedDigit: Digit | null;
  notesMode: boolean;
  lastFilledCell: CellPosition | null;
  elapsedSeconds: number;
  status: GameStatus;
  generating: boolean;
  message: MessageState;
  undoStack: UndoSnapshot[];
}

export interface UndoSnapshot {
  board: Grid;
  notes: NotesGrid;
  selectedCell: CellPosition | null;
  highlightedDigit: Digit | null;
  lastFilledCell: CellPosition | null;
  status: GameStatus;
}

export interface GameLoadPayload {
  difficulty: Difficulty;
  seed: number;
  puzzle: Grid;
  solution: Grid;
  board?: Grid;
  notes?: NotesGrid;
  selectedCell?: CellPosition | null;
  notesMode?: boolean;
  elapsedSeconds?: number;
  status?: Extract<GameStatus, "playing" | "won">;
  message?: MessageState;
}
