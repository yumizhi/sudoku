import { getTutorialById } from "../../../domain/sudoku";
import type { GameState } from "../types";

interface TutorialPanelProps {
  state: GameState;
  onOpenTutorialMenu: () => void;
  onRestartTutorial: (id: string) => void;
}

export function TutorialPanel({
  state,
  onOpenTutorialMenu,
  onRestartTutorial
}: TutorialPanelProps): JSX.Element | null {
  const level = getTutorialById(state.tutorialId);

  if (!level) {
    return null;
  }

  return (
    <section className="panel-surface flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">教程</p>
          <h2 className="mt-2 font-display text-2xl text-slate-900">{level.title}</h2>
        </div>
        <span className="soft-chip">{level.technique}</span>
      </div>

      <p className="text-sm leading-6 text-slate-600">{level.objective}</p>
      <p className="text-sm leading-6 text-slate-600">{level.summary}</p>

      <div className="grid gap-3">
        {level.steps.map((step, index) => (
          <div key={`${index}-${step}`} className="grid grid-cols-[1.75rem,minmax(0,1fr)] gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-tide/10 text-xs font-black text-tide">
              {index + 1}
            </span>
            <p className="text-sm leading-6 text-slate-600">{step}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="secondary-action"
          disabled={state.generating}
          onClick={onOpenTutorialMenu}
        >
          关卡列表
        </button>
        <button
          type="button"
          className="secondary-action"
          disabled={state.generating}
          onClick={() => onRestartTutorial(level.id)}
        >
          重新开始
        </button>
      </div>
    </section>
  );
}
