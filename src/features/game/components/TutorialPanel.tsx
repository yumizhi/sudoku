import { TUTORIAL_LEVELS, getTutorialById } from "../../../domain/sudoku";
import type { GameState } from "../types";

interface TutorialPanelProps {
  state: GameState;
  onStartTutorial: (id: string) => void;
}

const DEFAULT_STEPS = [
  "先选中空格，再看“当前格”里的候选。",
  "需要扫整盘时，用“全局观察”单独看一个数字。",
  "优先从裸单和隐藏单开始，卡住时再请求解释型提示。"
];

export function TutorialPanel({ state, onStartTutorial }: TutorialPanelProps): JSX.Element {
  const level = getTutorialById(state.tutorialId);
  const steps = state.mode === "tutorial" && level ? level.steps : DEFAULT_STEPS;

  return (
    <section className="panel-surface flex flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">教程与训练</p>
          <h2 className="mt-2 font-display text-2xl text-slate-900">
            {level ? level.title : "观察路线"}
          </h2>
        </div>
        <span className="soft-chip">{level ? level.technique : "自由对局"}</span>
      </div>

      <p className="text-sm leading-6 text-slate-600">
        {level
          ? `${level.objective} ${level.summary}`
          : "自由对局会保留完整工具集；教程关卡则会把观察路线固定下来，方便训练特定技巧。"}
      </p>

      <div className="grid gap-3">
        {steps.map((step, index) => (
          <div key={`${index}-${step}`} className="grid grid-cols-[1.8rem,minmax(0,1fr)] gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-tide/10 text-xs font-black text-tide">
              {index + 1}
            </span>
            <p className="text-sm leading-6 text-slate-600">{step}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3">
        {TUTORIAL_LEVELS.map((item) => {
          const active = item.id === state.tutorialId;
          return (
            <article
              key={item.id}
              className={[
                "rounded-[1.45rem] border p-4 transition",
                active
                  ? "border-tide/30 bg-tide/7 shadow-sm"
                  : "border-slate-200 bg-white/70 hover:border-tide/20 hover:bg-white/90"
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.summary}</p>
                </div>
                <span className="soft-chip">{item.technique}</span>
              </div>
              <button
                type="button"
                className="mt-4 inline-flex rounded-full border border-tide/20 bg-white px-4 py-2 text-sm font-bold text-tide transition hover:-translate-y-0.5 hover:border-tide/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-tide/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                disabled={state.generating}
                onClick={() => onStartTutorial(item.id)}
              >
                {active ? "重新开始" : "开始训练"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
