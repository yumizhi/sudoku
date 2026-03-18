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

  const messageToneClass =
    state.message.tone === "success"
      ? "border-pine/20 bg-pine/10 text-pine"
      : state.message.tone === "warn"
        ? "border-ember/20 bg-ember/10 text-ember"
        : "border-slate-200 bg-white/75 text-slate-700";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[22rem] bg-[radial-gradient(circle_at_14%_14%,rgba(49,95,143,0.18),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(47,107,87,0.14),transparent_24%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.74),transparent_42%)]" />

      <main className="relative mx-auto min-h-screen w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),22rem] lg:items-start">
          <section className="panel-surface p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  {state.mode === "tutorial" ? "教程棋盘" : "数独"}
                </p>
                <h1 className="mt-2 font-display text-2xl text-slate-900 sm:text-3xl">数独</h1>
                {state.mode === "tutorial" && tutorial ? (
                  <p className="mt-2 text-sm font-semibold text-slate-600">{tutorial.title}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span className="soft-chip">{state.status === "won" ? "已完成" : "进行中"}</span>
                {state.noteMode ? <span className="soft-chip">笔记</span> : null}
                {activeObservedDigit ? <span className="soft-chip">观察 {activeObservedDigit}</span> : null}
              </div>
            </div>

            <Board
              state={state}
              onSelectCell={(row, col) => dispatch({ type: "selectCell", row, col })}
            />

            <div
              className={["mt-4 rounded-[1.35rem] border px-4 py-3 text-sm font-medium shadow-sm", messageToneClass].join(" ")}
              aria-live="polite"
            >
              {state.message.text || " "}
            </div>
          </section>

          <aside className="grid gap-4 lg:sticky lg:top-4">
            <section className="panel-surface grid gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">操作</p>
                  <h2 className="mt-2 font-display text-2xl text-slate-900">
                    {state.mode === "tutorial" && tutorial ? tutorial.technique : DIFFICULTY_CONFIG[state.difficulty].label}
                  </h2>
                </div>
                <div className="metric-card min-w-[6rem] px-3 py-2">
                  <span>时间</span>
                  <strong>{formatTime(state.elapsedSeconds)}</strong>
                </div>
              </div>

              <label className="grid gap-2">
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

              <div className="grid grid-cols-2 gap-3">
                <button className="primary-action" type="button" disabled={state.generating} onClick={() => startNewGame()}>
                  新游戏
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  disabled={state.generating}
                  onClick={() => setTutorialPickerOpen(true)}
                >
                  教程
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

              <div className="rounded-[1.4rem] border border-slate-200 bg-white/75 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">当前格</p>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">{detail.title}</h3>
                  </div>
                  {detail.candidates.length > 0 ? (
                    <span className="soft-chip">{detail.candidates.length} 候选</span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{detail.summary}</p>
                {detail.candidates.length > 0 ? (
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {detail.candidates.map((digit) => (
                      <span
                        key={digit}
                        className="grid h-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="panel-surface grid gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">数字</p>
                  <h2 className="mt-2 font-display text-2xl text-slate-900">输入与观察</h2>
                </div>
                <span className="soft-chip">{digitPadMode === "observe" ? "观察模式" : state.noteMode ? "笔记写入" : "直接填入"}</span>
              </div>

              <p className="text-sm leading-6 text-slate-600">
                {digitPadMode === "observe"
                  ? "数字按钮只用于观察。绿色是当前可放位置，灰色是占线范围；键盘仍然直接填数。"
                  : state.noteMode
                    ? "数字按钮会写入或取消笔记。"
                    : "数字按钮直接填入当前选中格。"}
              </p>

              <DigitPad
                activeDigit={activeObservedDigit}
                mode={digitPadMode}
                state={state}
                onDigitClick={handleDigitClick}
                onModeChange={handleDigitModeChange}
              />
            </section>

            {state.mode === "tutorial" ? (
              <TutorialPanel
                state={state}
                onOpenTutorialMenu={() => setTutorialPickerOpen(true)}
                onRestartTutorial={startTutorial}
              />
            ) : null}
          </aside>
        </div>
      </main>

      <HintModal
        hint={state.pendingHint}
        onClose={() => dispatch({ type: "dismissHint" })}
        onApply={() => dispatch({ type: "applyHint" })}
      />

      <TutorialPickerModal
        activeTutorialId={state.tutorialId}
        open={tutorialPickerOpen}
        onClose={() => setTutorialPickerOpen(false)}
        onStartTutorial={startTutorial}
      />
    </div>
  );
}
