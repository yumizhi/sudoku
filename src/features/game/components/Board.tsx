import { useEffect } from "react";
import { makeCellKey } from "../../../domain/sudoku";
import type { Digit } from "../../../domain/sudoku";
import {
  computeHighlights,
  isCandidateDigitHighlighted
} from "../highlights";
import {
  getCandidateFocusDigit,
  getFocusDigit
} from "../gameReducer";
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

function renderNotes(
  notes: Digit[],
  emphasizedDigit: Digit | null,
  emphasizeDigit: boolean
): JSX.Element {
  const noteSet = new Set(notes);
  return (
    <div className="grid h-full w-full grid-cols-3 gap-px p-1 text-[clamp(0.45rem,0.8vw,0.72rem)] font-semibold text-slate-500">
      {Array.from({ length: 9 }, (_, index) => {
        const digit = (index + 1) as Digit;
        const active = emphasizeDigit && emphasizedDigit === digit && noteSet.has(digit);
        return (
          <span
            key={digit}
            className={[
              "grid place-items-center rounded-[0.32rem] transition-colors",
              active ? "bg-[#2489f0] text-white" : ""
            ].join(" ")}
          >
            {noteSet.has(digit) ? digit : ""}
          </span>
        );
      })}
    </div>
  );
}

function buildCellClasses(
  value: number,
  fixed: boolean,
  highlight: ReturnType<typeof computeHighlights>["cells"][number][number]
): string {
  let toneClass = fixed ? "bg-stone-100 text-slate-900" : "bg-white text-tide";
  let borderClass = "border-slate-300";
  let effectClass = "";

  if (highlight.peerBox) {
    toneClass = fixed ? "bg-stone-50 text-slate-900" : "bg-[#f6faff] text-slate-900";
  }

  if (highlight.peerRowCol) {
    toneClass = fixed ? "bg-stone-100 text-slate-900" : "bg-[#edf4ff] text-slate-900";
  }

  if (highlight.sameDigit) {
    toneClass = value === 0 ? "bg-[#e5f0ff] text-slate-900" : "bg-[#d6e8ff] text-slate-900";
  }

  if (highlight.candidateMatch && value === 0) {
    toneClass = "bg-[#f2f8ff] text-slate-900";
    effectClass = "shadow-[inset_0_0_0_1px_rgba(36,137,240,0.35)]";
  }

  if (highlight.lastModified && !highlight.selected) {
    effectClass = "shadow-[inset_0_0_0_1px_rgba(36,137,240,0.18)]";
  }

  if (highlight.checkError) {
    borderClass = "border-ember";
    toneClass = value === 0 ? "bg-[#fff5f4] text-ember" : "bg-[#fff0ee] text-ember";
  }

  if (highlight.conflict) {
    borderClass = "border-ember";
    toneClass = value === 0 ? "bg-[#ffeceb] text-ember" : "bg-[#ffe3e1] text-ember";
  }

  if (highlight.selected) {
    toneClass = value === 0 ? "bg-[#eef6ff] text-slate-900" : "bg-[#cfe2ff] text-slate-900";
    effectClass = "ring-2 ring-inset ring-[#1f6ed5]";
  }

  return [
    "relative grid aspect-square place-items-center border text-[clamp(1rem,2.2vw,1.65rem)] font-bold leading-none transition-colors duration-150 focus:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tide/60",
    toneClass,
    borderClass,
    effectClass
  ].join(" ");
}

export function Board({
  state,
  onSelectCell
}: BoardProps): JSX.Element {
  const selected = state.focus.cell;
  const validationErrors = new Set<string>();
  if (state.showValidation) {
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        const value = state.board[row][col];
        if (!state.fixed[row][col] && value !== 0 && value !== state.solution[row][col]) {
          validationErrors.add(makeCellKey(row, col));
        }
      }
    }
  }

  const focusDigit = getFocusDigit(state);
  const candidateDigit = getCandidateFocusDigit(state);
  const highlightState = computeHighlights({
    board: state.board,
    fixed: state.fixed,
    notes: state.notes,
    selectedCell: selected,
    focusDigit,
    candidateDigit,
    lastChangedCell: state.lastChangedCell,
    validationErrors
  });

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
            const highlight = highlightState.cells[row][col];
            const emphasizeCandidateDigit = isCandidateDigitHighlighted(
              state.notes[row][col],
              highlightState.candidateDigit,
              highlight
            );

            return (
              <button
                key={`${row}-${col}`}
                type="button"
                role="gridcell"
                aria-rowindex={row + 1}
                aria-colindex={col + 1}
                aria-selected={isSelected}
                aria-invalid={highlight.conflict || highlight.checkError}
                aria-label={makeCellAriaLabel(state, row, col)}
                tabIndex={isSelected ? 0 : -1}
                data-row={row}
                data-col={col}
                className={buildCellClasses(value, state.fixed[row][col], highlight)}
                disabled={state.generating}
                style={{
                  borderTopWidth: row === 0 || row % 3 === 0 ? "2px" : "1px",
                  borderLeftWidth: col === 0 || col % 3 === 0 ? "2px" : "1px",
                  borderRightWidth: (col + 1) % 3 === 0 ? "2px" : "1px",
                  borderBottomWidth: (row + 1) % 3 === 0 ? "2px" : "1px"
                }}
                onClick={() => onSelectCell(row, col)}
              >
                {value !== 0
                  ? value
                  : state.notes[row][col].length > 0
                    ? renderNotes(
                        state.notes[row][col],
                        highlightState.candidateDigit,
                        emphasizeCandidateDigit
                      )
                    : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
