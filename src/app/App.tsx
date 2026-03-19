import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { DIFFICULTY_CONFIG } from "../domain/sudoku";
import type { Difficulty, Digit } from "../domain/sudoku";
import {
  formatTime,
  getFilledCount,
  getSelectedCellLabel
} from "../features/game/gameReducer";
import { Board } from "../features/game/components/Board";
import { DigitPad } from "../features/game/components/DigitPad";
import { useSudokuGame } from "../features/game/useSudokuGame";

function useBoardSize(): {
  boardAreaRef: RefObject<HTMLDivElement>;
  boardSize: number;
} {
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(320);

  useEffect(() => {
    const boardArea = boardAreaRef.current;
    if (!boardArea) {
      return;
    }

    const calculate = (): void => {
      const rect = boardArea.getBoundingClientRect();
      const nextSize = Math.max(0, Math.floor(Math.min(rect.width, rect.height)));
      setBoardSize(nextSize);
    };

    calculate();

    const observer = new ResizeObserver(calculate);
    observer.observe(boardArea);
    window.addEventListener("resize", calculate);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", calculate);
    };
  }, []);

  return { boardAreaRef, boardSize };
}

export default function App(): JSX.Element {
  const { state, dispatch, startNewGame } = useSudokuGame();
  const { boardAreaRef, boardSize } = useBoardSize();

  const filledCount = getFilledCount(state);
  const selectionLabel = getSelectedCellLabel(state);
  const statusLabel = state.status === "won" ? "已完成" : `${filledCount}/81`;
  const statusToneClass =
    state.status === "won"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-white text-slate-700";

  const headerMessage = useMemo(() => {
    if (state.message.text) {
      return state.message.text;
    }

    if (state.status === "won") {
      return "已完成，开始新游戏继续。";
    }

    return "选择空格后，可用键盘或下方数字键填入。";
  }, [state.message.text, state.status]);
  const peerHighlightLabel = state.showPeerHighlights ? "已开启" : "已关闭";

  function handleDigitClick(digit: Digit): void {
    dispatch({ type: "inputDigit", digit });
  }

  return (
    <div className="h-dvh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(148,163,184,0.16),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)]">
      <main className="mx-auto grid h-full w-full max-w-[92rem] grid-rows-[auto_minmax(0,1fr)] gap-3 p-3 sm:gap-4 sm:p-4">
        <header className="panel-surface flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-3.5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">数独</h1>
              <span className={["rounded-full border px-2.5 py-1 text-xs font-semibold", statusToneClass].join(" ")}>
                {statusLabel}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                {formatTime(state.elapsedSeconds)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 md:truncate">{headerMessage}</p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
              <span className="text-xs uppercase tracking-[0.16em] text-slate-500">难度</span>
              <select
                value={state.difficulty}
                disabled={state.generating}
                className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
                onChange={(event) =>
                  dispatch({
                    type: "setDifficulty",
                    difficulty: event.target.value as Difficulty
                  })
                }
              >
                {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={state.generating}
              onClick={() => startNewGame()}
            >
              新游戏
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={state.generating}
              onClick={() => dispatch({ type: "restartGame" })}
            >
              重开
            </button>
          </div>
        </header>

        <div className="grid min-h-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_clamp(15rem,28vw,18rem)] md:gap-4">
          <section className="panel-surface min-h-0 p-2 sm:p-3 lg:p-4">
            <div ref={boardAreaRef} className="flex h-full w-full items-center justify-center">
              <Board
                size={boardSize}
                state={state}
                onSelectCell={(row, col) => dispatch({ type: "clickCell", row, col })}
              />
            </div>
          </section>

          <aside className="panel-surface flex min-h-0 flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
            <div className="rounded-[1.4rem] border border-slate-200 bg-white/95 px-3 py-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">选中</div>
                  <div className="mt-1 truncate text-base font-semibold text-slate-950">{selectionLabel}</div>
                  <div className="mt-1 text-xs text-slate-500">键盘数字、方向键与点按都可用。</div>
                </div>
                <span className="shrink-0 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-cyan-700">
                  同数字自动高亮
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={state.showPeerHighlights}
                className="mt-3 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70"
                onClick={() => dispatch({ type: "togglePeerHighlights" })}
              >
                <span>
                  <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">占线高亮</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-900">行 / 列 / 宫辅助定位</span>
                </span>
                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    state.showPeerHighlights
                      ? "bg-sky-600 text-white shadow-[0_10px_20px_-16px_rgba(2,132,199,0.95)]"
                      : "border border-slate-200 bg-white text-slate-600"
                  ].join(" ")}
                >
                  {peerHighlightLabel}
                </span>
              </button>
            </div>

            <DigitPad
              state={state}
              onDigitClick={handleDigitClick}
              onClear={() => dispatch({ type: "clearCell" })}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
