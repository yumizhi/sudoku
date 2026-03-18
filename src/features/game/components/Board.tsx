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
): string {
  let background = fixed ? "bg-slate-100 text-slate-900" : "bg-white text-slate-900";
  let shadow = "";

  if (highlight.peer) {
    background = fixed ? "bg-slate-100 text-slate-900" : "bg-sky-50 text-slate-900";
  }

  if (highlight.sameDigit) {
    background = value === 0 ? "bg-sky-100 text-slate-900" : "bg-sky-200 text-slate-950";
  }

  if (highlight.lastFilled && !highlight.selected) {
    shadow = "shadow-[inset_0_0_0_2px_rgba(14,165,233,0.15)]";
  }

  if (highlight.selected) {
    background = value === 0 ? "bg-sky-100 text-slate-950" : "bg-sky-200 text-slate-950";
    shadow = "ring-2 ring-inset ring-sky-600";
  }

  return [
    "grid aspect-square place-items-center border border-slate-300 font-semibold leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70",
    background,
    shadow
  ].join(" ");
}

export function Board({ state, size, onSelectCell }: BoardProps): JSX.Element {
  const highlights = computeHighlights({
    board: state.board,
    selectedCell: state.selectedCell,
    highlightedDigit: state.highlightedDigit,
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
                className={getCellClasses(value, state.fixed[row][col], highlight)}
                disabled={state.generating}
                style={{
                  fontSize: `clamp(1rem, ${Math.max(size * 0.045, 1)}px, 1.85rem)`,
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
