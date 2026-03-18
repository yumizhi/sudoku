import { DIFFICULTY_CONFIG } from "../domain/sudoku";
import type { Digit } from "../domain/sudoku";
import { formatTime } from "../features/game/gameReducer";
import { Board } from "../features/game/components/Board";
import { DigitPad } from "../features/game/components/DigitPad";
import { HintModal } from "../features/game/components/HintModal";
import { InspectorPanel } from "../features/game/components/InspectorPanel";
import { TutorialPanel } from "../features/game/components/TutorialPanel";
import { useSudokuGame } from "../features/game/useSudokuGame";

export default function App(): JSX.Element {
  const { state, dispatch, startNewGame, startTutorial } = useSudokuGame();

  function handleDigitClick(digit: Digit): void {
    const emptyEditableSelected =
      state.selected !== null &&
      !state.fixed[state.selected.row][state.selected.col] &&
      state.board[state.selected.row][state.selected.col] === 0;

    if (emptyEditableSelected) {
      dispatch({ type: "inputDigit", digit });
      return;
    }

    dispatch({ type: "toggleGlobalInspect", digit });
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_14%_14%,rgba(49,95,143,0.18),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(47,107,87,0.14),transparent_24%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.74),transparent_42%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr),minmax(20rem,0.85fr)]">
          <section className="panel-surface animate-rise p-6 sm:p-7">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h1 className="font-display text-4xl text-slate-900 sm:text-5xl">数独</h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                  支持笔记、观察、提示和教程训练。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="metric-card">
                  <span>模式</span>
                  <strong>{state.mode === "tutorial" ? "教程训练" : "自由对局"}</strong>
                </div>
                <div className="metric-card">
                  <span>计时</span>
                  <strong>{formatTime(state.elapsedSeconds)}</strong>
                </div>
                <div className="metric-card">
                  <span>失误</span>
                  <strong>{state.mistakes}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="panel-surface animate-rise p-6 sm:p-7 [animation-delay:120ms]">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <label className="grid min-w-[9rem] gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">难度</span>
                  <select
                    value={state.difficulty}
                    disabled={state.generating}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-tide/30 focus:ring-2 focus:ring-tide/20"
                    onChange={(event) =>
                      dispatch({
                        type: "setDifficulty",
                        difficulty: event.target.value as keyof typeof DIFFICULTY_CONFIG
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

                <div className="soft-chip mt-6 sm:mt-0">
                  {state.mode === "tutorial" ? "教程棋盘" : DIFFICULTY_CONFIG[state.difficulty].label}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <button className="primary-action" type="button" disabled={state.generating} onClick={() => startNewGame()}>
                  新游戏
                </button>
                <button className="secondary-action" type="button" disabled={state.generating} onClick={() => dispatch({ type: "requestHint" })}>
                  提示
                </button>
                <button className="secondary-action" type="button" disabled={state.generating} onClick={() => dispatch({ type: "checkBoard" })}>
                  检查
                </button>
                <button className="secondary-action" type="button" disabled={state.generating} onClick={() => dispatch({ type: "eraseCell" })}>
                  擦除
                </button>
                <button className="secondary-action" type="button" disabled={state.generating} onClick={() => dispatch({ type: "toggleNoteMode" })}>
                  {state.noteMode ? "笔记开" : "笔记关"}
                </button>
                <button className="secondary-action" type="button" disabled={state.generating} onClick={() => dispatch({ type: "undo" })}>
                  撤销
                </button>
                <button className="secondary-action" type="button" disabled={state.generating} onClick={() => dispatch({ type: "redo" })}>
                  重做
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  disabled={state.generating}
                  onClick={() =>
                    state.pendingHint
                      ? dispatch({ type: "applyHint" })
                      : dispatch({ type: "requestHint" })
                  }
                >
                  {state.pendingHint ? "应用提示" : "解释提示"}
                </button>
              </div>
            </div>
          </section>
        </header>

        <div
          className={[
            "rounded-[1.6rem] border px-4 py-3 text-sm font-medium shadow-sm backdrop-blur",
            state.message.tone === "success"
              ? "border-pine/20 bg-pine/10 text-pine"
              : state.message.tone === "warn"
                ? "border-ember/20 bg-ember/10 text-ember"
                : "border-slate-200 bg-white/75 text-slate-700"
          ].join(" ")}
          aria-live="polite"
        >
          {state.message.text || " "}
        </div>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr),23rem]">
          <div className="grid gap-5">
            <section className="panel-surface p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">棋盘</p>
                  <h2 className="mt-2 font-display text-2xl text-slate-900 sm:text-3xl">
                    {state.mode === "tutorial" ? "训练棋盘" : "当前棋盘"}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span className="soft-chip">{state.status === "won" ? "已完成" : "进行中"}</span>
                </div>
              </div>

              <Board
                state={state}
                onSelectCell={(row, col) => dispatch({ type: "selectCell", row, col })}
              />
            </section>

            <section className="panel-surface p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">数字盘</p>
                  <h2 className="mt-2 font-display text-2xl text-slate-900">输入与观察</h2>
                </div>
                <div className="soft-chip">{state.noteMode ? "笔记模式" : "填数模式"}</div>
              </div>
              <DigitPad state={state} onDigitClick={handleDigitClick} />
            </section>
          </div>

          <aside className="grid gap-5 xl:sticky xl:top-6 xl:self-start">
            <InspectorPanel
              state={state}
              onCandidateInspect={(digit) => dispatch({ type: "toggleLocalInspect", digit })}
              onGlobalInspect={(digit) => dispatch({ type: "toggleGlobalInspect", digit })}
            />
            <TutorialPanel state={state} onStartTutorial={startTutorial} />
          </aside>
        </section>
      </main>

      <HintModal
        hint={state.pendingHint}
        onClose={() => dispatch({ type: "dismissHint" })}
        onApply={() => dispatch({ type: "applyHint" })}
      />
    </div>
  );
}
