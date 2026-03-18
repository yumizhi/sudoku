import { boxStart, calculateConflicts, makeCellKey } from "../../domain/sudoku";
import type { BoolGrid, CellPosition, Digit, Grid, NotesGrid } from "../../domain/sudoku";

export interface CellHighlight {
  selected: boolean;
  peerRowCol: boolean;
  peerBox: boolean;
  sameDigit: boolean;
  candidateMatch: boolean;
  conflict: boolean;
  checkError: boolean;
  lastModified: boolean;
}

export interface HighlightComputation {
  cells: CellHighlight[][];
  focusDigit: Digit | null;
  candidateDigit: Digit | null;
}

export interface HighlightInput {
  board: Grid;
  fixed: BoolGrid;
  notes: NotesGrid;
  selectedCell: CellPosition | null;
  focusDigit: Digit | null;
  candidateDigit: Digit | null;
  lastChangedCell: CellPosition | null;
  validationErrors?: Set<string>;
}

function createEmptyHighlightGrid(): CellHighlight[][] {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({
      selected: false,
      peerRowCol: false,
      peerBox: false,
      sameDigit: false,
      candidateMatch: false,
      conflict: false,
      checkError: false,
      lastModified: false
    }))
  );
}

function markCell(
  highlights: CellHighlight[][],
  row: number,
  col: number,
  key: keyof CellHighlight
): void {
  highlights[row][col][key] = true;
}

export function computeHighlights({
  board,
  notes,
  selectedCell,
  focusDigit,
  candidateDigit,
  lastChangedCell,
  validationErrors = new Set<string>()
}: HighlightInput): HighlightComputation {
  const highlights = createEmptyHighlightGrid();
  const conflicts = calculateConflicts(board);

  for (const conflictKey of conflicts) {
    const [rowText, colText] = conflictKey.split("-");
    const row = Number(rowText);
    const col = Number(colText);
    if (Number.isInteger(row) && Number.isInteger(col)) {
      markCell(highlights, row, col, "conflict");
    }
  }

  for (const errorKey of validationErrors) {
    const [rowText, colText] = errorKey.split("-");
    const row = Number(rowText);
    const col = Number(colText);
    if (Number.isInteger(row) && Number.isInteger(col)) {
      markCell(highlights, row, col, "checkError");
    }
  }

  if (selectedCell) {
    markCell(highlights, selectedCell.row, selectedCell.col, "selected");

    for (let index = 0; index < 9; index += 1) {
      if (index !== selectedCell.col) {
        markCell(highlights, selectedCell.row, index, "peerRowCol");
      }
      if (index !== selectedCell.row) {
        markCell(highlights, index, selectedCell.col, "peerRowCol");
      }
    }

    const startRow = boxStart(selectedCell.row);
    const startCol = boxStart(selectedCell.col);
    for (let row = startRow; row < startRow + 3; row += 1) {
      for (let col = startCol; col < startCol + 3; col += 1) {
        if (row === selectedCell.row && col === selectedCell.col) {
          continue;
        }
        markCell(highlights, row, col, "peerBox");
      }
    }
  }

  if (focusDigit !== null) {
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        if (board[row][col] === focusDigit) {
          markCell(highlights, row, col, "sameDigit");
        }
      }
    }
  }

  if (candidateDigit !== null) {
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        if (board[row][col] === 0 && notes[row][col].includes(candidateDigit)) {
          markCell(highlights, row, col, "candidateMatch");
        }
      }
    }
  }

  if (lastChangedCell) {
    markCell(highlights, lastChangedCell.row, lastChangedCell.col, "lastModified");
  }

  return {
    cells: highlights,
    focusDigit,
    candidateDigit
  };
}

export function isCandidateDigitHighlighted(
  notes: Digit[],
  candidateDigit: Digit | null,
  highlight: CellHighlight
): boolean {
  return candidateDigit !== null && highlight.candidateMatch && notes.includes(candidateDigit);
}

export function isCellConflicted(conflicts: Set<string>, row: number, col: number): boolean {
  return conflicts.has(makeCellKey(row, col));
}
