import { DIFFICULTY_CONFIG, DIGITS } from "../../../domain/sudoku";
import type { Difficulty, Digit } from "../../../domain/sudoku";
import type { GameState } from "../types";
import { EraserIcon, EyeIcon, NewGameIcon, UndoIcon } from "./icons";

interface DigitPadProps {
  state: GameState;
  difficulty: Difficulty;
  selectionLabel: string;
  filledCount: number;
  showPeerHighlights: boolean;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onTogglePeerHighlights: () => void;
  onDigitClick: (digit: Digit) => void;
  onClear: () => void;
  onRestart: () => void;
  onNewGame: () => void;
}

export function DigitPad({
  state,
  difficulty,
  selectionLabel,
  filledCount,
  showPeerHighlights,
  onDifficultyChange,
  onTogglePeerHighlights,
  onDigitClick,
  onClear,
  onRestart,
  onNewGame
}: DigitPadProps): JSX.Element {
  const counts = Array.from({ length: 10 }, () => 0);
  for (const row of state.board) {
    for (const value of row) {
      if (value > 0) {
        counts[value] += 1;
      }
    }
  }

  return (
    <div className="grid gap-4">
      <div className="hidden gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_10rem] xl:grid-cols-1">
        <div className="panel-muted px-3 py-3">
          <div className="atelier-kicker">当前焦点</div>
          <div className="mt-1 truncate font-[Manrope] text-[1.4rem] font-extrabold tracking-[-0.05em] text-[rgb(var(--atelier-ink))]">
            {selectionLabel}
          </div>
          <div className="mt-1 text-xs leading-5 text-[rgba(var(--atelier-muted),0.92)]">
            点按录入，也支持方向键、数字键与删除键操作。
          </div>
        </div>

        <label className="panel-muted flex items-center justify-between gap-3 px-3 py-3">
          <span className="min-w-0">
            <span className="atelier-kicker block">难度</span>
            <span className="mt-1 block text-sm font-semibold text-[rgb(var(--atelier-ink))]">下一局生成使用</span>
          </span>
          <select
            value={difficulty}
            disabled={state.generating}
            className="min-w-0 bg-transparent text-right text-sm font-semibold text-[rgb(var(--atelier-primary))] outline-none"
            onChange={(event) => onDifficultyChange(event.target.value as Difficulty)}
          >
            {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        <button type="button" className="action-tile" disabled={state.generating} onClick={onRestart}>
          <span className="action-tile__icon" aria-hidden="true">
            <UndoIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </span>
          <span className="action-tile__label">重开</span>
        </button>

        <button type="button" className="action-tile" disabled={state.generating} onClick={onClear}>
          <span className="action-tile__icon" aria-hidden="true">
            <EraserIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </span>
          <span className="action-tile__label">清除</span>
        </button>

        <button
          type="button"
          role="switch"
          aria-label="占线高亮"
          aria-checked={showPeerHighlights}
          className="action-tile"
          data-active={showPeerHighlights || undefined}
          disabled={state.generating}
          onClick={onTogglePeerHighlights}
        >
          <span className="action-tile__icon" aria-hidden="true">
            <EyeIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </span>
          <span className="action-tile__label">占线</span>
        </button>

        <button
          type="button"
          className="action-tile"
          data-primary="true"
          disabled={state.generating}
          onClick={onNewGame}
        >
          <span className="action-tile__icon" aria-hidden="true">
            <NewGameIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </span>
          <span className="action-tile__label">新游戏</span>
        </button>
      </div>

      <div className="grid grid-cols-9 gap-1.5 md:grid-cols-3 md:gap-3">
        {DIGITS.map((digit) => {
          const complete = counts[digit] >= 9;
          const remaining = Math.max(0, 9 - counts[digit]);
          return (
            <button
              key={digit}
              type="button"
              className="digit-button"
              data-complete={complete || undefined}
              data-active={state.highlightedDigit === digit || undefined}
              disabled={state.generating}
              aria-label={`输入数字 ${digit}`}
              onClick={() => onDigitClick(digit)}
            >
              <div className="digit-button__digit">{digit}</div>
              <div className="digit-button__meta">{complete ? "完成" : `剩 ${remaining}`}</div>
            </button>
          );
        })}
      </div>

      <div className="panel-muted hidden items-center justify-between gap-3 px-3 py-3 sm:flex">
        <span className="min-w-0">
          <span className="atelier-kicker block">Board Progress</span>
          <span className="mt-1 block text-sm font-semibold text-[rgb(var(--atelier-ink))]">{filledCount}/81</span>
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(var(--atelier-primary),0.78)]">
          {showPeerHighlights ? "高亮已开" : "高亮已关"}
        </span>
      </div>
    </div>
  );
}
