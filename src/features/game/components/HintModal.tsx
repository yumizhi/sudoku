import { useEffect, useRef } from "react";
import type { HintDetail } from "../../../domain/sudoku";

interface HintModalProps {
  hint: HintDetail | null;
  onClose: () => void;
  onApply: () => void;
}

export function HintModal({ hint, onClose, onApply }: HintModalProps): JSX.Element | null {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (hint) {
      closeButtonRef.current?.focus();
    }
  }, [hint]);

  if (!hint) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="提示解释"
        aria-labelledby="hint-modal-title"
        className="panel-surface w-full max-w-2xl p-6 sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">提示解释</p>
            <h2 id="hint-modal-title" className="mt-2 font-display text-3xl text-slate-900">
              {hint.technique}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-tide/50"
            onClick={onClose}
          >
            关闭
          </button>
        </div>

        <p className="mt-4 text-base leading-7 text-slate-700">{hint.summary}</p>

        <div className="mt-6 grid gap-4">
          {hint.steps.map((step, index) => (
            <div
              key={`${index}-${step}`}
              className="grid grid-cols-[2rem,minmax(0,1fr)] gap-3 rounded-[1.4rem] border border-slate-200 bg-white/75 p-4"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-tide/10 text-sm font-black text-tide">
                {index + 1}
              </span>
              <p className="text-sm leading-6 text-slate-600">{step}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-tide/50"
            onClick={onClose}
          >
            只看解释
          </button>
          <button
            type="button"
            className="rounded-full border border-tide/20 bg-tide px-5 py-3 text-sm font-bold text-white shadow-lg shadow-tide/25 transition hover:-translate-y-0.5 hover:bg-[#264f78] focus:outline-none focus-visible:ring-2 focus-visible:ring-tide/50"
            onClick={onApply}
          >
            应用这一步
          </button>
        </div>
      </div>
    </div>
  );
}
