import type { CellPosition, Digit, Grid } from "../../domain/sudoku";

export interface CellHighlight {
  selected: boolean;
  sameDigit: boolean;
  lastFilled: boolean;
}

export interface HighlightInput {
  board: Grid;
  selectedCell: CellPosition | null;
  highlightedDigit: Digit | null;
  lastFilledCell: CellPosition | null;
}

export function computeHighlights({
  board,
  selectedCell,
  highlightedDigit,
  lastFilledCell
}: HighlightInput): CellHighlight[][] {
  return Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => {
      const selected = selectedCell?.row === row && selectedCell?.col === col;

      return {
        selected,
        sameDigit: highlightedDigit !== null && board[row][col] === highlightedDigit,
        lastFilled: lastFilledCell?.row === row && lastFilledCell?.col === col
      };
    })
  );
}
