import { DIGITS } from "../../../domain/sudoku";
import type { Digit } from "../../../domain/sudoku";
import type { GameState } from "../types";

interface DigitPadProps {
  state: GameState;
  filledCount: number;
  labels: {
    undo: string;
    erase: string;
    notes: string;
    hint: string;
    newGame: string;
    selected: string;
    done: string;
    left: (count: number) => string;
    inputDigit: (digit: Digit) => string;
    toggleNote: (digit: Digit) => string;
    progress: (count: number) => string;
  };
  notesMode: boolean;
  onToggleNotesMode: () => void;
  onDigitClick: (digit: Digit) => void;
  onClear: () => void;
  onUndo: () => void;
  onHint: () => void;
  onNewGame: () => void;
}

export function DigitPad({
  state,
  filledCount,
  labels,
  notesMode,
  onToggleNotesMode,
  onDigitClick,
  onClear,
  onUndo,
  onHint,
  onNewGame
}: DigitPadProps): JSX.Element {
  const actions = [
    { label: labels.undo, icon: "undo", onClick: onUndo, active: false, role: undefined },
    { label: labels.erase, icon: "backspace", onClick: onClear, active: false, role: undefined },
    { label: labels.notes, icon: "edit_note", onClick: onToggleNotesMode, active: notesMode, role: "switch" as const },
    { label: labels.hint, icon: "lightbulb", onClick: onHint, active: false, role: undefined }
  ];
  const counts = Array.from({ length: 10 }, () => 0);
  for (const row of state.board) {
    for (const value of row) {
      if (value > 0) {
        counts[value] += 1;
      }
    }
  }

  return (
    <div className="game-controls">
      <div className="action-grid">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            role={action.role}
            aria-label={action.label}
            aria-checked={action.role === "switch" ? notesMode : undefined}
            className="action-button"
            data-active={action.active || undefined}
            disabled={state.generating}
            onClick={action.onClick}
          >
            <span className="action-button__icon" aria-hidden="true">
              {action.icon}
            </span>
            <span className="action-button__label">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="control-progress" aria-label={labels.progress(filledCount)}>
        {filledCount}/81
      </div>

      <div className="digit-grid">
        {DIGITS.map((digit) => {
          const complete = counts[digit] >= 9;
          const remaining = Math.max(0, 9 - counts[digit]);
          const active = state.highlightedDigit === digit;
          return (
            <button
              key={digit}
              type="button"
              className="digit-button"
              data-complete={complete || undefined}
              data-active={active || undefined}
              disabled={state.generating}
              aria-label={notesMode ? labels.toggleNote(digit) : labels.inputDigit(digit)}
              onClick={() => onDigitClick(digit)}
            >
              <div className="digit-button__tile">
                <span className="digit-button__digit">{digit}</span>
              </div>
              <div className="digit-button__meta">{active ? labels.selected : complete ? labels.done : labels.left(remaining)}</div>
            </button>
          );
        })}
      </div>

      <button type="button" aria-label={labels.newGame} className="new-game-button" disabled={state.generating} onClick={onNewGame}>
        {labels.newGame}
      </button>
    </div>
  );
}
