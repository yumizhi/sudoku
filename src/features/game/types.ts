import type {
  BoolGrid,
  CellPosition,
  Difficulty,
  Digit,
  GameMode,
  GameStatus,
  Grid,
  HintDetail,
  NotesGrid
} from "../../domain/sudoku";

export type MessageTone = "info" | "success" | "warn";

export interface MessageState {
  text: string;
  tone: MessageTone;
}

export type DigitMode = "input" | "observe";

export interface FocusState {
  digitMode: DigitMode;
  cell: CellPosition | null;
  selectedDigit: Digit | null;
  observedDigit: Digit | null;
}

export interface HistorySnapshot {
  board: Grid;
  notes: NotesGrid;
  focus: FocusState;
  lastChangedCell: CellPosition | null;
  noteMode: boolean;
  mistakes: number;
  status: GameStatus;
}

export interface GameState {
  difficulty: Difficulty;
  seed: number;
  puzzle: Grid;
  solution: Grid;
  board: Grid;
  fixed: BoolGrid;
  notes: NotesGrid;
  focus: FocusState;
  lastChangedCell: CellPosition | null;
  pendingHint: HintDetail | null;
  noteMode: boolean;
  mistakes: number;
  elapsedSeconds: number;
  history: HistorySnapshot[];
  future: HistorySnapshot[];
  status: GameStatus;
  mode: GameMode;
  tutorialId: string | null;
  showValidation: boolean;
  generating: boolean;
  message: MessageState;
}

export interface GameLoadPayload {
  difficulty: Difficulty;
  seed: number;
  puzzle: Grid;
  solution: Grid;
  board?: Grid;
  notes?: NotesGrid;
  focus?: Partial<FocusState>;

  // Legacy persisted fields kept for backward-compatible restores.
  selected?: CellPosition | null;
  selectedCell?: CellPosition | null;
  selectedDigit?: Digit | null;
  observedDigit?: Digit | null;
  interactionMode?: "none" | "board-selected" | "observe-digit";
  lastChangedCell?: CellPosition | null;
  noteMode?: boolean;
  mistakes?: number;
  elapsedSeconds?: number;
  status?: Extract<GameStatus, "playing" | "won">;
  mode: GameMode;
  tutorialId: string | null;
  message?: MessageState;
}
