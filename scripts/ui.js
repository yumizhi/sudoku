import { BOX_SIZE, GRID_SIZE, TUTORIAL_LEVELS, getTutorialById } from "./data.js";
import {
  calculateConflicts,
  getCandidates,
  isPeer,
  makeCellKey
} from "./core.js";

export const elements = {
  board: document.getElementById("board"),
  numberPad: document.getElementById("numberPad"),
  difficultySelect: document.getElementById("difficultySelect"),
  timerLabel: document.getElementById("timerLabel"),
  modeLabel: document.getElementById("modeLabel"),
  message: document.getElementById("message"),
  overlayLayer: document.getElementById("overlayLayer"),
  cellPanel: document.getElementById("cellPanel"),
  inspectPanel: document.getElementById("inspectPanel"),
  tutorialPanel: document.getElementById("tutorialPanel"),
  openCellPanelBtn: document.getElementById("openCellPanelBtn"),
  openInspectPanelBtn: document.getElementById("openInspectPanelBtn"),
  openTutorialPanelBtn: document.getElementById("openTutorialPanelBtn"),
  cellBadge: document.getElementById("cellBadge"),
  cellSummary: document.getElementById("cellSummary"),
  candidatePreview: document.getElementById("candidatePreview"),
  globalInspectBadge: document.getElementById("globalInspectBadge"),
  digitInspector: document.getElementById("digitInspector"),
  tutorialDetailTitle: document.getElementById("tutorialDetailTitle"),
  tutorialDetailTag: document.getElementById("tutorialDetailTag"),
  tutorialDetailSummary: document.getElementById("tutorialDetailSummary"),
  tutorialDetailSteps: document.getElementById("tutorialDetailSteps"),
  tutorialList: document.getElementById("tutorialList"),
  newGameBtn: document.getElementById("newGameBtn"),
  hintBtn: document.getElementById("hintBtn"),
  checkBtn: document.getElementById("checkBtn"),
  eraseBtn: document.getElementById("eraseBtn"),
  noteBtn: document.getElementById("noteBtn"),
  undoBtn: document.getElementById("undoBtn"),
  redoBtn: document.getElementById("redoBtn")
};

export const digitButtons = Array.from(document.querySelectorAll(".digit-btn"));
export const inspectButtons = Array.from(document.querySelectorAll(".inspect-digit-btn"));
export const cellElements = [];

export function buildBoard() {
  elements.board.innerHTML = "";
  cellElements.length = 0;
  for (let row = 0; row < GRID_SIZE; row += 1) {
    const line = [];
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute("role", "gridcell");
      const topStrong = row === 0;
      const leftStrong = col === 0;
      const rightStrong = (col + 1) % BOX_SIZE === 0;
      const bottomStrong = (row + 1) % BOX_SIZE === 0;
      cell.style.setProperty("--b-top", topStrong ? "2.5px" : "1px");
      cell.style.setProperty("--b-left", leftStrong ? "2.5px" : "1px");
      cell.style.setProperty("--b-right", rightStrong ? "2.5px" : "1px");
      cell.style.setProperty("--b-bottom", bottomStrong ? "2.5px" : "1px");
      cell.style.setProperty("--c-top", topStrong ? "var(--grid-box)" : "var(--grid)");
      cell.style.setProperty("--c-left", leftStrong ? "var(--grid-box)" : "var(--grid)");
      cell.style.setProperty("--c-right", rightStrong ? "var(--grid-box)" : "var(--grid)");
      cell.style.setProperty("--c-bottom", bottomStrong ? "var(--grid-box)" : "var(--grid)");
      elements.board.append(cell);
      line.push(cell);
    }
    cellElements.push(line);
  }
}

export function renderTutorialLevels(activeTutorialId = null) {
  elements.tutorialList.innerHTML = TUTORIAL_LEVELS.map((level) => {
    const activeClass = level.id === activeTutorialId ? " active" : "";
    return (
      `<article class="tutorial-card${activeClass}" data-level-card="${level.id}">` +
      `<h3>${level.title}</h3>` +
      `<p>${level.summary}</p>` +
      `<div class="tutorial-meta">` +
      `<span class="tag">${level.technique}</span>` +
      `<button class="btn-secondary" type="button" data-tutorial-id="${level.id}">开始</button>` +
      `</div>` +
      `</article>`
    );
  }).join("");
}

export function syncTutorialPanel(activeTutorialId) {
  const cards = elements.tutorialList.querySelectorAll("[data-level-card]");
  for (const card of cards) {
    card.classList.toggle("active", card.dataset.levelCard === activeTutorialId);
  }
}

export function renderModeLabel(state) {
  if (state.mode === "tutorial") {
    const level = getTutorialById(state.tutorialId);
    elements.modeLabel.textContent = level ? level.technique : "教程";
    return;
  }
  elements.modeLabel.textContent = "自由对局";
}

export function renderInspector(state) {
  if (!state.selected) {
    elements.cellBadge.textContent = "未选中";
    elements.cellSummary.textContent = "选中格子后显示位置、状态和候选。";
    elements.candidatePreview.innerHTML = '<div class="candidate-chip muted">-</div>';
    return;
  }

  const { row, col } = state.selected;
  const value = state.board[row][col];
  const isFixed = state.fixed[row][col];
  const isEmpty = value === 0;
  const label = `R${row + 1}C${col + 1}`;
  const candidates = isEmpty ? getCandidates(state.board, row, col) : [];

  if (isFixed) {
    elements.cellBadge.textContent = `${label} 给定`;
    elements.cellSummary.textContent = `题目给定 ${value}，不可修改。`;
    elements.candidatePreview.innerHTML = `<div class="candidate-chip muted">${value}</div>`;
    return;
  }

  if (!isEmpty) {
    elements.cellBadge.textContent = `${label} 已填`;
    elements.cellSummary.textContent = `当前填入 ${value}。先擦除再修改。`;
    elements.candidatePreview.innerHTML = `<div class="candidate-chip active">${value}</div>`;
    return;
  }

  elements.cellBadge.textContent = `${label} 空格`;
  if (candidates.length === 0) {
    elements.cellSummary.textContent = "当前无合法候选，附近已有冲突。";
    elements.candidatePreview.innerHTML = '<div class="candidate-chip muted">无候选</div>';
    return;
  }

  elements.cellSummary.textContent =
    candidates.length === 1
      ? `只剩候选 ${candidates[0]}，可直接落子。`
      : `剩 ${candidates.length} 个候选。点数字可做局部预览。`;
  elements.candidatePreview.innerHTML = candidates
    .map((digit) => {
      const active = state.focusScope === "local" && state.focusDigit === digit ? " active" : "";
      return `<button class="candidate-chip${active}" type="button" data-preview-digit="${digit}">${digit}</button>`;
    })
    .join("");
}

export function renderGlobalInspector(state) {
  const activeDigit = state.focusScope === "global" ? state.focusDigit : null;
  elements.globalInspectBadge.textContent = activeDigit === null ? "关闭" : `数字 ${activeDigit}`;
  for (const button of inspectButtons) {
    const digit = Number(button.dataset.inspectDigit);
    button.classList.toggle("active", activeDigit === digit);
  }
}

export function renderTutorialDetail(state) {
  const defaultSteps = [
    "先选中空格，再看“当前格”里的候选。",
    "需要扫整盘时，用“全局观察”单独看一个数字。",
    "先做裸单、隐藏单，再考虑锁定候选和 X-Wing。"
  ];

  if (state.mode !== "tutorial") {
    elements.tutorialDetailTitle.textContent = "教程解析";
    elements.tutorialDetailTag.textContent = "自由对局";
    elements.tutorialDetailSummary.textContent = "自由对局保留一套固定观察顺序：当前格、整盘数字、再回到输入。";
    elements.tutorialDetailSteps.innerHTML = defaultSteps
      .map(
        (step, index) =>
          `<div class="tutorial-step"><span class="tutorial-step-index">${index + 1}</span><p>${step}</p></div>`
      )
      .join("");
    return;
  }

  const level = getTutorialById(state.tutorialId);
  if (!level) {
    elements.tutorialDetailTitle.textContent = "教程解析";
    elements.tutorialDetailTag.textContent = "教程";
    elements.tutorialDetailSummary.textContent = "当前教程数据缺失。";
    elements.tutorialDetailSteps.innerHTML = "";
    return;
  }

  elements.tutorialDetailTitle.textContent = level.title;
  elements.tutorialDetailTag.textContent = level.technique;
  elements.tutorialDetailSummary.textContent = `${level.objective} ${level.summary}`;
  elements.tutorialDetailSteps.innerHTML = level.steps
    .map(
      (step, index) =>
        `<div class="tutorial-step"><span class="tutorial-step-index">${index + 1}</span><p>${step}</p></div>`
    )
    .join("");
}

export function setMessage(text, type = "info") {
  elements.message.textContent = text;
  elements.message.dataset.type = type;
}

export function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function makeNotesMarkup(notes) {
  const noteSet = new Set(notes);
  let html = '<div class="notes">';
  for (let n = 1; n <= GRID_SIZE; n += 1) {
    html += `<span>${noteSet.has(n) ? n : ""}</span>`;
  }
  html += "</div>";
  return html;
}

function makeCellAriaLabel(state, row, col, value) {
  const base = `第${row + 1}行第${col + 1}列`;
  if (value !== 0) {
    return state.fixed[row][col] ? `${base}，数字 ${value}，题目给定` : `${base}，数字 ${value}`;
  }
  if (state.notes[row][col].length > 0) {
    return `${base}，笔记 ${state.notes[row][col].join(" ")}`;
  }
  return `${base}，空格`;
}

export function renderBoard(state) {
  const conflicts = calculateConflicts(state.board);
  const selected = state.selected;
  const selectedValue = selected ? state.board[selected.row][selected.col] : 0;
  const hasDigitFocus = state.focusDigit !== null;
  const hasLocalDigitPreview =
    hasDigitFocus &&
    state.focusScope === "local" &&
    selected &&
    !state.fixed[selected.row][selected.col] &&
    selectedValue === 0;
  const hasGlobalDigitFocus = hasDigitFocus && state.focusScope === "global";
  const hasCellLineFocus = !hasDigitFocus && selectedValue !== 0;

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const value = state.board[row][col];
      const cell = cellElements[row][col];
      cell.className = "cell";
      if (state.fixed[row][col]) {
        cell.classList.add("fixed");
      } else if (value !== 0) {
        cell.classList.add("user-filled");
      }
      if (selected && selected.row === row && selected.col === col) {
        cell.classList.add("selected");
      }
      if ((hasCellLineFocus || hasLocalDigitPreview) && selected && isPeer(selected.row, selected.col, row, col)) {
        cell.classList.add("related");
      }
      if (hasCellLineFocus && value === selectedValue) {
        cell.classList.add("same-value");
      }
      if (conflicts.has(makeCellKey(row, col))) {
        cell.classList.add("conflict");
      } else if (
        state.showValidation &&
        !state.fixed[row][col] &&
        value !== 0 &&
        value !== state.solution[row][col]
      ) {
        cell.classList.add("mistake");
      }
      if (hasLocalDigitPreview && selected) {
        if (row === selected.row && col === selected.col) {
          cell.classList.add("preview-source");
          cell.classList.add("digit-possible");
        } else if (isPeer(selected.row, selected.col, row, col) && value === state.focusDigit) {
          cell.classList.add("digit-match");
        }
      } else if (hasGlobalDigitFocus) {
        if (value === state.focusDigit) {
          cell.classList.add("digit-match");
        } else if (value === 0) {
          const candidates = getCandidates(state.board, row, col);
          if (candidates.includes(state.focusDigit)) {
            cell.classList.add("digit-possible");
          }
        }
      }
      if (value !== 0) {
        cell.textContent = String(value);
      } else if (state.notes[row][col].length > 0) {
        cell.innerHTML = makeNotesMarkup(state.notes[row][col]);
      } else {
        cell.textContent = "";
      }
      cell.setAttribute("aria-label", makeCellAriaLabel(state, row, col, value));
    }
  }
}

export function renderPad(state) {
  const counts = Array(10).fill(0);
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const value = state.board[row][col];
      if (value > 0) {
        counts[value] += 1;
      }
    }
  }
  for (const button of digitButtons) {
    const digit = Number(button.dataset.digit);
    const countEl = button.querySelector(".count");
    button.classList.toggle("complete", counts[digit] === GRID_SIZE);
    if (countEl) {
      countEl.textContent = `${counts[digit]}/${GRID_SIZE}`;
    }
  }
  elements.noteBtn.classList.toggle("active", state.noteMode);
  elements.noteBtn.setAttribute("aria-pressed", state.noteMode ? "true" : "false");
}

export function renderAll(state) {
  renderBoard(state);
  renderPad(state);
  renderModeLabel(state);
  renderInspector(state);
  renderGlobalInspector(state);
  renderTutorialDetail(state);
  syncTutorialPanel(state.tutorialId);
  elements.timerLabel.textContent = formatTime(state.elapsedSeconds);
}
