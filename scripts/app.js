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
  tutorialId: null,
  showValidation: false
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
  state.showValidation = false;
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

const PANEL_DEFAULT_POSITIONS = {
  cell: { x: 18, y: 88 },
  inspect: { x: 580, y: 88 },
  tutorial: { x: 220, y: 186 }
};

const overlayPanels = [elements.cellPanel, elements.inspectPanel, elements.tutorialPanel];
let overlayTopZIndex = 54;
let activeDrag = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function bringPanelToFront(panel) {
  overlayTopZIndex += 1;
  panel.style.zIndex = String(overlayTopZIndex);
}

function getPanelBounds(panel) {
  const width = panel.offsetWidth;
  const height = panel.offsetHeight;
  const maxX = Math.max(0, window.innerWidth - width - 8);
  const maxY = Math.max(0, window.innerHeight - height - 8);
  return { maxX, maxY };
}

function setPanelPosition(panel, x, y) {
  const { maxX, maxY } = getPanelBounds(panel);
  const clampedX = clamp(x, 8, maxX);
  const clampedY = clamp(y, 8, maxY);
  panel.style.left = `${clampedX}px`;
  panel.style.top = `${clampedY}px`;
}

function closeOverlayPanel(panel) {
  panel.hidden = true;
}

function closeOverlayPanels() {
  for (const panel of overlayPanels) {
    closeOverlayPanel(panel);
  }
}

function openOverlayPanel(panel) {
  if (panel.hidden) {
    panel.hidden = false;
    const panelKey = panel.dataset.panel;
    const defaultPos = PANEL_DEFAULT_POSITIONS[panelKey] ?? { x: 120, y: 120 };
    setPanelPosition(panel, defaultPos.x, defaultPos.y);
  }
  bringPanelToFront(panel);
}

function toggleOverlayPanel(panel) {
  if (panel.hidden) {
    openOverlayPanel(panel);
  } else {
    closeOverlayPanel(panel);
  }
}

function beginPanelDrag(event, panel) {
  if (event.button !== 0) {
    return;
  }
  const rect = panel.getBoundingClientRect();
  bringPanelToFront(panel);
  activeDrag = {
    panel,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  };
  panel.classList.add("dragging");
}

function moveActivePanelDrag(event) {
  if (!activeDrag) {
    return;
  }
  const nextX = event.clientX - activeDrag.offsetX;
  const nextY = event.clientY - activeDrag.offsetY;
  setPanelPosition(activeDrag.panel, nextX, nextY);
}

function endPanelDrag() {
  if (!activeDrag) {
    return;
  }
  activeDrag.panel.classList.remove("dragging");
  activeDrag = null;
}

function initOverlayPanels() {
  for (const panel of overlayPanels) {
    const panelKey = panel.dataset.panel;
    const defaultPos = PANEL_DEFAULT_POSITIONS[panelKey] ?? { x: 120, y: 120 };
    panel.style.left = `${defaultPos.x}px`;
    panel.style.top = `${defaultPos.y}px`;
    panel.addEventListener("pointerdown", () => {
      bringPanelToFront(panel);
    });
  }
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
        `${levelName} 完成！用时 ${formatTime(state.elapsedSeconds)}。`,
        "success"
      );
    } else {
      setMessage(
        `完成！用时 ${formatTime(state.elapsedSeconds)}。`,
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
    return;
  }

  if (state.noteMode && !fromHint) {
    if (state.board[row][col] !== 0) {
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
  state.showValidation = false;

  if (!fromHint) {
    state.mistakes = 0;
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
  state.showValidation = false;
  renderAll(state);
  saveState();
}

function toggleNoteMode(forceValue) {
  state.noteMode = typeof forceValue === "boolean" ? forceValue : !state.noteMode;
  renderAll(state);
  saveState();
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
  focusHint(hint);
  applyDigitInput(hint.value, { fromHint: true });
  if (state.status !== "won") {
    setMessage(`提示：${formatCellLabel(hint.row, hint.col)} = ${hint.value}。`, "info");
  }
}

function checkBoard() {
  if (checkWin()) {
    return;
  }
  const result = evaluateBoard(state.board, state.solution);
  state.showValidation = true;
  if (result.wrong === 0 && result.conflicts.size === 0) {
    const progress = Math.round(((GRID_SIZE * GRID_SIZE - result.empty) / (GRID_SIZE * GRID_SIZE)) * 100);
    setMessage(`检查完成，当前没有标出的错误。进度 ${progress}%。`, "info");
  } else {
    setMessage("检查完成，已标出问题。", "info");
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
    elements.checkBtn,
    elements.eraseBtn,
    elements.noteBtn,
    elements.undoBtn,
    elements.redoBtn,
    elements.difficultySelect,
    elements.openCellPanelBtn,
    elements.openInspectPanelBtn,
    elements.openTutorialPanelBtn
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
  state.showValidation = false;
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
    const guideText = Number.isInteger(level.guideDigit) ? `先用“全局观察”看数字 ${level.guideDigit}。` : "";
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
    state.showValidation = false;
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

function handleOverlayClick(event) {
  const closeButton = event.target.closest("[data-close-panel]");
  if (!closeButton) {
    return;
  }
  const panel = event.target.closest(".overlay-panel");
  if (panel) {
    closeOverlayPanel(panel);
  }
}

function handleKeydown(event) {
  if (event.key === "Escape") {
    closeOverlayPanels();
    event.preventDefault();
    return;
  }
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
  elements.overlayLayer.addEventListener("click", handleOverlayClick);
  elements.overlayLayer.addEventListener("pointerdown", (event) => {
    if (event.target.closest("[data-close-panel]")) {
      return;
    }
    const handle = event.target.closest("[data-drag-handle]");
    if (!handle) {
      return;
    }
    const panel = handle.closest(".overlay-panel");
    if (!panel) {
      return;
    }
    beginPanelDrag(event, panel);
  });
  window.addEventListener("pointermove", moveActivePanelDrag);
  window.addEventListener("pointerup", endPanelDrag);
  elements.newGameBtn.addEventListener("click", () => {
    void startNewGame();
  });
  elements.openCellPanelBtn.addEventListener("click", () => {
    toggleOverlayPanel(elements.cellPanel);
  });
  elements.openInspectPanelBtn.addEventListener("click", () => {
    toggleOverlayPanel(elements.inspectPanel);
  });
  elements.openTutorialPanelBtn.addEventListener("click", () => {
    toggleOverlayPanel(elements.tutorialPanel);
  });
  elements.hintBtn.addEventListener("click", giveHint);
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
  window.addEventListener("resize", () => {
    for (const panel of overlayPanels) {
      if (panel.hidden) {
        continue;
      }
      const left = Number.parseFloat(panel.style.left || "0");
      const top = Number.parseFloat(panel.style.top || "0");
      setPanelPosition(panel, Number.isFinite(left) ? left : 8, Number.isFinite(top) ? top : 8);
    }
  });
  window.addEventListener("beforeunload", saveState);
}

function init() {
  renderTutorialLevels();
  buildBoard();
  initOverlayPanels();
  bindEvents();
  if (!loadState()) {
    void startNewGame();
  }
}

init();
