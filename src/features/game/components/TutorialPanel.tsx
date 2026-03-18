import { useEffect, useRef } from "react";
import { getTutorialById } from "../../../domain/sudoku";
import type { GameState } from "../types";

interface TutorialPanelProps {
  open: boolean;
  state: GameState;
  onClose: () => void;
  onOpenTutorialMenu: () => void;
  onRestartTutorial: (id: string) => void;
}

export function TutorialPanel({
  open,
  state,
  onClose,
  onOpenTutorialMenu,
  onRestartTutorial
}: TutorialPanelProps): JSX.Element | null {
  const level = getTutorialById(state.tutorialId);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  if (!open || !level) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-guide-title"
        className="panel-surface max-h-[min(90dvh,44rem)] w-full max-w-2xl overflow-y-auto p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">教程</p>
            <h2
              id="tutorial-guide-title"
              className="mt-1 font-display text-2xl text-slate-900 sm:text-3xl"
            >
              {level.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{level.objective}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="secondary-action"
            onClick={onClose}
          >
            关闭
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="soft-chip">{level.technique}</span>
          <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
            教程模式
          </span>
        </div>

        <div className="mt-5 rounded-[1.35rem] border border-slate-200 bg-white/80 p-4">
          <p className="text-sm leading-6 text-slate-700">{level.summary}</p>
          <div className="mt-4 grid gap-3">
            {level.steps.map((step, index) => (
              <div key={`${index}-${step}`} className="grid grid-cols-[1.75rem,minmax(0,1fr)] gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-tide/10 text-xs font-black text-tide">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-600">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            className="secondary-action"
            disabled={state.generating}
            onClick={onOpenTutorialMenu}
          >
            切换关卡
          </button>
          <button
            type="button"
            className="secondary-action"
            disabled={state.generating}
            onClick={() => onRestartTutorial(level.id)}
          >
            重新开始
          </button>
          <button type="button" className="primary-action" onClick={onClose}>
            返回棋盘
          </button>
        </div>
      </section>
    </div>
  );
}
