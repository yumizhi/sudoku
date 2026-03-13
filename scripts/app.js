import {
  DIFFICULTY_CONFIG,
  GRID_SIZE,
  HISTORY_LIMIT,
  STORAGE_KEY,
  getTutorialById,
  isValidTutorialId
} from "./data.js";
import {
  clearPeerNotes,
  cloneGrid,
  cloneNotes,
  countClues,
  evaluateBoard,
  findFirstEditableCell,
  findHiddenSingle,
  findNakedSingle,
  generatePuzzle,
  generateSolvedGrid,
  gridFromString,
  isValidBoolGrid,
  isValidGrid,
  isValidNoteGrid,
  isValidSelectedCell,
  makeBoolGrid,
  makeGrid,
  makeNoteGrid,
  normalizeNotes,
  toggleNote
} from "./core.js";
import {
  buildBoard,
  digitButtons,
  elements,
  formatTime,
  inspectButtons,
  renderAll,
  renderTutorialLevels,
  setMessage
} from "./ui.js";

const state = {
  difficulty: "medium",
  puzzle: makeGrid(0),
  solution: makeGrid(0),
  board: makeGrid(0),
  notes: makeNoteGrid(),
  fixed: makeBoolGrid(false),
  selected: null,
  focusDigit: null,
  focusScope: null,
  lastHint: null,
  noteMode: false,
  mistakes: 0,
  elapsedSeconds: 0,
  timerId: null,
  history: [],
  future: [],
  status: "idle",
  generating: false,
  mode: "normal",
  tutorialId: null
};

function startTimer() {
  stopTimer();
  state.timerId = window.setInterval(() => {
    if (state.status !== "playing" || state.generating) {
      return;
    }
    state.elapsedSeconds += 1;
    elements.timerLabel.textContent = formatTime(state.elapsedSeconds);
    saveState();
  }, 1000);
}

function stopTimer() {
  if (state.timerId !== null) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function makeSnapshot() {
  return {
    board: cloneGrid(state.board),
    notes: cloneNotes(state.notes),
    mistakes: state.mistakes,
    selected: state.selected ? { ...state.selected } : null,
    focusDigit: state.focusDigit,
    focusScope: state.focusScope,
    status: state.status
  };
}

function restoreSnapshot(snapshot) {
  state.board = cloneGrid(snapshot.board);
  state.notes = cloneNotes(snapshot.notes);
  state.mistakes = snapshot.mistakes;
  state.selected = snapshot.selected ? { ...snapshot.selected } : null;
  state.focusDigit = snapshot.focusDigit ?? null;
  state.focusScope = snapshot.focusScope ?? null;
  state.lastHint = null;
  state.status = snapshot.status ?? "playing";
}

function pushHistory() {
  state.history.push(makeSnapshot());
  if (state.history.length > HISTORY_LIMIT) {
    state.history.shift();
  }
  state.future = [];
}

function undoMove() {
  if (state.history.length === 0) {
    setMessage("没有可撤销的操作。", "info");
    return;
  }
  state.future.push(makeSnapshot());
  const previous = state.history.pop();
  restoreSnapshot(previous);
  if (state.status === "won") {
    stopTimer();
  } else if (state.timerId === null) {
    startTimer();
  }
  renderAll(state);
  saveState();
  setMessage("已撤销一步。", "info");
}

function redoMove() {
  if (state.future.length === 0) {
    setMessage("没有可重做的操作。", "info");
    return;
  }
  state.history.push(makeSnapshot());
  const next = state.future.pop();
  restoreSnapshot(next);
  if (state.status === "won") {
    stopTimer();
  } else if (state.timerId === null) {
    startTimer();
  }
  renderAll(state);
  saveState();
  setMessage("已重做一步。", "info");
}

function formatCellLabel(row, col) {
  return `R${row + 1}C${col + 1}`;
}

function formatUnitLabel(unitType, unitIndex) {
  if (unitType === "row") {
    return `第 ${unitIndex + 1} 行`;
  }
  if (unitType === "col") {
    return `第 ${unitIndex + 1} 列`;
  }
  return `第 ${unitIndex + 1} 宫`;
}

function buildHintDetail(rawHint) {
  if (!rawHint) {
    return null;
  }
  const cellLabel = formatCellLabel(rawHint.row, rawHint.col);
  if (rawHint.reason === "裸单") {
    return {
      row: rawHint.row,
      col: rawHint.col,
      value: rawHint.value,
      technique: "裸单",
      summary: `${cellLabel} 只剩一个合法候选 ${rawHint.value}，因此这一步可以直接成立。`,
      steps: [
        `先看 ${cellLabel} 的候选，它现在只剩 ${rawHint.value}。`,
        "同一行、同一列和同一个 3x3 宫已经把其他数字全部排除了。",
        `当一个空格只剩唯一候选时，这一步就是裸单，所以 ${cellLabel} = ${rawHint.value}。`
      ],
      focusDigit: rawHint.value,
      focusScope: "local"
    };
  }

  if (rawHint.reason === "隐藏单") {
    const unitLabel = formatUnitLabel(rawHint.unitType, rawHint.unitIndex);
    return {
      row: rawHint.row,
      col: rawHint.col,
      value: rawHint.value,
      technique: "隐藏单",
      summary: `在 ${unitLabel} 里，数字 ${rawHint.value} 只剩 ${cellLabel} 这一个落点，所以这一步成立。`,
      steps: [
        `先只观察数字 ${rawHint.value}，不要同时看其他数字。`,
        `在 ${unitLabel} 里，数字 ${rawHint.value} 最终只剩 ${cellLabel} 这一个位置能放。`,
        `虽然 ${cellLabel} 不一定只有一个候选，但对数字 ${rawHint.value} 来说它是唯一落点，所以 ${cellLabel} = ${rawHint.value}。`
      ],
      focusDigit: rawHint.value,
      focusScope: "global"
    };
  }

  return {
    row: rawHint.row,
    col: rawHint.col,
    value: rawHint.value,
    technique: "兜底揭示",
    summary: `当前盘面还没找到低阶逻辑提示，所以先揭示 ${cellLabel} = ${rawHint.value}，帮助你继续推进。`,
    steps: [
      `这一步不是严格的逻辑教学提示，而是直接告诉你 ${cellLabel} 的正确数字。`,
      "它用于你暂时卡住、又不想整盘停下来的时候。",
      "填入这个数字后，优先继续寻找新的裸单或隐藏单。"
    ],
    focusDigit: rawHint.value,
    focusScope: "local"
  };
}

function focusHint(hint) {
  state.selected = { row: hint.row, col: hint.col };
  state.focusDigit = hint.focusDigit ?? null;
  state.focusScope = hint.focusScope ?? null;
}

function findHint() {
  const naked = findNakedSingle(state.board);
  if (naked) {
    return buildHintDetail(naked);
  }
  const hidden = findHiddenSingle(state.board);
  if (hidden) {
    return buildHintDetail(hidden);
  }
  const empties = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (state.board[row][col] === 0) {
        empties.push([row, col]);
      }
    }
  }
  if (empties.length === 0) {
    return null;
  }
  const [row, col] = empties[Math.floor(Math.random() * empties.length)];
  return buildHintDetail({ row, col, value: state.solution[row][col], reason: "兜底提示" });
}

function checkWin() {
  const result = evaluateBoard(state.board, state.solution);
  if (result.empty === 0 && result.wrong === 0 && result.conflicts.size === 0) {
    state.status = "won";
    stopTimer();
    renderAll(state);
    saveState();
    if (state.mode === "tutorial") {
      const level = getTutorialById(state.tutorialId);
      const levelName = level ? level.title : "教程关卡";
      setMessage(
        `${levelName} 完成！用时 ${formatTime(state.elapsedSeconds)}，累计错误 ${state.mistakes} 次。`,
        "success"
      );
    } else {
      setMessage(
        `完成！用时 ${formatTime(state.elapsedSeconds)}，累计错误 ${state.mistakes} 次。`,
        "success"
      );
    }
    return true;
  }
  return false;
}

function applyDigitInput(digit, options = {}) {
  const fromHint = options.fromHint === true;
  if (!state.selected) {
    return;
  }
  const { row, col } = state.selected;
  if (state.fixed[row][col]) {
    if (!fromHint) {
      setMessage("题目给定数字不能修改。", "warn");
    }
    return;
  }

  if (state.noteMode && !fromHint) {
    if (state.board[row][col] !== 0) {
      setMessage("该格已有数字，请先擦除后再做笔记。", "warn");
      return;
    }
    pushHistory();
    toggleNote(state.notes, row, col, digit);
    renderAll(state);
    saveState();
    return;
  }

  if (state.board[row][col] === digit && !fromHint) {
    renderAll(state);
    return;
  }

  pushHistory();
  state.board[row][col] = digit;
  state.notes[row][col] = [];
  clearPeerNotes(state.notes, row, col, digit);
  state.lastHint = null;
  state.focusDigit = null;
  state.focusScope = null;
  state.status = "playing";

  if (!fromHint) {
    if (digit !== state.solution[row][col]) {
      state.mistakes += 1;
      setMessage("输入与答案不一致，已保留并标记，建议回查。", "warn");
    } else {
      setMessage("已填入数字。", "info");
    }
  }

  renderAll(state);
  saveState();
  checkWin();
}

function eraseSelectedCell() {
  if (!state.selected) {
    return;
  }
  const { row, col } = state.selected;
  if (state.fixed[row][col]) {
    setMessage("题目给定数字不能擦除。", "warn");
    return;
  }
  if (state.board[row][col] === 0 && state.notes[row][col].length === 0) {
    return;
  }
  pushHistory();
  state.board[row][col] = 0;
  state.notes[row][col] = [];
  state.lastHint = null;
  state.focusDigit = null;
  state.focusScope = null;
  state.status = "playing";
  renderAll(state);
  saveState();
  setMessage("已擦除该格。", "info");
}

function toggleNoteMode(forceValue) {
  state.noteMode = typeof forceValue === "boolean" ? forceValue : !state.noteMode;
  renderAll(state);
  saveState();
  setMessage(state.noteMode ? "笔记模式已开启。" : "笔记模式已关闭。", "info");
}

function selectCell(row, col) {
  state.selected = { row, col };
  state.focusDigit = null;
  state.focusScope = null;
  renderAll(state);
}

function moveSelection(deltaRow, deltaCol) {
  if (!state.selected) {
    state.selected = { row: 0, col: 0 };
    renderAll(state);
    return;
  }
  const row = (state.selected.row + deltaRow + GRID_SIZE) % GRID_SIZE;
  const col = (state.selected.col + deltaCol + GRID_SIZE) % GRID_SIZE;
  selectCell(row, col);
}

function giveHint() {
  if (state.status === "won") {
    setMessage("本局已完成，可新开一局。", "success");
    return;
  }
  const hint = findHint();
  if (!hint) {
    setMessage("没有可提示的空格。", "info");
    return;
  }
  state.lastHint = hint;
  focusHint(hint);
  renderAll(state);
  saveState();
  setMessage(
    `已定位提示：${hint.technique}。先读右侧“逻辑提示”，需要时再点“应用这一步”。`,
    "info"
  );
}

function applyHintMove() {
  if (!state.lastHint) {
    setMessage("先生成一条提示。", "info");
    return;
  }

  const hint = state.lastHint;
  const currentValue = state.board[hint.row][hint.col];
  if (currentValue === hint.value) {
    state.lastHint = null;
    renderAll(state);
    setMessage("这一步已经完成了。", "info");
    return;
  }
  if (currentValue !== 0 && currentValue !== hint.value) {
    state.lastHint = null;
    renderAll(state);
    setMessage("提示目标格当前已有其他数字，请先处理该格。", "warn");
    return;
  }

  focusHint(hint);
  applyDigitInput(hint.value, { fromHint: true });
  state.lastHint = null;
  renderAll(state);
  saveState();
  if (state.status !== "won") {
    setMessage(
      `已应用提示：${formatCellLabel(hint.row, hint.col)} = ${hint.value}（${hint.technique}）。`,
      "info"
    );
  }
}

function checkBoard() {
  if (checkWin()) {
    return;
  }
  const result = evaluateBoard(state.board, state.solution);
  if (result.wrong === 0 && result.conflicts.size === 0) {
    const progress = Math.round(((GRID_SIZE * GRID_SIZE - result.empty) / (GRID_SIZE * GRID_SIZE)) * 100);
    setMessage(`当前无冲突，完成度 ${progress}%。`, "info");
  } else {
    setMessage(
      `检测到 ${result.wrong} 个答案偏差格，${result.conflicts.size} 个冲突格。`,
      "warn"
    );
  }
  renderAll(state);
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function setActionsDisabled(disabled) {
  const controls = [
    elements.newGameBtn,
    elements.hintBtn,
    elements.applyHintBtn,
    elements.checkBtn,
    elements.eraseBtn,
    elements.noteBtn,
    elements.undoBtn,
    elements.redoBtn,
    elements.difficultySelect
  ];
  for (const control of controls) {
    control.disabled = disabled;
  }
  for (const button of digitButtons) {
    button.disabled = disabled;
  }
  for (const button of inspectButtons) {
    button.disabled = disabled;
  }
  const tutorialButtons = elements.tutorialList.querySelectorAll("[data-tutorial-id]");
  for (const button of tutorialButtons) {
    button.disabled = disabled;
  }
}

function loadPuzzleState(payload) {
  state.solution = cloneGrid(payload.solution);
  state.puzzle = cloneGrid(payload.puzzle);
  state.board = cloneGrid(payload.puzzle);
  state.notes = makeNoteGrid();
  state.fixed = payload.puzzle.map((row) => row.map((value) => value !== 0));
  state.selected = findFirstEditableCell(payload.puzzle);
  state.focusDigit = payload.focusDigit ?? null;
  state.focusScope = payload.focusScope ?? null;
  state.lastHint = null;
  state.noteMode = false;
  state.mistakes = 0;
  state.elapsedSeconds = 0;
  state.history = [];
  state.future = [];
  state.status = "playing";
}

async function startTutorialLevel(levelId) {
  if (state.generating) {
    return;
  }
  const level = getTutorialById(levelId);
  if (!level) {
    setMessage("教程关卡不存在。", "warn");
    return;
  }
  state.generating = true;
  setActionsDisabled(true);
  setMessage(`正在加载 ${level.title}...`, "info");
  await sleep(20);
  try {
    const puzzle = gridFromString(level.puzzle, true);
    const solution = gridFromString(level.solution, false);
    if (!puzzle || !solution) {
      throw new Error(`Invalid tutorial level data: ${level.id}`);
    }
    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        if (puzzle[row][col] !== 0 && puzzle[row][col] !== solution[row][col]) {
          throw new Error(`Tutorial puzzle mismatch at ${level.id} R${row + 1}C${col + 1}`);
        }
      }
    }
    state.mode = "tutorial";
    state.tutorialId = level.id;
    loadPuzzleState({ puzzle, solution, focusDigit: null });
    stopTimer();
    startTimer();
    renderAll(state);
    saveState();
    const clueCount = countClues(puzzle);
    const guideText = Number.isInteger(level.guideDigit) ? `先从“全局观察”里的数字 ${level.guideDigit} 开始。` : "";
    setMessage(
      `${level.title} 已开始（给定 ${clueCount} 个数字）。${guideText}`,
      "info"
    );
  } catch (error) {
    console.error(error);
    setMessage("教程加载失败，请重试。", "warn");
  } finally {
    state.generating = false;
    setActionsDisabled(false);
  }
}

async function startNewGame() {
  if (state.generating) {
    return;
  }
  state.generating = true;
  setActionsDisabled(true);
  setMessage("正在生成新棋盘...", "info");
  await sleep(20);
  try {
    const difficulty = elements.difficultySelect.value;
    const solution = generateSolvedGrid();
    const puzzle = generatePuzzle(solution, difficulty);
    state.difficulty = difficulty;
    state.mode = "normal";
    state.tutorialId = null;
    loadPuzzleState({ puzzle, solution, focusDigit: null });
    stopTimer();
    startTimer();
    renderAll(state);
    saveState();
    const clueCount = countClues(puzzle);
    setMessage(
      `新游戏已开始（${DIFFICULTY_CONFIG[difficulty].label}，给定 ${clueCount} 个数字）。`,
      "info"
    );
  } catch (error) {
    console.error(error);
    setMessage("生成棋盘失败，请重试。", "warn");
  } finally {
    state.generating = false;
    setActionsDisabled(false);
  }
}

function serializeState() {
  return {
    version: 1,
    difficulty: state.difficulty,
    puzzle: cloneGrid(state.puzzle),
    solution: cloneGrid(state.solution),
    board: cloneGrid(state.board),
    notes: cloneNotes(state.notes),
    fixed: state.fixed.map((row) => [...row]),
    selected: state.selected ? { ...state.selected } : null,
    focusDigit: state.focusDigit,
    focusScope: state.focusScope,
    noteMode: state.noteMode,
    mistakes: state.mistakes,
    elapsedSeconds: state.elapsedSeconds,
    status: state.status === "won" ? "won" : "playing",
    mode: state.mode,
    tutorialId: state.tutorialId
  };
}

function saveState() {
  if (state.status !== "playing" && state.status !== "won") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
  } catch (error) {
    console.warn("Save failed:", error);
  }
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return false;
  }
  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !DIFFICULTY_CONFIG[parsed.difficulty] ||
      !isValidGrid(parsed.puzzle, true) ||
      !isValidGrid(parsed.solution, false) ||
      !isValidGrid(parsed.board, true) ||
      !isValidNoteGrid(parsed.notes) ||
      !isValidBoolGrid(parsed.fixed) ||
      !isValidSelectedCell(parsed.selected) ||
      !(parsed.focusDigit === null || (Number.isInteger(parsed.focusDigit) && parsed.focusDigit >= 1 && parsed.focusDigit <= GRID_SIZE)) ||
      !(parsed.focusScope === null || parsed.focusScope === "local" || parsed.focusScope === "global") ||
      typeof parsed.noteMode !== "boolean" ||
      !Number.isInteger(parsed.mistakes) ||
      parsed.mistakes < 0 ||
      !Number.isInteger(parsed.elapsedSeconds) ||
      parsed.elapsedSeconds < 0 ||
      (parsed.status !== "playing" && parsed.status !== "won") ||
      (parsed.mode !== "normal" && parsed.mode !== "tutorial") ||
      !(parsed.tutorialId === null || isValidTutorialId(parsed.tutorialId))
    ) {
      return false;
    }
    state.difficulty = parsed.difficulty;
    elements.difficultySelect.value = parsed.difficulty;
    state.puzzle = cloneGrid(parsed.puzzle);
    state.solution = cloneGrid(parsed.solution);
    state.board = cloneGrid(parsed.board);
    state.notes = normalizeNotes(parsed.notes);
    state.fixed = parsed.fixed.map((row) => [...row]);
    state.selected = parsed.selected ? { ...parsed.selected } : findFirstEditableCell(parsed.board);
    state.focusDigit = parsed.focusDigit;
    state.focusScope = parsed.focusScope ?? null;
    state.lastHint = null;
    state.noteMode = parsed.noteMode;
    state.mistakes = parsed.mistakes;
    state.elapsedSeconds = parsed.elapsedSeconds;
    state.history = [];
    state.future = [];
    state.status = parsed.status;
    state.mode = parsed.mode;
    state.tutorialId = parsed.mode === "tutorial" ? parsed.tutorialId : null;
    if (state.mode === "tutorial" && !state.tutorialId) {
      return false;
    }
    renderAll(state);
    if (state.mode === "tutorial") {
      const level = getTutorialById(state.tutorialId);
      if (level) {
        setMessage(`已恢复教程进度：${level.title}。`, "info");
      }
    }
    if (state.status === "playing") {
      startTimer();
      if (state.mode !== "tutorial") {
        setMessage("已恢复上次进度。", "info");
      }
    } else {
      stopTimer();
      if (state.mode === "tutorial") {
        const level = getTutorialById(state.tutorialId);
        const levelName = level ? level.title : "教程关卡";
        setMessage(`你已完成 ${levelName}，可开始新游戏或其他关卡。`, "success");
      } else {
        setMessage("你已完成上一局，可直接开始新游戏。", "success");
      }
    }
    return true;
  } catch (error) {
    console.warn("Load failed:", error);
    return false;
  }
}

function handleBoardClick(event) {
  const cell = event.target.closest(".cell");
  if (!cell || state.generating) {
    return;
  }
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);
  selectCell(row, col);
}

function handleNumberPadClick(event) {
  const button = event.target.closest(".digit-btn");
  if (!button || state.generating) {
    return;
  }
  const digit = Number(button.dataset.digit);
  const editableSelected = state.selected && !state.fixed[state.selected.row][state.selected.col];
  if (editableSelected) {
    state.focusDigit = null;
    state.focusScope = null;
    applyDigitInput(digit);
    return;
  }
  state.focusDigit = state.focusDigit === digit ? null : digit;
  state.focusScope = state.focusDigit === null ? null : "global";
  renderAll(state);
  saveState();
}

function handleCandidatePreviewClick(event) {
  const button = event.target.closest("[data-preview-digit]");
  if (!button || state.generating || !state.selected) {
    return;
  }
  const { row, col } = state.selected;
  if (state.fixed[row][col] || state.board[row][col] !== 0) {
    return;
  }
  const digit = Number(button.dataset.previewDigit);
  state.focusDigit = state.focusScope === "local" && state.focusDigit === digit ? null : digit;
  state.focusScope = state.focusDigit === null ? null : "local";
  renderAll(state);
  saveState();
}

function handleGlobalInspectClick(event) {
  const button = event.target.closest("[data-inspect-digit]");
  if (!button || state.generating) {
    return;
  }
  const digit = Number(button.dataset.inspectDigit);
  state.focusDigit = state.focusScope === "global" && state.focusDigit === digit ? null : digit;
  state.focusScope = state.focusDigit === null ? null : "global";
  renderAll(state);
  saveState();
}

function handleTutorialClick(event) {
  const button = event.target.closest("[data-tutorial-id]");
  if (!button) {
    return;
  }
  const levelId = button.dataset.tutorialId;
  void startTutorialLevel(levelId);
}

function handleKeydown(event) {
  if (state.generating) {
    return;
  }
  const activeTag = document.activeElement ? document.activeElement.tagName : "";
  if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
    return;
  }
  if (event.key >= "1" && event.key <= "9") {
    if (!state.selected) {
      state.selected = { row: 0, col: 0 };
    }
    applyDigitInput(Number(event.key));
    event.preventDefault();
    return;
  }
  switch (event.key) {
    case "Backspace":
    case "Delete":
    case "0":
      eraseSelectedCell();
      event.preventDefault();
      break;
    case "n":
    case "N":
      toggleNoteMode();
      event.preventDefault();
      break;
    case "h":
    case "H":
      giveHint();
      event.preventDefault();
      break;
    case "ArrowUp":
      moveSelection(-1, 0);
      event.preventDefault();
      break;
    case "ArrowDown":
      moveSelection(1, 0);
      event.preventDefault();
      break;
    case "ArrowLeft":
      moveSelection(0, -1);
      event.preventDefault();
      break;
    case "ArrowRight":
      moveSelection(0, 1);
      event.preventDefault();
      break;
    default:
      break;
  }
}

function bindEvents() {
  elements.board.addEventListener("click", handleBoardClick);
  elements.numberPad.addEventListener("click", handleNumberPadClick);
  elements.candidatePreview.addEventListener("click", handleCandidatePreviewClick);
  elements.digitInspector.addEventListener("click", handleGlobalInspectClick);
  elements.tutorialList.addEventListener("click", handleTutorialClick);
  elements.newGameBtn.addEventListener("click", () => {
    void startNewGame();
  });
  elements.hintBtn.addEventListener("click", giveHint);
  elements.applyHintBtn.addEventListener("click", applyHintMove);
  elements.checkBtn.addEventListener("click", checkBoard);
  elements.eraseBtn.addEventListener("click", eraseSelectedCell);
  elements.noteBtn.addEventListener("click", () => {
    toggleNoteMode();
  });
  elements.undoBtn.addEventListener("click", undoMove);
  elements.redoBtn.addEventListener("click", redoMove);
  elements.difficultySelect.addEventListener("change", (event) => {
    state.difficulty = event.target.value;
    saveState();
  });
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("beforeunload", saveState);
}

function init() {
  renderTutorialLevels();
  buildBoard();
  bindEvents();
  if (!loadState()) {
    void startNewGame();
  }
}

init();
