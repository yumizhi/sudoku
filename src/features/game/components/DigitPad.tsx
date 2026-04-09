import { DIGITS } from "../../../domain/sudoku";
import type { Digit } from "../../../domain/sudoku";
import type { GameState } from "../types";

interface DigitPadProps {
  state: GameState;
  selectionLabel: string;
  filledCount: number;
  showPeerHighlights: boolean;
  onTogglePeerHighlights: () => void;
  onDigitClick: (digit: Digit) => void;
  onClear: () => void;
}

export function DigitPad({
  state,
  selectionLabel,
  filledCount,
  showPeerHighlights,
  onTogglePeerHighlights,
  onDigitClick,
  onClear
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">当前焦点</div>
          <div className="mt-1 truncate text-base font-semibold text-slate-950">{selectionLabel}</div>
          <div className="mt-1 text-xs text-slate-500">点按录入，也支持方向键与数字键输入。</div>
        </div>
        <span className="status-badge border-sky-100 bg-sky-50/80 text-sky-700 shadow-none">{filledCount}/81</span>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={showPeerHighlights}
        className="panel-muted flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:border-sky-200 hover:bg-sky-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/35"
        onClick={onTogglePeerHighlights}
      >
        <span className="min-w-0">
          <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">占线高亮</span>
          <span className="mt-1 block text-sm font-semibold text-slate-900">行 / 列 / 宫辅助定位</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs font-semibold text-slate-500 sm:inline lg:hidden xl:inline">
            {showPeerHighlights ? "已开启" : "已关闭"}
          </span>
          <span className={["toggle-track", showPeerHighlights ? "is-on" : ""].join(" ")} aria-hidden="true">
            <span className="toggle-thumb" />
          </span>
        </span>
      </button>

      <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
        {DIGITS.map((digit) => {
          const complete = counts[digit] >= 9;
          return (
            <button
              key={digit}
              type="button"
              className="digit-button"
              data-complete={complete || undefined}
              disabled={state.generating}
              aria-label={`输入数字 ${digit}`}
              onClick={() => onDigitClick(digit)}
            >
              <div className="text-[1.35rem] font-bold leading-none sm:text-[1.55rem]">{digit}</div>
              <div className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-[0.68rem]">
                {counts[digit]}/9
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="digit-clear"
        disabled={state.generating}
        onClick={onClear}
      >
        清除当前格
      </button>
    </div>
  );
}
