import { boxStart, calculateConflicts, makeCellKey } from "../../domain/sudoku";
import type { BoolGrid, CellPosition, Digit, Grid, NotesGrid } from "../../domain/sudoku";

export interface CellHighlight {
  selected: boolean;
  relatedRowCol: boolean;
  relatedBox: boolean;
  sameNumber: boolean;
  candidateMatch: boolean;
  conflict: boolean;
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
  selectedDigit: Digit | null;
  lastChangedCell: CellPosition | null;
}

export type CellVisualState =
  | "conflict"
  | "selected"
  | "same-number"
  | "related-row-col"
  | "related-box"
  | "candidate-match"
  | "last-modified"
  | "default";

function createEmptyHighlightGrid(): CellHighlight[][] {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({
      selected: false,
      relatedRowCol: false,
      relatedBox: false,
      sameNumber: false,
      candidateMatch: false,
      conflict: false,
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
  selectedDigit,
  lastChangedCell
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

  let focusDigit: Digit | null = null;
  let candidateDigit: Digit | null = null;

  if (selectedCell) {
    markCell(highlights, selectedCell.row, selectedCell.col, "selected");

    for (let index = 0; index < 9; index += 1) {
      if (index !== selectedCell.col) {
        markCell(highlights, selectedCell.row, index, "relatedRowCol");
      }
      if (index !== selectedCell.row) {
        markCell(highlights, index, selectedCell.col, "relatedRowCol");
      }
    }

    const startRow = boxStart(selectedCell.row);
    const startCol = boxStart(selectedCell.col);
    for (let row = startRow; row < startRow + 3; row += 1) {
      for (let col = startCol; col < startCol + 3; col += 1) {
        if (row === selectedCell.row && col === selectedCell.col) {
          continue;
        }
        markCell(highlights, row, col, "relatedBox");
      }
    }

    const selectedValue = board[selectedCell.row][selectedCell.col];
    if (selectedValue !== 0) {
      focusDigit = selectedValue;
    } else {
      focusDigit = selectedDigit;
      candidateDigit = selectedDigit;
    }
  } else {
    focusDigit = selectedDigit;
    candidateDigit = selectedDigit;
  }

  if (focusDigit !== null) {
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        if (board[row][col] === focusDigit) {
          markCell(highlights, row, col, "sameNumber");
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

export function getCellVisualState(highlight: CellHighlight): CellVisualState {
  if (highlight.conflict) {
    return "conflict";
  }
  if (highlight.selected) {
    return "selected";
  }
  if (highlight.sameNumber) {
    return "same-number";
  }
  if (highlight.relatedRowCol) {
    return "related-row-col";
  }
  if (highlight.relatedBox) {
    return "related-box";
  }
  if (highlight.candidateMatch) {
    return "candidate-match";
  }
  if (highlight.lastModified) {
    return "last-modified";
  }
  return "default";
}

export function isCandidateDigitHighlighted(
  notes: Digit[],
  focusDigit: Digit | null,
  highlight: CellHighlight
): boolean {
  return focusDigit !== null && highlight.candidateMatch && notes.includes(focusDigit);
}

export function isCellConflicted(conflicts: Set<string>, row: number, col: number): boolean {
  return conflicts.has(makeCellKey(row, col));
}
