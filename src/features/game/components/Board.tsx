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

function getCellClasses(
  value: number,
  fixed: boolean,
  highlight: ReturnType<typeof computeHighlights>[number][number]
): { className: string; boxShadow?: string } {
  let background = fixed ? "bg-slate-50" : "bg-white";
  let text = "text-slate-900";
  let boxShadow = "";

  if (highlight.peer) {
    background = fixed ? "bg-slate-100" : "bg-sky-50/90";
    boxShadow = "inset 0 0 0 1px rgba(125, 211, 252, 0.38)";
  }

  if (highlight.sameDigit) {
    background = fixed ? "bg-cyan-100" : "bg-cyan-200/80";
    text = "text-slate-950";
    boxShadow = "inset 0 0 0 2px rgba(8, 145, 178, 0.18), 0 10px 18px -16px rgba(8, 145, 178, 0.92)";
  }

  if (highlight.lastFilled && !highlight.selected) {
    boxShadow = "inset 0 0 0 2px rgba(14, 165, 233, 0.24)";
  }

  if (highlight.selected) {
    background = value === 0 ? "bg-sky-100" : "bg-sky-200/90";
    text = "text-slate-950";
    boxShadow =
      "inset 0 0 0 2px rgba(3, 105, 161, 0.28), 0 0 0 1px rgba(2, 132, 199, 0.72), 0 18px 28px -24px rgba(2, 132, 199, 0.95)";
  }

  return {
    className: [
      "grid aspect-square place-items-center border border-slate-300 font-semibold leading-none transition-[background-color,box-shadow,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70",
      background,
      text
    ].join(" "),
    boxShadow
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
                  boxShadow: presentation.boxShadow,
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
