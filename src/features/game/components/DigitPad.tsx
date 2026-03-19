import { DIGITS } from "../../../domain/sudoku";
import type { Digit } from "../../../domain/sudoku";
import type { GameState } from "../types";

interface DigitPadProps {
  state: GameState;
  onDigitClick: (digit: Digit) => void;
  onClear: () => void;
}

export function DigitPad({ state, onDigitClick, onClear }: DigitPadProps): JSX.Element {
  const counts = Array.from({ length: 10 }, () => 0);
  for (const row of state.board) {
    for (const value of row) {
      if (value > 0) {
        counts[value] += 1;
      }
    }
  }

  return (
    <div className="grid gap-2.5">
      <div className="grid grid-cols-5 gap-2 md:grid-cols-3">
        {DIGITS.map((digit) => {
          const complete = counts[digit] >= 9;
          return (
            <button
              key={digit}
              type="button"
              className={[
                "rounded-[1.35rem] border px-2 py-2.5 text-center transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 md:px-3 md:py-3",
                complete
                  ? "border-slate-300 bg-slate-100 text-slate-500"
                  : "border-slate-200 bg-white text-slate-900 shadow-sm hover:border-sky-200 hover:bg-sky-50"
              ].join(" ")}
              disabled={state.generating}
              aria-label={`输入数字 ${digit}`}
              onClick={() => onDigitClick(digit)}
            >
              <div className="text-[1.45rem] font-bold leading-none md:text-[1.7rem]">{digit}</div>
              <div className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-500 md:text-[0.68rem]">
                {counts[digit]}/9
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 md:py-3"
        disabled={state.generating}
        onClick={onClear}
      >
        清除当前格
      </button>
    </div>
  );
}
