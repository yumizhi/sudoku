import { useState } from "react";
import { DIFFICULTY_CONFIG, getTutorialById } from "../domain/sudoku";
import type { Digit } from "../domain/sudoku";
import { describeSelectedCell, formatTime } from "../features/game/gameReducer";
import { Board } from "../features/game/components/Board";
import { DigitPad } from "../features/game/components/DigitPad";
import { HintModal } from "../features/game/components/HintModal";
import { TutorialPanel } from "../features/game/components/TutorialPanel";
import { TutorialPickerModal } from "../features/game/components/TutorialPickerModal";
import { useSudokuGame } from "../features/game/useSudokuGame";

export default function App(): JSX.Element {
  const { state, dispatch, startNewGame, startTutorial } = useSudokuGame();
  const [digitPadMode, setDigitPadMode] = useState<"input" | "observe">("input");
  const [tutorialPickerOpen, setTutorialPickerOpen] = useState(false);
  const [tutorialGuideOpen, setTutorialGuideOpen] = useState(false);

  const detail = describeSelectedCell(state);
  const tutorial = getTutorialById(state.tutorialId);
  const activeObservedDigit =
    state.focusScope === "global" && digitPadMode === "observe" ? state.focusDigit : null;

  function handleDigitClick(digit: Digit): void {
    if (digitPadMode === "observe") {
      dispatch({ type: "toggleGlobalInspect", digit });
      return;
    }

    dispatch({ type: "inputDigit", digit });
  }

  function handleDigitModeChange(mode: "input" | "observe"): void {
    setDigitPadMode(mode);
    if (mode === "input") {
      dispatch({ type: "clearFocus" });
    }
  }

  function handleStartTutorial(levelId: string): void {
    startTutorial(levelId);
    setTutorialPickerOpen(false);
    setTutorialGuideOpen(true);
  }

  const messageToneClass =
    state.message.tone === "success"
      ? "border-pine/20 bg-pine/10 text-pine"
      : state.message.tone === "warn"
        ? "border-ember/20 bg-ember/10 text-ember"
        : "border-slate-200 bg-white/75 text-slate-700";

  return (
    <div className="relative min-h-dvh overflow-hidden lg:h-dvh">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[22rem] bg-[radial-gradient(circle_at_14%_14%,rgba(49,95,143,0.18),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(47,107,87,0.14),transparent_24%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.74),transparent_42%)]" />

      <main className="relative mx-auto min-h-dvh w-full max-w-7xl px-3 py-3 sm:px-4 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:px-5 lg:py-4">
        <div className="grid gap-3 lg:h-full lg:grid-cols-[minmax(0,1fr),minmax(20rem,23rem)] lg:gap-4">
          <section className="panel-surface flex min-h-0 flex-col p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl text-slate-900 sm:text-2xl">数独</h1>
                <span className="soft-chip">
                  {state.mode === "tutorial" && tutorial
                    ? tutorial.technique
                    : DIFFICULTY_CONFIG[state.difficulty].label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="metric-card min-w-[6.5rem] px-3 py-2">
                  <span>时间</span>
                  <strong>{formatTime(state.elapsedSeconds)}</strong>
                </div>
                <span className="soft-chip">{state.status === "won" ? "已完成" : "进行中"}</span>
                {state.noteMode ? <span className="soft-chip">笔记</span> : null}
                {activeObservedDigit ? <span className="soft-chip">观察 {activeObservedDigit}</span> : null}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center">
              <Board
                state={state}
                onSelectCell={(row, col) => dispatch({ type: "selectCell", row, col })}
              />
            </div>
          </section>

          <aside className="panel-surface flex min-h-0 flex-col gap-3 p-3 sm:p-4 lg:overflow-y-auto">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-slate-500">
                  难度
                </span>
                <select
                  value={state.difficulty}
                  disabled={state.generating}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-tide/30 focus:ring-2 focus:ring-tide/20"
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

              <button
                className="primary-action"
                type="button"
                disabled={state.generating}
                onClick={() => startNewGame()}
              >
                新游戏
              </button>
              <button
                className="secondary-action"
                type="button"
                disabled={state.generating}
                onClick={() => setTutorialPickerOpen(true)}
              >
                教程选关
              </button>
              {state.mode === "tutorial" ? (
                <button
                  className="secondary-action sm:col-span-2"
                  type="button"
                  disabled={state.generating}
                  onClick={() => setTutorialGuideOpen(true)}
                >
                  查看教程说明
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2">
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
                {state.pendingHint ? "应用提示" : "提示"}
              </button>
              <button
                className="secondary-action"
                type="button"
                disabled={state.generating}
                onClick={() => dispatch({ type: "checkBoard" })}
              >
                检查
              </button>
              <button
                className="secondary-action"
                type="button"
                disabled={state.generating}
                onClick={() => dispatch({ type: "toggleNoteMode" })}
              >
                {state.noteMode ? "笔记开" : "笔记关"}
              </button>
              <button
                className="secondary-action"
                type="button"
                disabled={state.generating}
                onClick={() => dispatch({ type: "eraseCell" })}
              >
                擦除
              </button>
              <button
                className="secondary-action"
                type="button"
                disabled={state.generating}
                onClick={() => dispatch({ type: "undo" })}
              >
                撤销
              </button>
              <button
                className="secondary-action"
                type="button"
                disabled={state.generating}
                onClick={() => dispatch({ type: "redo" })}
              >
                重做
              </button>
            </div>

            <div
              className={["rounded-[1.1rem] border px-3 py-2 text-sm font-medium shadow-sm", messageToneClass].join(" ")}
              aria-live="polite"
            >
              {state.message.text || " "}
            </div>

            <div className="rounded-[1.2rem] border border-slate-200 bg-white/75 px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                  当前格
                </p>
                <span className="text-xs font-semibold text-slate-500">{detail.title}</span>
              </div>
              <p className="mt-1 text-sm leading-5 text-slate-600">{detail.summary}</p>
            </div>

            <div className="min-h-0 rounded-[1.5rem] border border-slate-200 bg-white/80 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-slate-500">
                    数字
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {digitPadMode === "observe"
                      ? "观察模式"
                      : state.noteMode
                        ? "笔记输入"
                        : "直接填入"}
                  </h2>
                </div>
                {state.mode === "tutorial" && tutorial ? (
                  <button
                    type="button"
                    className="soft-chip"
                    onClick={() => setTutorialGuideOpen(true)}
                  >
                    {tutorial.title}
                  </button>
                ) : null}
              </div>

              <DigitPad
                activeDigit={activeObservedDigit}
                mode={digitPadMode}
                state={state}
                onDigitClick={handleDigitClick}
                onModeChange={handleDigitModeChange}
              />
            </div>
          </aside>
        </div>
      </main>

      <HintModal
        hint={state.pendingHint}
        onClose={() => dispatch({ type: "dismissHint" })}
        onApply={() => dispatch({ type: "applyHint" })}
      />

      <TutorialPanel
        open={tutorialGuideOpen}
        state={state}
        onClose={() => setTutorialGuideOpen(false)}
        onOpenTutorialMenu={() => {
          setTutorialGuideOpen(false);
          setTutorialPickerOpen(true);
        }}
        onRestartTutorial={(id) => {
          startTutorial(id);
          setTutorialGuideOpen(false);
        }}
      />

      <TutorialPickerModal
        activeTutorialId={state.tutorialId}
        open={tutorialPickerOpen}
        onClose={() => setTutorialPickerOpen(false)}
        onStartTutorial={handleStartTutorial}
      />
    </div>
  );
}
