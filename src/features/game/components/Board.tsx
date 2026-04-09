import { useEffect } from "react";
import type { CSSProperties } from "react";
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

  return (
    <div
      className="sudoku-board mx-auto overflow-hidden rounded-[1.55rem] border p-[4px]"
      style={{ width: size, height: size, maxWidth: "100%" }}
    >
      <div
        role="grid"
        aria-label="Sudoku 棋盘"
        className="grid h-full w-full grid-cols-9 overflow-hidden rounded-[1.2rem] bg-slate-300/90"
      >
        {state.board.map((rowValues, row) =>
          rowValues.map((value, col) => {
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
                style={{
                  fontSize: `clamp(1.02rem, ${Math.max(size * 0.05, 1)}px, 2.05rem)`,
                  borderTopWidth: row === 0 || row % 3 === 0 ? "2px" : "1px",
                  borderLeftWidth: col === 0 || col % 3 === 0 ? "2px" : "1px",
                  borderRightWidth: (col + 1) % 3 === 0 ? "2px" : "1px",
                  borderBottomWidth: (row + 1) % 3 === 0 ? "2px" : "1px"
                }}
                onClick={() => onSelectCell(row, col)}
              >
                {value !== 0 ? value : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
