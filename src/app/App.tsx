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
      const nextSize = Math.max(0, Math.floor(rect.width));
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
      : "border-slate-200 bg-slate-50 text-slate-700";

  const headerMessage = useMemo(() => {
    if (state.message.text) {
      return state.message.text;
    }

    if (state.status === "won") {
      return "已完成，开始新游戏继续。";
    }

    return "选择空格后，可用键盘或下方数字键填入。";
  }, [state.message.text, state.status]);
  const headerMessageToneClass =
    state.message.tone === "warn"
      ? "border-amber-200 bg-amber-50/90 text-amber-800"
      : state.status === "won" || state.message.tone === "success"
        ? "border-emerald-200 bg-emerald-50/90 text-emerald-700"
        : "border-sky-100 bg-sky-50/85 text-sky-800";
  function handleDigitClick(digit: Digit): void {
    dispatch({ type: "inputDigit", digit });
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.08),transparent_20%),linear-gradient(180deg,rgba(248,250,252,0.94)_0%,rgba(241,245,249,0.98)_100%)]">
      <main className="mx-auto flex min-h-dvh w-full max-w-[96rem] flex-col gap-2.5 px-3 pb-safe pt-safe sm:gap-4 sm:px-4">
        <header className="panel-surface subtle-enter px-3 py-2.5 sm:px-4 sm:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">数独</h1>
                <span className={["status-badge", statusToneClass].join(" ")}>{statusLabel}</span>
                <span className="status-badge border-slate-200 bg-white/80 text-slate-700">
                  {formatTime(state.elapsedSeconds)}
                </span>
              </div>
              <p
                role="status"
                aria-live="polite"
                className={["mt-2 max-w-3xl rounded-2xl border px-3 py-2 text-sm leading-6", headerMessageToneClass].join(" ")}
              >
                {headerMessage}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center lg:min-w-[24rem]">
              <label className="panel-muted col-span-2 flex items-center justify-between gap-3 px-3 py-2.5 sm:col-span-1">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">难度</span>
                <select
                  value={state.difficulty}
                  disabled={state.generating}
                  className="min-w-0 bg-transparent text-sm font-semibold text-slate-900 outline-none"
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
                className="control-button-primary"
                disabled={state.generating}
                onClick={() => startNewGame()}
              >
                新游戏
              </button>
              <button
                type="button"
                className="control-button"
                disabled={state.generating}
                onClick={() => dispatch({ type: "restartGame" })}
              >
                重开
              </button>
            </div>
          </div>
        </header>

        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_clamp(18.5rem,30vw,23rem)] lg:gap-4">
          <section className="panel-surface subtle-enter p-2.5 sm:p-3 lg:p-4">
            <div ref={boardAreaRef} className="mx-auto w-full max-w-[21.5rem] sm:max-w-[24rem] md:max-w-[31rem] lg:max-w-[42rem]">
              <Board
                size={boardSize}
                state={state}
                onSelectCell={(row, col) => dispatch({ type: "clickCell", row, col })}
              />
            </div>
          </section>

          <aside className="grid gap-3">
            <section className="panel-surface subtle-enter px-3 py-2.5 sm:px-4 sm:py-4">
              <DigitPad
                state={state}
                selectionLabel={selectionLabel}
                filledCount={filledCount}
                showPeerHighlights={state.showPeerHighlights}
                onTogglePeerHighlights={() => dispatch({ type: "togglePeerHighlights" })}
                onDigitClick={handleDigitClick}
                onClear={() => dispatch({ type: "clearCell" })}
              />
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
