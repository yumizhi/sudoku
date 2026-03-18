import { useEffect, useReducer } from "react";
import type { Dispatch } from "react";
import {
  DIFFICULTY_CONFIG,
  countClues,
  generateGameBundle,
  getTutorialById,
  gridFromString
} from "../../domain/sudoku";
import type { Difficulty, Digit } from "../../domain/sudoku";
import { createGameStateFromPayload, createInitialGameState, gameReducer } from "./gameReducer";
import { loadPersistedGame, savePersistedGame } from "./storage";

function useGameTicker(dispatch: Dispatch<Parameters<typeof gameReducer>[1]>): void {
  useEffect(() => {
    const timerId = window.setInterval(() => {
      dispatch({ type: "tick" });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [dispatch]);
}

export function useSudokuGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);

  useGameTicker(dispatch);

  function startNewGame(difficulty: Difficulty = state.difficulty): void {
    dispatch({
      type: "setGenerating",
      generating: true,
      message: { text: "正在生成新的棋盘…", tone: "info" }
    });

    window.setTimeout(() => {
      try {
        const bundle = generateGameBundle(difficulty);
        const clueCount = countClues(bundle.puzzle);
        dispatch({
          type: "loadGame",
          payload: {
            ...bundle,
            mode: "normal",
            tutorialId: null,
            message: {
              text: `新游戏已开始（${DIFFICULTY_CONFIG[difficulty].label}，给定 ${clueCount} 个数字）。`,
              tone: "info"
            }
          }
        });
      } catch (error) {
        console.error(error);
        dispatch({
          type: "setGenerating",
          generating: false,
          message: { text: "生成棋盘失败，请重试。", tone: "warn" }
        });
      }
    }, 24);
  }

  function startTutorial(levelId: string): void {
    const level = getTutorialById(levelId);
    if (!level) {
      dispatch({
        type: "setGenerating",
        generating: false,
        message: { text: "教程关卡不存在。", tone: "warn" }
      });
      return;
    }

    dispatch({
      type: "setGenerating",
      generating: true,
      message: { text: `正在加载 ${level.title}…`, tone: "info" }
    });

    window.setTimeout(() => {
      try {
        const puzzle = gridFromString(level.puzzle, true);
        const solution = gridFromString(level.solution, false);
        if (!puzzle || !solution) {
          throw new Error(`Invalid tutorial payload: ${level.id}`);
        }

        const clueCount = countClues(puzzle);
        dispatch({
          type: "loadGame",
          payload: {
            difficulty: state.difficulty,
            seed: level.id.length,
            puzzle,
            solution,
            mode: "tutorial",
            tutorialId: level.id,
            message: {
              text: `${level.title} 已开始（给定 ${clueCount} 个数字）。`,
              tone: "info"
            }
          }
        });
      } catch (error) {
        console.error(error);
        dispatch({
          type: "setGenerating",
          generating: false,
          message: { text: "教程加载失败，请重试。", tone: "warn" }
        });
      }
    }, 20);
  }

  useEffect(() => {
    const saved = loadPersistedGame();
    if (saved) {
      dispatch({
        type: "replaceState",
        state: createGameStateFromPayload({
          ...saved,
          message:
            saved.mode === "tutorial"
              ? { text: "已恢复教程进度。", tone: "info" }
              : { text: "已恢复上次进度。", tone: "info" }
        })
      });
      return;
    }

    startNewGame("medium");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    savePersistedGame(state);
  }, [state]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName ?? "";
      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
        return;
      }

      if (event.key === "Escape" && state.pendingHint) {
        dispatch({ type: "dismissHint" });
        event.preventDefault();
        return;
      }

      if (state.generating) {
        return;
      }

      if (event.key >= "1" && event.key <= "9") {
        dispatch({ type: "inputDigit", digit: Number(event.key) as Digit });
        event.preventDefault();
        return;
      }

      switch (event.key) {
        case "Backspace":
        case "Delete":
        case "0":
          dispatch({ type: "eraseCell" });
          event.preventDefault();
          break;
        case "n":
        case "N":
          dispatch({ type: "toggleNoteMode" });
          event.preventDefault();
          break;
        case "h":
        case "H":
          dispatch({ type: "requestHint" });
          event.preventDefault();
          break;
        case "ArrowUp":
          dispatch({ type: "moveSelection", deltaRow: -1, deltaCol: 0 });
          event.preventDefault();
          break;
        case "ArrowDown":
          dispatch({ type: "moveSelection", deltaRow: 1, deltaCol: 0 });
          event.preventDefault();
          break;
        case "ArrowLeft":
          dispatch({ type: "moveSelection", deltaRow: 0, deltaCol: -1 });
          event.preventDefault();
          break;
        case "ArrowRight":
          dispatch({ type: "moveSelection", deltaRow: 0, deltaCol: 1 });
          event.preventDefault();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [state.generating, state.pendingHint]);

  return {
    state,
    dispatch,
    startNewGame,
    startTutorial
  };
}
