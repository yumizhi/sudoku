import type { Digit } from "../../../domain/sudoku";
import type { GameState } from "../types";

interface DigitPadProps {
  activeDigit: Digit | null;
  mode: "input" | "observe";
  state: GameState;
  onDigitClick: (digit: Digit) => void;
  onModeChange: (mode: "input" | "observe") => void;
}

export function DigitPad({
  activeDigit,
  mode,
  state,
  onDigitClick,
  onModeChange
}: DigitPadProps): JSX.Element {
  const counts = Array.from({ length: 10 }, () => 0);
  for (const row of state.board) {
    for (const value of row) {
      if (value > 0) {
        counts[value] += 1;
      }
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2 rounded-[1.2rem] border border-slate-200 bg-slate-50 p-1.5">
        <button
          type="button"
          className={[
            "rounded-[0.95rem] px-3 py-2 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tide/50",
            mode === "input" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
          ].join(" ")}
          onClick={() => onModeChange("input")}
        >
          填入
        </button>
        <button
          type="button"
          className={[
            "rounded-[0.95rem] px-3 py-2 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tide/50",
            mode === "observe" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
          ].join(" ")}
          onClick={() => onModeChange("observe")}
        >
          观察
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {Array.from({ length: 9 }, (_, index) => {
          const digit = (index + 1) as Digit;
          const complete = counts[digit] === 9;
          const active = mode === "observe" && activeDigit === digit;
          return (
            <button
              key={digit}
              type="button"
              className={[
                "group rounded-[1rem] border px-2 py-2.5 text-center shadow-sm transition duration-150 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-tide/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:px-2.5 sm:py-3",
                active
                  ? "border-tide/40 bg-tide/10 text-tide"
                  : complete
                    ? "border-pine/30 bg-pine/10 text-pine"
                    : "border-slate-200 bg-white/80 text-slate-900 hover:border-tide/25 hover:bg-tide/5"
              ].join(" ")}
              disabled={state.generating}
              onClick={() => onDigitClick(digit)}
            >
              <div className="text-[1.2rem] font-black leading-none sm:text-[1.4rem]">{digit}</div>
              <div className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {counts[digit]}/9
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
