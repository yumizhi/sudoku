import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import type { Difficulty, Digit } from "../domain/sudoku";
import { formatTime, getFilledCount } from "../features/game/gameReducer";
import { Board } from "../features/game/components/Board";
import { DigitPad } from "../features/game/components/DigitPad";
import { useSudokuGame } from "../features/game/useSudokuGame";

function useBoardSize(): {
  boardAreaRef: RefObject<HTMLDivElement>;
  boardSize: number;
} {
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(320);

  useEffect(() => {
    const boardArea = boardAreaRef.current;
    if (!boardArea) {
      return;
    }

    const calculate = (): void => {
      const rect = boardArea.getBoundingClientRect();
      const nextSize = Math.max(0, Math.floor(Math.min(rect.width, rect.height)));
      setBoardSize(nextSize);
    };

    calculate();

    const observer = new ResizeObserver(calculate);
    observer.observe(boardArea);
    window.addEventListener("resize", calculate);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", calculate);
    };
  }, []);

  return { boardAreaRef, boardSize };
}

const DIFFICULTY_TABS: Difficulty[] = ["easy", "medium", "hard"];

type UiLanguage = "en" | "zh";
type NewGameRequest =
  | { kind: "newGame"; difficulty: Difficulty }
  | { kind: "difficulty"; difficulty: Difficulty };

const LANGUAGE_STORAGE_KEY = "sudoku-ui-language";
const SKIP_NEW_GAME_CONFIRM_STORAGE_KEY = "sudoku-skip-new-game-confirm";

const UI_TEXT = {
  en: {
    difficulty: { easy: "Easy", medium: "Mid", hard: "Hard" },
    time: "Time",
    newGame: "New Game",
    newGameShort: "New",
    undo: "Undo",
    erase: "Erase",
    notes: "Notes",
    hint: "Hint",
    selected: "Selected",
    done: "Done",
    left: (count: number) => `${count} left`,
    inputDigit: (digit: Digit) => `Input ${digit}`,
    toggleNote: (digit: Digit) => `Toggle note ${digit}`,
    confirmTitle: "Start a new game?",
    confirmNewGameBody: "This will start a new puzzle and clear the current board.",
    confirmDifficultyBody: (difficulty: string) =>
      `Switching to ${difficulty} will start a new puzzle and clear the current board. Continue?`,
    dontAskAgain: "Don't ask again",
    cancel: "Cancel",
    confirm: "Start",
    difficultyTimeLabel: "Difficulty and time",
    timeLabel: (time: string) => `Time ${time}`,
    gameTitle: "Sudoku",
    completeStatus: "Complete. Start a new game to continue.",
    status: (difficulty: string, time: string) => `${difficulty} · ${time}`,
    languageLabel: "Language",
    boardName: "Sudoku board",
    cellLabel: (row: number, col: number, value: number, fixed: boolean, notes: Digit[]) => {
      const base = `Row ${row + 1}, column ${col + 1}`;
      if (value !== 0) {
        return fixed ? `${base}, given ${value}` : `${base}, current value ${value}`;
      }
      if (notes.length > 0) {
        return `${base}, empty, candidates ${notes.join(" ")}`;
      }
      return `${base}, empty`;
    },
    progress: (count: number) => `Progress ${count}/81`
  },
  zh: {
    difficulty: { easy: "简单", medium: "中等", hard: "困难" },
    time: "时间",
    newGame: "新游戏",
    newGameShort: "新局",
    undo: "撤销",
    erase: "清除",
    notes: "笔记",
    hint: "提示",
    selected: "已选",
    done: "完成",
    left: (count: number) => `剩 ${count}`,
    inputDigit: (digit: Digit) => `输入数字 ${digit}`,
    toggleNote: (digit: Digit) => `切换候选 ${digit}`,
    confirmTitle: "开始新游戏？",
    confirmNewGameBody: "这会开始一局新游戏，当前棋盘会被清空。",
    confirmDifficultyBody: (difficulty: string) => `切换到${difficulty}会开始一局新游戏，当前棋盘会被清空。`,
    dontAskAgain: "下次不再提示",
    cancel: "取消",
    confirm: "确定",
    difficultyTimeLabel: "难度和时间",
    timeLabel: (time: string) => `时间 ${time}`,
    gameTitle: "数独",
    completeStatus: "已完成，开始新游戏继续。",
    status: (difficulty: string, time: string) => `${difficulty} · ${time}`,
    languageLabel: "语言",
    boardName: "Sudoku 棋盘",
    cellLabel: (row: number, col: number, value: number, fixed: boolean, notes: Digit[]) => {
      const base = `第 ${row + 1} 行，第 ${col + 1} 列`;
      if (value !== 0) {
        return fixed ? `${base}，题目给定数字 ${value}` : `${base}，当前数字 ${value}`;
      }
      if (notes.length > 0) {
        return `${base}，空格，候选 ${notes.join(" ")}`;
      }
      return `${base}，空格`;
    },
    progress: (count: number) => `进度 ${count}/81`
  }
} as const;

function readInitialLanguage(): UiLanguage {
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "zh" ? "zh" : "en";
}

function readSkipNewGameConfirm(): boolean {
  try {
    return window.localStorage.getItem(SKIP_NEW_GAME_CONFIRM_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function saveSkipNewGameConfirm(): void {
  try {
    window.localStorage.setItem(SKIP_NEW_GAME_CONFIRM_STORAGE_KEY, "true");
  } catch {
    // The preference is optional; failing to store it should not block gameplay.
  }
}

function translateStatusMessage(message: string, language: UiLanguage): string {
  if (language === "zh" || message.length === 0) {
    return message;
  }

  const exact: Record<string, string> = {
    "正在准备棋盘…": "Preparing the board...",
    "正在生成新的棋盘…": "Generating a new puzzle...",
    "生成棋盘失败，请重试。": "Puzzle generation failed. Try again.",
    "已恢复上次进度。": "Previous progress restored.",
    "先选择一个空格。": "Select an empty cell first.",
    "题目给定格不可修改。": "Given cells cannot be edited.",
    "已有数字的格子不能写候选数。": "Notes can only be added to empty cells.",
    "已清除当前格。": "Current cell cleared.",
    "已清除当前格笔记。": "Current cell notes cleared.",
    "没有可撤销的操作。": "Nothing to undo.",
    "已撤销上一步。": "Undid the last move.",
    "已关闭笔记模式。": "Notes mode off.",
    "已开启笔记模式。": "Notes mode on.",
    "当前棋盘已经没有可提示的空格。": "There are no empty cells left to hint."
  };

  if (exact[message]) {
    return exact[message];
  }

  const newGameMatch = message.match(/^新游戏已开始（(.+)，给定 (\d+) 个数字）。$/);
  if (newGameMatch) {
    const [, difficulty, count] = newGameMatch;
    const translatedDifficulty =
      difficulty === "简单" ? "Easy" : difficulty === "中等" ? "Mid" : difficulty === "困难" ? "Hard" : difficulty;
    return `New game started (${translatedDifficulty}, ${count} givens).`;
  }

  const filledMatch = message.match(/^已填入 ([1-9])。$/);
  if (filledMatch) {
    return `Entered ${filledMatch[1]}.`;
  }

  const sameValueMatch = message.match(/^当前格已经是 ([1-9])。$/);
  if (sameValueMatch) {
    return `Current cell is already ${sameValueMatch[1]}.`;
  }

  const addNoteMatch = message.match(/^已记录候选 ([1-9])。$/);
  if (addNoteMatch) {
    return `Added note ${addNoteMatch[1]}.`;
  }

  const removeNoteMatch = message.match(/^已移除候选 ([1-9])。$/);
  if (removeNoteMatch) {
    return `Removed note ${removeNoteMatch[1]}.`;
  }

  const completeMatch = message.match(/^完成！用时 (.+)。$/);
  if (completeMatch) {
    return `Complete in ${completeMatch[1]}.`;
  }

  return message;
}

export default function App(): JSX.Element {
  const { state, dispatch, startNewGame } = useSudokuGame();
  const { boardAreaRef, boardSize } = useBoardSize();
  const [language, setLanguage] = useState<UiLanguage>(readInitialLanguage);
  const [skipNewGameConfirm, setSkipNewGameConfirm] = useState(readSkipNewGameConfirm);
  const [pendingNewGameRequest, setPendingNewGameRequest] = useState<NewGameRequest | null>(null);
  const [skipNewGameConfirmAfterStart, setSkipNewGameConfirmAfterStart] = useState(false);

  const filledCount = getFilledCount(state);
  const text = UI_TEXT[language];
  const difficultyIndex = DIFFICULTY_TABS.indexOf(state.difficulty);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const headerMessage = useMemo(() => {
    if (state.message.text) {
      return translateStatusMessage(state.message.text, language);
    }

    if (state.status === "won") {
      return text.completeStatus;
    }

    return text.status(text.difficulty[state.difficulty], formatTime(state.elapsedSeconds));
  }, [language, state.difficulty, state.elapsedSeconds, state.message.text, state.status, text]);

  function handleDigitClick(digit: Digit): void {
    dispatch({ type: "inputDigit", digit });
  }

  function requestNewGame(request: NewGameRequest): void {
    if (skipNewGameConfirm) {
      startNewGame(request.difficulty);
      return;
    }

    setSkipNewGameConfirmAfterStart(false);
    setPendingNewGameRequest(request);
  }

  function requestDifficulty(difficulty: Difficulty): void {
    if (difficulty === state.difficulty) {
      return;
    }

    requestNewGame({ kind: "difficulty", difficulty });
  }

  function requestCurrentDifficultyNewGame(): void {
    requestNewGame({ kind: "newGame", difficulty: state.difficulty });
  }

  function cancelNewGameRequest(): void {
    setPendingNewGameRequest(null);
    setSkipNewGameConfirmAfterStart(false);
  }

  function confirmNewGameRequest(): void {
    if (!pendingNewGameRequest) {
      return;
    }

    if (skipNewGameConfirmAfterStart) {
      saveSkipNewGameConfirm();
      setSkipNewGameConfirm(true);
    }

    startNewGame(pendingNewGameRequest.difficulty);
    setPendingNewGameRequest(null);
    setSkipNewGameConfirmAfterStart(false);
  }

  function getConfirmBody(request: NewGameRequest): string {
    if (request.kind === "difficulty") {
      return text.confirmDifficultyBody(text.difficulty[request.difficulty]);
    }

    return text.confirmNewGameBody;
  }

  function renderDifficultySwitch(): JSX.Element {
    return (
      <div
        className="difficulty-switch"
        aria-label={text.difficultyTimeLabel}
        style={{ "--difficulty-index": difficultyIndex } as CSSProperties}
      >
        {DIFFICULTY_TABS.map((difficulty) => (
          <button
            key={difficulty}
            type="button"
            className="difficulty-segment"
            data-active={state.difficulty === difficulty || undefined}
            aria-pressed={state.difficulty === difficulty}
            disabled={state.generating}
            onClick={() => requestDifficulty(difficulty)}
          >
            {text.difficulty[difficulty]}
          </button>
        ))}
        <div className="difficulty-time" aria-label={text.timeLabel(formatTime(state.elapsedSeconds))}>
          <span>{text.time}</span>
          <strong>{formatTime(state.elapsedSeconds)}</strong>
        </div>
      </div>
    );
  }

  function renderLanguageSwitch(): JSX.Element {
    return (
      <div className="language-switch" role="group" aria-label={text.languageLabel} data-language={language}>
        <button type="button" data-active={language === "en" || undefined} onClick={() => setLanguage("en")}>
          EN
        </button>
        <button type="button" data-active={language === "zh" || undefined} onClick={() => setLanguage("zh")}>
          中
        </button>
      </div>
    );
  }

  return (
    <div className="game-app h-dvh overflow-hidden">
      <main className="game-phone">
        <h1 className="sr-only">{text.gameTitle}</h1>

        <header className="desktop-header subtle-enter">
          <div aria-hidden="true" />
          {renderDifficultySwitch()}
          {renderLanguageSwitch()}
        </header>

        <header className="mobile-appbar subtle-enter">
          <button
            type="button"
            aria-label={text.newGame}
            className="appbar-new-game"
            disabled={state.generating}
            onClick={requestCurrentDifficultyNewGame}
          >
            {text.newGameShort}
          </button>
          {renderDifficultySwitch()}
          {renderLanguageSwitch()}
        </header>

        <p
          role="status"
          aria-live="polite"
          data-tone={state.status === "won" ? "success" : state.message.tone}
          className="sr-only"
        >
          {headerMessage}
        </p>

        <div className="play-surface">
          <section className="board-stage subtle-enter">
            <div ref={boardAreaRef} className="board-measure">
              <Board
                size={boardSize}
                state={state}
                labels={{
                  grid: text.boardName,
                  cell: text.cellLabel
                }}
                onSelectCell={(row, col) => dispatch({ type: "clickCell", row, col })}
              />
            </div>
          </section>

          <DigitPad
            state={state}
            filledCount={filledCount}
            labels={text}
            notesMode={state.notesMode}
            onToggleNotesMode={() => dispatch({ type: "toggleNotesMode" })}
            onDigitClick={handleDigitClick}
            onClear={() => dispatch({ type: "clearCell" })}
            onUndo={() => dispatch({ type: "undo" })}
            onHint={() => dispatch({ type: "requestHint" })}
            onNewGame={requestCurrentDifficultyNewGame}
          />
        </div>

        {pendingNewGameRequest ? (
          <div className="confirm-layer" role="presentation">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-game-confirm-title"
              className="confirm-dialog"
            >
              <h2 id="new-game-confirm-title">{text.confirmTitle}</h2>
              <p>{getConfirmBody(pendingNewGameRequest)}</p>
              <label className="confirm-checkbox">
                <input
                  type="checkbox"
                  checked={skipNewGameConfirmAfterStart}
                  onChange={(event) => setSkipNewGameConfirmAfterStart(event.currentTarget.checked)}
                />
                <span>{text.dontAskAgain}</span>
              </label>
              <div className="confirm-actions">
                <button type="button" className="confirm-secondary" onClick={cancelNewGameRequest}>
                  {text.cancel}
                </button>
                <button type="button" className="confirm-primary" disabled={state.generating} onClick={confirmNewGameRequest}>
                  {text.confirm}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
