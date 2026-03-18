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
  shellRef: RefObject<HTMLDivElement>;
  headerRef: RefObject<HTMLElement>;
  controlsRef: RefObject<HTMLElement>;
  boardSize: number;
} {
  const shellRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const controlsRef = useRef<HTMLElement>(null);
  const [boardSize, setBoardSize] = useState(320);

  useEffect(() => {
    const shell = shellRef.current;
    const header = headerRef.current;
    const controls = controlsRef.current;
    if (!shell) {
      return;
    }

    const calculate = (): void => {
      const shellRect = shell.getBoundingClientRect();
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      const controlsRect = controls?.getBoundingClientRect();
      const controlsWidth = controlsRect?.width ?? 0;
      const controlsHeight = controlsRect?.height ?? 0;
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      const gap = desktop ? 16 : 12;

      const widthLimit = desktop ? shellRect.width - controlsWidth - gap : shellRect.width;
      const heightLimit = desktop
        ? shellRect.height - headerHeight - gap
        : shellRect.height - headerHeight - controlsHeight - gap * 2;

      const nextSize = Math.max(220, Math.floor(Math.min(widthLimit, heightLimit)));
      setBoardSize(nextSize);
    };

    calculate();

    const observer = new ResizeObserver(calculate);
    observer.observe(shell);
    if (header) observer.observe(header);
    if (controls) observer.observe(controls);
    window.addEventListener("resize", calculate);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", calculate);
    };
  }, []);

  return { shellRef, headerRef, controlsRef, boardSize };
}

export default function App(): JSX.Element {
  const { state, dispatch, startNewGame } = useSudokuGame();
  const { shellRef, headerRef, controlsRef, boardSize } = useBoardSize();

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

  function handleDigitClick(digit: Digit): void {
    dispatch({ type: "inputDigit", digit });
  }

  return (
    <div className="h-dvh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(148,163,184,0.16),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)]">
      <main ref={shellRef} className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3 p-3 sm:gap-4 sm:p-4">
        <header ref={headerRef} className="panel-surface flex flex-wrap items-center justify-between gap-2.5 px-3 py-3 sm:px-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">Sudoku</h1>
              <span className={["rounded-full border px-2.5 py-1 text-xs font-semibold", statusToneClass].join(" ")}>
                {statusLabel}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                {formatTime(state.elapsedSeconds)}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-slate-600">{headerMessage}</p>
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

        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-4">
          <section className="panel-surface flex min-h-0 flex-1 items-center justify-center p-2.5 sm:p-4">
            <Board
              size={boardSize}
              state={state}
              onSelectCell={(row, col) => dispatch({ type: "clickCell", row, col })}
            />
          </section>

          <aside
            ref={controlsRef}
            className="panel-surface flex shrink-0 flex-col gap-3 px-3 py-3 sm:px-4 lg:w-[18.5rem] lg:py-4"
          >
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">选中</div>
                <div className="mt-1 font-semibold text-slate-900">{selectionLabel}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">输入</div>
                <div className="mt-1 font-semibold text-slate-900">键盘 + 点按</div>
              </div>
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
