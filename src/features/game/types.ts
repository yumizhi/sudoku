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

export type InteractionMode = "none" | "board-selected" | "observe-digit";

export interface HistorySnapshot {
  board: Grid;
  notes: NotesGrid;
  selected: CellPosition | null;
  interactionMode: InteractionMode;
  selectedCell: CellPosition | null;
  observedDigit: Digit | null;
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
  selected: CellPosition | null;
  interactionMode: InteractionMode;
  selectedCell: CellPosition | null;
  observedDigit: Digit | null;
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
  selected?: CellPosition | null;
  interactionMode?: InteractionMode;
  selectedCell?: CellPosition | null;
  observedDigit?: Digit | null;
  noteMode?: boolean;
  mistakes?: number;
  elapsedSeconds?: number;
  status?: Extract<GameStatus, "playing" | "won">;
  mode: GameMode;
  tutorialId: string | null;
  message?: MessageState;
}
