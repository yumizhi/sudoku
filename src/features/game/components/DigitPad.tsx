import type { Digit } from "../../../domain/sudoku";
import type { GameState } from "../types";

interface DigitPadProps {
  state: GameState;
  onDigitClick: (digit: Digit) => void;
}

export function DigitPad({ state, onDigitClick }: DigitPadProps): JSX.Element {
  const counts = Array.from({ length: 10 }, () => 0);
  for (const row of state.board) {
    for (const value of row) {
      if (value > 0) {
        counts[value] += 1;
      }
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: 9 }, (_, index) => {
        const digit = (index + 1) as Digit;
        const complete = counts[digit] === 9;
        return (
          <button
            key={digit}
            type="button"
            className={[
              "group rounded-[1.35rem] border px-3 py-4 text-center shadow-sm transition duration-150 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-tide/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:px-4 sm:py-5",
              complete
                ? "border-pine/30 bg-pine/10 text-pine"
                : "border-slate-200 bg-white/80 text-slate-900 hover:border-tide/25 hover:bg-tide/5"
            ].join(" ")}
            disabled={state.generating}
            onClick={() => onDigitClick(digit)}
          >
            <div className="text-[1.55rem] font-black leading-none sm:text-[1.75rem]">{digit}</div>
            <div className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {counts[digit]}/9
            </div>
          </button>
        );
      })}
    </div>
  );
}
