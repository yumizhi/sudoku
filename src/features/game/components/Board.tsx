import { useEffect } from "react";
import {
  boxStart,
  calculateConflicts,
  getCandidates,
  isPeer,
  makeCellKey
} from "../../../domain/sudoku";
import type { Digit } from "../../../domain/sudoku";
import type { GameState } from "../types";

interface BoardProps {
  state: GameState;
  onSelectCell: (row: number, col: number) => void;
  suppressSelectionHighlight?: boolean;
}

function makeCellAriaLabel(state: GameState, row: number, col: number): string {
  const value = state.board[row][col];
  const base = `第 ${row + 1} 行，第 ${col + 1} 列`;
  if (value !== 0) {
    return state.fixed[row][col] ? `${base}，题目给定数字 ${value}` : `${base}，当前数字 ${value}`;
  }
  if (state.notes[row][col].length > 0) {
    return `${base}，笔记 ${state.notes[row][col].join(" ")}`;
  }
  return `${base}，空格`;
}

function renderNotes(notes: Digit[]): JSX.Element {
  const noteSet = new Set(notes);
  return (
    <div className="grid h-full w-full grid-cols-3 gap-px p-1 text-[clamp(0.45rem,0.8vw,0.72rem)] font-semibold text-slate-500">
      {Array.from({ length: 9 }, (_, index) => {
        const digit = (index + 1) as Digit;
        return (
          <span key={digit} className="grid place-items-center">
            {noteSet.has(digit) ? digit : ""}
          </span>
        );
      })}
    </div>
  );
}

export function Board({
  state,
  onSelectCell,
  suppressSelectionHighlight = false
}: BoardProps): JSX.Element {
  const conflicts = calculateConflicts(state.board);
  const selected = state.selected;
  const selectedValue = selected ? state.board[selected.row][selected.col] : 0;
  const hasDigitFocus = state.focusDigit !== null;
  const hasLocalDigitPreview =
    hasDigitFocus &&
    state.focusScope === "local" &&
    selected !== null &&
    !state.fixed[selected.row][selected.col] &&
    selectedValue === 0;
  const hasGlobalDigitFocus = hasDigitFocus && state.focusScope === "global";
  const hasCellLineFocus = !suppressSelectionHighlight && !hasDigitFocus && selectedValue !== 0;
  const occupiedRows = new Set<number>();
  const occupiedCols = new Set<number>();
  const occupiedBoxes = new Set<string>();

  if (hasGlobalDigitFocus && state.focusDigit !== null) {
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        if (state.board[row][col] === state.focusDigit) {
          occupiedRows.add(row);
          occupiedCols.add(col);
          occupiedBoxes.add(`${boxStart(row)}-${boxStart(col)}`);
        }
      }
    }
  }

  useEffect(() => {
    if (!selected) {
      return;
    }

    const element = document.querySelector<HTMLButtonElement>(
      `[data-row="${selected.row}"][data-col="${selected.col}"]`
    );
    element?.focus({ preventScroll: true });
  }, [selected]);

  return (
    <div className="board-grid mx-auto w-full max-w-[42rem] rounded-[2rem] border border-slate-300/80 bg-slate-300 p-[6px] shadow-board lg:max-w-[min(42rem,calc(100dvh-11rem))]">
      <div
        role="grid"
        aria-label="Sudoku 棋盘"
        className="grid aspect-square grid-cols-9 overflow-hidden rounded-[1.6rem] bg-slate-300"
      >
        {state.board.map((rowValues, row) =>
          rowValues.map((value, col) => {
            const isSelected = selected?.row === row && selected?.col === col;
            const isFixed = state.fixed[row][col];
            const isConflict = conflicts.has(makeCellKey(row, col));
            const isMistake =
              state.showValidation &&
              !isFixed &&
              value !== 0 &&
              value !== state.solution[row][col];
            const isRelated =
              selected !== null &&
              (((hasCellLineFocus && !suppressSelectionHighlight) || hasLocalDigitPreview) &&
                isPeer(selected.row, selected.col, row, col));
            const isSameValue = hasCellLineFocus && value !== 0 && value === selectedValue;
            const candidateMatch =
              hasGlobalDigitFocus &&
              value === 0 &&
              state.focusDigit !== null &&
              getCandidates(state.board, row, col).includes(state.focusDigit);
            const isBlockedByObservedLine =
              hasGlobalDigitFocus &&
              value === 0 &&
              !candidateMatch &&
              (occupiedRows.has(row) ||
                occupiedCols.has(col) ||
                occupiedBoxes.has(`${boxStart(row)}-${boxStart(col)}`));
            const isDigitMatch =
              (hasLocalDigitPreview &&
                selected !== null &&
                !(row === selected.row && col === selected.col) &&
                value !== 0 &&
                value === state.focusDigit &&
                isPeer(selected.row, selected.col, row, col)) ||
              (hasGlobalDigitFocus && value !== 0 && value === state.focusDigit);

            let toneClass = isFixed ? "bg-stone-100 text-slate-900" : "bg-white text-tide";
            let borderClass = "border-slate-300";
            let ringClass = "";

            if (isBlockedByObservedLine) {
              toneClass = "bg-[#edf4ff] text-slate-700";
            }

            if (isRelated) {
              toneClass = "bg-[#dbe9fb] text-slate-900";
            }

            if (candidateMatch) {
              toneClass = "bg-[#dbe9fb] text-slate-900";
              borderClass = "border-[#8ebcff]";
              ringClass = "ring-1 ring-inset ring-[#8ebcff]";
            }

            if (isDigitMatch || isSameValue) {
              toneClass = "bg-[#2489f0] text-white";
              borderClass = "border-[#2489f0]";
              ringClass = "";
            }

            if (isSelected && value === 0) {
              toneClass = "bg-[#cfe2fb] text-slate-900";
              borderClass = "border-[#6f98e9]";
              ringClass = "ring-2 ring-inset ring-[#6f98e9]";
            }

            if (isSelected && value !== 0) {
              toneClass = "bg-[#79a9ff] text-white";
              borderClass = "border-[#6f98e9]";
              ringClass = "ring-2 ring-inset ring-[#6f98e9]";
            }

            if (hasLocalDigitPreview && isSelected) {
              toneClass = "bg-[#cfe2fb] text-slate-900";
            }

            if (isConflict) {
              toneClass = "bg-ember/20 text-ember";
              borderClass = "border-slate-300";
              ringClass = "";
            } else if (isMistake) {
              toneClass = "bg-ember/10 text-ember";
              borderClass = "border-slate-300";
              ringClass = "";
            }

            const classes = [
              "relative grid aspect-square place-items-center border text-[clamp(1rem,2.2vw,1.65rem)] font-bold leading-none transition-colors duration-150 focus:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tide/60",
              toneClass,
              borderClass,
              ringClass
            ].join(" ");

            return (
              <button
                key={`${row}-${col}`}
                type="button"
                role="gridcell"
                aria-rowindex={row + 1}
                aria-colindex={col + 1}
                aria-selected={isSelected}
                aria-invalid={isConflict || isMistake}
                aria-label={makeCellAriaLabel(state, row, col)}
                tabIndex={isSelected ? 0 : -1}
                data-row={row}
                data-col={col}
                className={classes}
                disabled={state.generating}
                style={{
                  borderTopWidth: row === 0 || row % 3 === 0 ? "2px" : "1px",
                  borderLeftWidth: col === 0 || col % 3 === 0 ? "2px" : "1px",
                  borderRightWidth: (col + 1) % 3 === 0 ? "2px" : "1px",
                  borderBottomWidth: (row + 1) % 3 === 0 ? "2px" : "1px"
                }}
                onClick={() => onSelectCell(row, col)}
              >
                {value !== 0 ? value : state.notes[row][col].length > 0 ? renderNotes(state.notes[row][col]) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
