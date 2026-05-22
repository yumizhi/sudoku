import { useEffect } from "react";
import { DIGITS } from "../../../domain/sudoku";
import type { Digit } from "../../../domain/sudoku";
import { computeHighlights } from "../highlights";
import type { GameState } from "../types";

interface BoardProps {
  state: GameState;
  size: number;
  labels: {
    grid: string;
    cell: (row: number, col: number, value: number, fixed: boolean, notes: Digit[]) => string;
  };
  onSelectCell: (row: number, col: number) => void;
}

export function Board({ state, size, labels, onSelectCell }: BoardProps): JSX.Element {
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

  const blockIndices = Array.from({ length: 9 }, (_, index) => index);
  const blockGap = Math.min(10, Math.max(7, Math.round(size * 0.016)));
  const cellFontSize = `clamp(1rem, ${Math.max(size * 0.048, 1)}px, 2.15rem)`;

  return (
    <div
      className="sudoku-board mx-auto"
      style={{ width: size, height: size, maxWidth: "100%" }}
    >
      <div
        role="grid"
        aria-label={labels.grid}
        className="sudoku-grid-shell"
        style={{ gap: blockGap }}
      >
        {blockIndices.map((blockIndex) => {
          const blockRow = Math.floor(blockIndex / 3);
          const blockCol = blockIndex % 3;
          const startRow = blockRow * 3;
          const startCol = blockCol * 3;

          return (
            <div key={blockIndex} className="sudoku-block">
              {Array.from({ length: 9 }, (_, cellIndex) => {
                const row = startRow + Math.floor(cellIndex / 3);
                const col = startCol + (cellIndex % 3);
                const value = state.board[row][col];
                const notes = state.notes[row][col];
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
                    aria-label={labels.cell(row, col, value, state.fixed[row][col], notes)}
                    tabIndex={isSelected ? 0 : -1}
                    data-row={row}
                    data-col={col}
                    data-filled={value !== 0}
                    data-has-notes={value === 0 && notes.length > 0}
                    data-fixed={state.fixed[row][col]}
                    data-selected={highlight.selected || undefined}
                    data-same-digit={highlight.sameDigit || undefined}
                    data-last-filled={highlight.lastFilled && !highlight.selected ? true : undefined}
                    className="sudoku-cell"
                    disabled={state.generating}
                    style={{ fontSize: cellFontSize }}
                    onClick={() => onSelectCell(row, col)}
                  >
                    {value !== 0 ? (
                      value
                    ) : notes.length > 0 ? (
                      <span className="sudoku-notes" aria-hidden="true">
                        {DIGITS.map((digit) => (
                          <span key={digit} className="sudoku-note" data-filled={notes.includes(digit) || undefined}>
                            {notes.includes(digit) ? digit : null}
                          </span>
                        ))}
                      </span>
                    ) : null}
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
