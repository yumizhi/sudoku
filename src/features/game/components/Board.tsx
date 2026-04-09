import { useEffect } from "react";
import { computeHighlights } from "../highlights";
import type { GameState } from "../types";

interface BoardProps {
  state: GameState;
  size: number;
  onSelectCell: (row: number, col: number) => void;
}

function makeCellAriaLabel(state: GameState, row: number, col: number): string {
  const value = state.board[row][col];
  const base = `第 ${row + 1} 行，第 ${col + 1} 列`;

  if (value !== 0) {
    return state.fixed[row][col] ? `${base}，题目给定数字 ${value}` : `${base}，当前数字 ${value}`;
  }

  return `${base}，空格`;
}

export function Board({ state, size, onSelectCell }: BoardProps): JSX.Element {
  const highlights = computeHighlights({
    board: state.board,
    selectedCell: state.selectedCell,
    highlightedDigit: state.highlightedDigit,
    showPeerHighlights: state.showPeerHighlights,
    lastFilledCell: state.lastFilledCell
  });

  useEffect(() => {
    if (!state.selectedCell) {
      return;
    }

    const element = document.querySelector<HTMLButtonElement>(
      `[data-row="${state.selectedCell.row}"][data-col="${state.selectedCell.col}"]`
    );
    element?.focus({ preventScroll: true });
  }, [state.selectedCell]);

  const blockIndices = Array.from({ length: 9 }, (_, index) => index);
  const blockGap = Math.max(6, Math.round(size * 0.015));
  const cellFontSize = `clamp(1rem, ${Math.max(size * 0.048, 1)}px, 2.15rem)`;

  return (
    <div
      className="sudoku-board mx-auto"
      style={{ width: size, height: size, maxWidth: "100%" }}
    >
      <div
        role="grid"
        aria-label="Sudoku 棋盘"
        className="sudoku-grid-shell"
        style={{ gap: blockGap }}
      >
        {blockIndices.map((blockIndex) => {
          const blockRow = Math.floor(blockIndex / 3);
          const blockCol = blockIndex % 3;
          const startRow = blockRow * 3;
          const startCol = blockCol * 3;
          const blockActive =
            state.selectedCell &&
            Math.floor(state.selectedCell.row / 3) === blockRow &&
            Math.floor(state.selectedCell.col / 3) === blockCol;

          return (
            <div key={blockIndex} className="sudoku-block" data-active-block={blockActive || undefined}>
              {Array.from({ length: 9 }, (_, cellIndex) => {
                const row = startRow + Math.floor(cellIndex / 3);
                const col = startCol + (cellIndex % 3);
                const value = state.board[row][col];
                const isSelected = state.selectedCell?.row === row && state.selectedCell?.col === col;
                const highlight = highlights[row][col];

                return (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    role="gridcell"
                    aria-rowindex={row + 1}
                    aria-colindex={col + 1}
                    aria-selected={isSelected}
                    aria-label={makeCellAriaLabel(state, row, col)}
                    tabIndex={isSelected ? 0 : -1}
                    data-row={row}
                    data-col={col}
                    data-filled={value !== 0}
                    data-fixed={state.fixed[row][col]}
                    data-selected={highlight.selected || undefined}
                    data-row-peer={highlight.rowPeer || undefined}
                    data-col-peer={highlight.colPeer || undefined}
                    data-box-peer={highlight.boxPeer || undefined}
                    data-same-digit={highlight.sameDigit || undefined}
                    data-last-filled={highlight.lastFilled && !highlight.selected ? true : undefined}
                    className="sudoku-cell"
                    disabled={state.generating}
                    style={{ fontSize: cellFontSize }}
                    onClick={() => onSelectCell(row, col)}
                  >
                    {value !== 0 ? value : null}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
