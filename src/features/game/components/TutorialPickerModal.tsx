import { useEffect, useRef } from "react";
import { TUTORIAL_LEVELS } from "../../../domain/sudoku";

interface TutorialPickerModalProps {
  activeTutorialId: string | null;
  open: boolean;
  onClose: () => void;
  onStartTutorial: (id: string) => void;
}

export function TutorialPickerModal({
  activeTutorialId,
  open,
  onClose,
  onStartTutorial
}: TutorialPickerModalProps): JSX.Element | null {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-picker-title"
        className="panel-surface max-h-[min(90dvh,48rem)] w-full max-w-3xl overflow-y-auto p-6 sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">教程</p>
            <h2 id="tutorial-picker-title" className="mt-2 font-display text-3xl text-slate-900">
              选择关卡
            </h2>
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

        <div className="mt-6 grid gap-3">
          {TUTORIAL_LEVELS.map((item) => {
            const active = item.id === activeTutorialId;
            return (
              <article
                key={item.id}
                className={[
                  "rounded-[1.4rem] border p-4 transition",
                  active
                    ? "border-tide/30 bg-tide/10 shadow-sm"
                    : "border-slate-200 bg-white/75"
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
                  className="mt-4 secondary-action"
                  onClick={() => {
                    onStartTutorial(item.id);
                    onClose();
                  }}
                >
                  {active ? "重新开始" : "开始"}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
