import type { CellPosition, Digit, Grid } from "../../domain/sudoku";

export interface CellHighlight {
  selected: boolean;
  peer: boolean;
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
      const inSameRow = selectedCell ? selectedCell.row === row : false;
      const inSameCol = selectedCell ? selectedCell.col === col : false;
      const inSameBox = selectedCell
        ? Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
          Math.floor(selectedCell.col / 3) === Math.floor(col / 3)
        : false;

      return {
        selected: selectedCell?.row === row && selectedCell?.col === col,
        peer: !!selectedCell && !((selectedCell.row === row && selectedCell.col === col)) && (inSameRow || inSameCol || inSameBox),
        sameDigit: highlightedDigit !== null && board[row][col] === highlightedDigit,
        lastFilled: lastFilledCell?.row === row && lastFilledCell?.col === col
      };
    })
  );
}
