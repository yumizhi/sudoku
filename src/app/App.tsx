import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { DIFFICULTY_CONFIG, countClues } from "../domain/sudoku";
import type { Digit } from "../domain/sudoku";
import { formatTime, getFilledCount, getSelectedCellLabel } from "../features/game/gameReducer";
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
  const clueCount = countClues(state.puzzle);
  const remainingCount = 81 - filledCount;
  const completionPercent = Math.round((filledCount / 81) * 100);
  const selectionLabel = getSelectedCellLabel(state);
  const difficultyLabel = DIFFICULTY_CONFIG[state.difficulty].label;

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
    <div className="min-h-dvh">
      <main className="mx-auto flex min-h-dvh w-full max-w-[96rem] flex-col gap-2.5 px-3 pb-safe pt-safe sm:gap-4 sm:px-4 lg:px-6">
        <header className="panel-surface subtle-enter px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="atelier-kicker">The Mathematical Atelier</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="font-[Manrope] text-[1.55rem] font-extrabold tracking-[-0.08em] text-[rgb(var(--atelier-ink))] sm:text-[2.5rem]">
                  数独
                </h1>
                <span className="atelier-chip">{state.status === "won" ? "Puzzle Solved" : "Editorial Play"}</span>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3">
              <div className="panel-muted min-w-[6.75rem] px-3 py-2.5 text-right">
                <div className="atelier-kicker">Difficulty</div>
                <div className="mt-1 font-[Manrope] text-lg font-extrabold tracking-[-0.04em] text-[rgb(var(--atelier-primary))] sm:text-xl">
                  {difficultyLabel}
                </div>
              </div>
              <div className="panel-muted min-w-[6.75rem] px-3 py-2.5 text-right">
                <div className="atelier-kicker">Timer</div>
                <div className="mt-1 font-[Manrope] text-lg font-extrabold tracking-[-0.04em] text-[rgb(var(--atelier-ink))] sm:text-xl">
                  {formatTime(state.elapsedSeconds)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_clamp(19rem,28vw,23rem)] xl:gap-4">
          <section className="panel-surface subtle-enter px-3 py-3 sm:px-5 sm:py-5">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,10rem)_minmax(9rem,10rem)]">
              <p
                role="status"
                aria-live="polite"
                data-tone={state.status === "won" ? "success" : state.message.tone}
                className="atelier-message"
              >
                {headerMessage}
              </p>

              <div className="panel-muted hidden flex-col justify-between gap-2 px-3 py-3 sm:flex">
                <div className="atelier-kicker">Completion</div>
                <div className="font-[Manrope] text-[1.55rem] font-extrabold tracking-[-0.05em] text-[rgb(var(--atelier-ink))]">
                  {completionPercent}%
                </div>
                <div className="text-xs font-medium text-[rgba(var(--atelier-muted),0.88)]">
                  已填 {filledCount} / 待填 {remainingCount}
                </div>
                <div className="atelier-progress-track" aria-hidden="true">
                  <span className="atelier-progress-fill" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>

              <div className="panel-muted hidden flex-col justify-between gap-2 px-3 py-3 sm:flex">
                <div className="atelier-kicker">Puzzle Data</div>
                <div className="font-[Manrope] text-[1.55rem] font-extrabold tracking-[-0.05em] text-[rgb(var(--atelier-primary))]">
                  {clueCount}
                </div>
                <div className="text-xs font-medium text-[rgba(var(--atelier-muted),0.88)]">
                  给定数字 · Seed {state.seed}
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(var(--atelier-primary),0.76)]">
                  {selectionLabel}
                </div>
              </div>
            </div>

            <div ref={boardAreaRef} className="mx-auto mt-3 w-full max-w-[19rem] sm:mt-4 sm:max-w-[28rem] md:max-w-[33rem] lg:max-w-[40rem]">
              <Board
                size={boardSize}
                state={state}
                onSelectCell={(row, col) => dispatch({ type: "clickCell", row, col })}
              />
            </div>
          </section>

          <aside className="self-start xl:sticky xl:top-6">
            <section className="panel-surface subtle-enter px-3 py-3 sm:px-4 sm:py-4">
              <DigitPad
                state={state}
                difficulty={state.difficulty}
                selectionLabel={selectionLabel}
                filledCount={filledCount}
                showPeerHighlights={state.showPeerHighlights}
                onDifficultyChange={(difficulty) => dispatch({ type: "setDifficulty", difficulty })}
                onTogglePeerHighlights={() => dispatch({ type: "togglePeerHighlights" })}
                onDigitClick={handleDigitClick}
                onClear={() => dispatch({ type: "clearCell" })}
                onRestart={() => dispatch({ type: "restartGame" })}
                onNewGame={() => startNewGame()}
              />
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
