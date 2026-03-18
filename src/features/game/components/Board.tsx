import { useEffect } from "react";
import { calculateConflicts, makeCellKey } from "../../../domain/sudoku";
import type { Digit } from "../../../domain/sudoku";
import type { GameState } from "../types";

interface BoardProps {
  state: GameState;
  onSelectCell: (row: number, col: number) => void;
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
  onSelectCell
}: BoardProps): JSX.Element {
  const conflicts = calculateConflicts(state.board);
  const selected = state.selected;
  const boardSelectedCell = state.interactionMode === "board-selected" ? state.selectedCell : null;
  const boardSelectedDigit =
    boardSelectedCell !== null ? state.board[boardSelectedCell.row][boardSelectedCell.col] : null;
  const observedDigit = state.interactionMode === "observe-digit" ? state.observedDigit : null;
  const interactionDigit = observedDigit ?? boardSelectedDigit;

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
            const isBoardSelectedSource = boardSelectedCell?.row === row && boardSelectedCell?.col === col;
            const isSameValue = interactionDigit !== null && value !== 0 && value === interactionDigit;

            let toneClass = isFixed ? "bg-stone-100 text-slate-900" : "bg-white text-tide";
            let borderClass = "border-slate-300";
            let ringClass = "";

            if (isSameValue) {
              toneClass = "bg-[#2489f0] text-white";
              borderClass = "border-[#2489f0]";
            }

            if (isSelected && value === 0) {
              toneClass = "bg-[#eef5ff] text-slate-900";
              borderClass = "border-[#7ea6ec]";
              ringClass = "ring-2 ring-inset ring-[#7ea6ec]";
            }

            if (isSelected && value !== 0) {
              if (isBoardSelectedSource || state.interactionMode !== "observe-digit") {
                toneClass = "bg-[#79a9ff] text-white";
                borderClass = "border-[#6f98e9]";
              }
              ringClass = "ring-2 ring-inset ring-[#6f98e9]";
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
