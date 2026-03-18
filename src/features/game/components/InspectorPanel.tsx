import type { Digit } from "../../../domain/sudoku";
import { describeSelectedCell } from "../gameReducer";
import type { GameState } from "../types";

interface InspectorPanelProps {
  state: GameState;
  onCandidateInspect: (digit: Digit) => void;
  onGlobalInspect: (digit: Digit) => void;
}

export function InspectorPanel({
  state,
  onCandidateInspect,
  onGlobalInspect
}: InspectorPanelProps): JSX.Element {
  const detail = describeSelectedCell(state);
  const activeGlobalDigit = state.focusScope === "global" ? state.focusDigit : null;
  const activeLocalDigit = state.focusScope === "local" ? state.focusDigit : null;

  return (
    <section className="panel-surface flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">当前格</p>
          <h2 className="mt-2 font-display text-2xl text-slate-900">{detail.title}</h2>
        </div>
        <span className="soft-chip">
          {state.noteMode ? "笔记模式" : state.mode === "tutorial" ? "教程" : "对局"}
        </span>
      </div>

      <p className="text-sm leading-6 text-slate-600">{detail.summary}</p>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">候选</h3>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            当前格
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {detail.candidates.length > 0 ? (
            detail.candidates.map((digit) => (
              <button
                key={digit}
                type="button"
                className={[
                  "rounded-2xl border px-3 py-3 text-sm font-bold transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-tide/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
                  activeLocalDigit === digit
                    ? "border-tide/40 bg-tide/10 text-tide"
                    : "border-slate-200 bg-white/80 text-slate-700 hover:border-tide/25"
                ].join(" ")}
                disabled={state.generating}
                onClick={() => onCandidateInspect(digit)}
              >
                {digit}
              </button>
            ))
          ) : (
            <div className="col-span-3 rounded-2xl border border-dashed border-slate-200 bg-white/50 px-4 py-5 text-center text-sm text-slate-500">
              选中空格后显示候选。
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">全局观察</h3>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {activeGlobalDigit ? `数字 ${activeGlobalDigit}` : "关闭"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }, (_, index) => {
            const digit = (index + 1) as Digit;
            return (
              <button
                key={digit}
                type="button"
                className={[
                  "rounded-2xl border px-3 py-3 text-sm font-extrabold transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-tide/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
                  activeGlobalDigit === digit
                    ? "border-tide/40 bg-tide/10 text-tide"
                    : "border-slate-200 bg-white/80 text-slate-700 hover:border-tide/25"
                ].join(" ")}
                disabled={state.generating}
                onClick={() => onGlobalInspect(digit)}
              >
                {digit}
              </button>
            );
          })}
        </div>
      </div>

    </section>
  );
}
