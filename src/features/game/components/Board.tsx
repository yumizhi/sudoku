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

function getCellClasses(
  value: number,
  fixed: boolean,
  highlight: ReturnType<typeof computeHighlights>[number][number]
): { className: string; style: CSSProperties } {
  let backgroundColor = fixed ? "rgb(248 250 252)" : "rgb(255 255 255)";
  let color = fixed ? "rgb(15 23 42)" : "var(--sudoku-user-digit)";
  let boxShadow = "none";

  if (highlight.peer) {
    backgroundColor = fixed ? "rgb(241 245 249)" : "var(--sudoku-user-digit-muted)";
    boxShadow = "inset 0 0 0 1px rgba(var(--sudoku-user-digit-rgb), 0.16)";
  }

  if (highlight.sameDigit) {
    backgroundColor = fixed ? "rgba(var(--sudoku-user-digit-rgb), 0.12)" : "var(--sudoku-user-digit-soft)";
    boxShadow =
      "inset 0 0 0 2px rgba(var(--sudoku-user-digit-rgb), 0.18), 0 12px 18px -18px rgba(var(--sudoku-user-digit-rgb), 0.72)";
  }

  if (highlight.lastFilled && !highlight.selected) {
    boxShadow = "inset 0 0 0 2px rgba(var(--sudoku-user-digit-rgb), 0.26)";
  }

  if (highlight.selected) {
    backgroundColor = value === 0 ? "rgba(var(--sudoku-user-digit-rgb), 0.12)" : "var(--sudoku-user-digit-strong)";
    boxShadow =
      "inset 0 0 0 2px rgba(var(--sudoku-user-digit-rgb), 0.28), 0 0 0 1px var(--sudoku-user-digit-ring), 0 18px 28px -24px var(--sudoku-user-digit-shadow)";
  }

  return {
    className:
      "grid aspect-square place-items-center border border-slate-300 font-semibold leading-none transition-[background-color,box-shadow,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-800/45",
    style: {
      backgroundColor,
      color,
      boxShadow
    }
  };
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
      className="mx-auto overflow-hidden rounded-[1.4rem] border border-slate-300 bg-slate-300 p-[4px] shadow-[0_22px_60px_-28px_rgba(15,23,42,0.45)]"
      style={{ width: size, height: size, maxWidth: "100%", maxHeight: "100%" }}
    >
      <div role="grid" aria-label="Sudoku 棋盘" className="grid h-full w-full grid-cols-9 overflow-hidden rounded-[1.1rem] bg-slate-300">
        {state.board.map((rowValues, row) =>
          rowValues.map((value, col) => {
            const isSelected = state.selectedCell?.row === row && state.selectedCell?.col === col;
            const highlight = highlights[row][col];
            const presentation = getCellClasses(value, state.fixed[row][col], highlight);

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
                className={presentation.className}
                disabled={state.generating}
                style={{
                  fontSize: `clamp(1.02rem, ${Math.max(size * 0.05, 1)}px, 2rem)`,
                  ...presentation.style,
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
