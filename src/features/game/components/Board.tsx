import { useEffect } from "react";
import type { Digit } from "../../../domain/sudoku";
import {
  computeHighlights,
  getCellVisualState,
  isCandidateDigitHighlighted
} from "../highlights";
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
              "grid place-items-center rounded-[0.32rem]",
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

export function Board({
  state,
  onSelectCell
}: BoardProps): JSX.Element {
  const selected = state.selected;
  const highlightState = computeHighlights({
    board: state.board,
    fixed: state.fixed,
    notes: state.notes,
    selectedCell: state.selected,
    selectedDigit: state.selectedDigit,
    lastChangedCell: state.lastChangedCell
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
            const isFixed = state.fixed[row][col];
            const isMistake =
              state.showValidation &&
              !isFixed &&
              value !== 0 &&
              value !== state.solution[row][col];
            const highlight = highlightState.cells[row][col];
            const visualState = getCellVisualState(highlight);
            const emphasizeCandidateDigit = isCandidateDigitHighlighted(
              state.notes[row][col],
              highlightState.candidateDigit,
              highlight
            );

            let toneClass = isFixed ? "bg-stone-100 text-slate-900" : "bg-white text-tide";
            let borderClass = "border-slate-300";
            let ringClass = "";

            switch (visualState) {
              case "conflict":
                toneClass = "bg-ember/20 text-ember";
                break;
              case "selected":
                toneClass = value === 0 ? "bg-[#eef5ff] text-slate-900" : "bg-[#79a9ff] text-white";
                borderClass = "border-[#6f98e9]";
                ringClass = "ring-2 ring-inset ring-[#6f98e9]";
                break;
              case "same-number":
                toneClass = "bg-[#2489f0] text-white";
                borderClass = "border-[#2489f0]";
                break;
              case "related-row-col":
                toneClass = "bg-[#dbe9fb] text-slate-900";
                break;
              case "related-box":
                toneClass = "bg-[#edf4ff] text-slate-700";
                break;
              case "candidate-match":
                toneClass = "bg-[#edf4ff] text-slate-900";
                borderClass = "border-[#8ebcff]";
                ringClass = "ring-1 ring-inset ring-[#8ebcff]";
                break;
              case "last-modified":
                ringClass = "ring-1 ring-inset ring-[#9dc0ff]";
                break;
              default:
                break;
            }

            if (highlight.conflict) {
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
                aria-invalid={highlight.conflict || isMistake}
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
