import { useEffect, useReducer } from "react";
import type { Dispatch } from "react";
import { DIFFICULTY_CONFIG, countClues, generateGameBundle } from "../../domain/sudoku";
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

  useEffect(() => {
    const saved = loadPersistedGame();
    if (saved) {
      dispatch({
        type: "replaceState",
        state: createGameStateFromPayload({
          ...saved,
          message: { text: "已恢复上次进度。", tone: "info" }
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
          dispatch({ type: "clearCell" });
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
  }, [state.generating]);

  return {
    state,
    dispatch,
    startNewGame
  };
}
