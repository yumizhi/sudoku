import {
  BOX_SIZE,
  DIFFICULTY_CONFIG,
  GRID_SIZE
} from "./data.js";

export function makeGrid(fillValue) {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(fillValue));
}

export function makeBoolGrid(fillValue) {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(fillValue));
}

export function makeNoteGrid() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => [])
  );
}

export function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

export function cloneNotes(notes) {
  return notes.map((row) => row.map((cell) => [...cell]));
}

export function gridFromString(value, allowZero) {
  if (typeof value !== "string" || value.length !== GRID_SIZE * GRID_SIZE) {
    return null;
  }
  const grid = makeGrid(0);
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch < "0" || ch > "9") {
      return null;
    }
    const digit = Number(ch);
    if (allowZero) {
      if (digit < 0 || digit > GRID_SIZE) {
        return null;
      }
    } else if (digit < 1 || digit > GRID_SIZE) {
      return null;
    }
    const row = Math.floor(i / GRID_SIZE);
    const col = i % GRID_SIZE;
    grid[row][col] = digit;
  }
  return grid;
}

export function boxStart(index) {
  return Math.floor(index / BOX_SIZE) * BOX_SIZE;
}

export function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function isSafe(grid, row, col, value) {
  for (let i = 0; i < GRID_SIZE; i += 1) {
    if (grid[row][i] === value || grid[i][col] === value) {
      return false;
    }
  }
  const startRow = boxStart(row);
  const startCol = boxStart(col);
  for (let r = startRow; r < startRow + BOX_SIZE; r += 1) {
    for (let c = startCol; c < startCol + BOX_SIZE; c += 1) {
      if (grid[r][c] === value) {
        return false;
      }
    }
  }
  return true;
}

export function getCandidates(grid, row, col) {
  if (grid[row][col] !== 0) {
    return [];
  }
  const used = new Set();
  for (let i = 0; i < GRID_SIZE; i += 1) {
    if (grid[row][i] !== 0) {
      used.add(grid[row][i]);
    }
    if (grid[i][col] !== 0) {
      used.add(grid[i][col]);
    }
  }
  const startRow = boxStart(row);
  const startCol = boxStart(col);
  for (let r = startRow; r < startRow + BOX_SIZE; r += 1) {
    for (let c = startCol; c < startCol + BOX_SIZE; c += 1) {
      if (grid[r][c] !== 0) {
        used.add(grid[r][c]);
      }
    }
  }
  const candidates = [];
  for (let n = 1; n <= GRID_SIZE; n += 1) {
    if (!used.has(n)) {
      candidates.push(n);
    }
  }
  return candidates;
}

export function findCellWithFewestCandidates(grid) {
  let best = null;
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] !== 0) {
        continue;
      }
      const candidates = getCandidates(grid, row, col);
      if (candidates.length === 0) {
        return { row, col, candidates };
      }
      if (!best || candidates.length < best.candidates.length) {
        best = { row, col, candidates };
        if (candidates.length === 1) {
          return best;
        }
      }
    }
  }
  return best;
}

export function solveGrid(grid, randomized) {
  const next = findCellWithFewestCandidates(grid);
  if (!next) {
    return true;
  }
  if (next.candidates.length === 0) {
    return false;
  }
  const choices = randomized ? shuffled(next.candidates) : next.candidates;
  for (const value of choices) {
    grid[next.row][next.col] = value;
    if (solveGrid(grid, randomized)) {
      return true;
    }
  }
  grid[next.row][next.col] = 0;
  return false;
}

export function countSolutions(grid, limit = 2) {
  let count = 0;
  function dfs() {
    if (count >= limit) {
      return;
    }
    const next = findCellWithFewestCandidates(grid);
    if (!next) {
      count += 1;
      return;
    }
    if (next.candidates.length === 0) {
      return;
    }
    for (const value of next.candidates) {
      grid[next.row][next.col] = value;
      dfs();
      if (count >= limit) {
        break;
      }
    }
    grid[next.row][next.col] = 0;
  }
  dfs();
  return count;
}

export function generateSolvedGrid() {
  const grid = makeGrid(0);
  grid[0] = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  if (!solveGrid(grid, true)) {
    throw new Error("Failed to generate solved grid.");
  }
  return grid;
}

export function generatePuzzle(solution, difficulty) {
  const puzzle = cloneGrid(solution);
  const targetClues = DIFFICULTY_CONFIG[difficulty]?.clues ?? DIFFICULTY_CONFIG.medium.clues;
  const positions = shuffled(Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i));
  let clues = GRID_SIZE * GRID_SIZE;
  for (const pos of positions) {
    if (clues <= targetClues) {
      break;
    }
    const row = Math.floor(pos / GRID_SIZE);
    const col = pos % GRID_SIZE;
    const backup = puzzle[row][col];
    puzzle[row][col] = 0;
    const probe = cloneGrid(puzzle);
    if (countSolutions(probe, 2) !== 1) {
      puzzle[row][col] = backup;
      continue;
    }
    clues -= 1;
  }
  return puzzle;
}

export function buildUnits() {
  const units = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    units.push(Array.from({ length: GRID_SIZE }, (_, col) => [row, col]));
  }
  for (let col = 0; col < GRID_SIZE; col += 1) {
    units.push(Array.from({ length: GRID_SIZE }, (_, row) => [row, col]));
  }
  for (let row = 0; row < GRID_SIZE; row += BOX_SIZE) {
    for (let col = 0; col < GRID_SIZE; col += BOX_SIZE) {
      const box = [];
      for (let r = row; r < row + BOX_SIZE; r += 1) {
        for (let c = col; c < col + BOX_SIZE; c += 1) {
          box.push([r, c]);
        }
      }
      units.push(box);
    }
  }
  return units;
}

export const UNITS = buildUnits();

export function isPeer(selectedRow, selectedCol, row, col) {
  if (selectedRow === row && selectedCol === col) {
    return false;
  }
  const sameRow = selectedRow === row;
  const sameCol = selectedCol === col;
  const sameBox =
    boxStart(selectedRow) === boxStart(row) &&
    boxStart(selectedCol) === boxStart(col);
  return sameRow || sameCol || sameBox;
}

export function makeCellKey(row, col) {
  return `${row}-${col}`;
}

function addBucketConflicts(buckets, conflicts) {
  for (const positions of buckets.values()) {
    if (positions.length < 2) {
      continue;
    }
    for (const [row, col] of positions) {
      conflicts.add(makeCellKey(row, col));
    }
  }
}

export function calculateConflicts(grid) {
  const conflicts = new Set();
  for (let row = 0; row < GRID_SIZE; row += 1) {
    const buckets = new Map();
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const value = grid[row][col];
      if (value === 0) {
        continue;
      }
      if (!buckets.has(value)) {
        buckets.set(value, []);
      }
      buckets.get(value).push([row, col]);
    }
    addBucketConflicts(buckets, conflicts);
  }
  for (let col = 0; col < GRID_SIZE; col += 1) {
    const buckets = new Map();
    for (let row = 0; row < GRID_SIZE; row += 1) {
      const value = grid[row][col];
      if (value === 0) {
        continue;
      }
      if (!buckets.has(value)) {
        buckets.set(value, []);
      }
      buckets.get(value).push([row, col]);
    }
    addBucketConflicts(buckets, conflicts);
  }
  for (let row = 0; row < GRID_SIZE; row += BOX_SIZE) {
    for (let col = 0; col < GRID_SIZE; col += BOX_SIZE) {
      const buckets = new Map();
      for (let r = row; r < row + BOX_SIZE; r += 1) {
        for (let c = col; c < col + BOX_SIZE; c += 1) {
          const value = grid[r][c];
          if (value === 0) {
            continue;
          }
          if (!buckets.has(value)) {
            buckets.set(value, []);
          }
          buckets.get(value).push([r, c]);
        }
      }
      addBucketConflicts(buckets, conflicts);
    }
  }
  return conflicts;
}

export function clearPeerNotes(notes, row, col, value) {
  const seen = new Set();
  function removeFrom(r, c) {
    const key = makeCellKey(r, c);
    if (key === makeCellKey(row, col) || seen.has(key)) {
      return;
    }
    seen.add(key);
    const cellNotes = notes[r][c];
    const idx = cellNotes.indexOf(value);
    if (idx >= 0) {
      cellNotes.splice(idx, 1);
    }
  }
  for (let i = 0; i < GRID_SIZE; i += 1) {
    removeFrom(row, i);
    removeFrom(i, col);
  }
  const startRow = boxStart(row);
  const startCol = boxStart(col);
  for (let r = startRow; r < startRow + BOX_SIZE; r += 1) {
    for (let c = startCol; c < startCol + BOX_SIZE; c += 1) {
      removeFrom(r, c);
    }
  }
}

export function toggleNote(notes, row, col, digit) {
  const cellNotes = notes[row][col];
  const idx = cellNotes.indexOf(digit);
  if (idx >= 0) {
    cellNotes.splice(idx, 1);
  } else {
    cellNotes.push(digit);
    cellNotes.sort((a, b) => a - b);
  }
}

export function findNakedSingle(board) {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (board[row][col] !== 0) {
        continue;
      }
      const candidates = getCandidates(board, row, col);
      if (candidates.length === 1) {
        return {
          row,
          col,
          value: candidates[0],
          reason: "裸单",
          candidates
        };
      }
    }
  }
  return null;
}

export function findHiddenSingle(board) {
  function scanUnit(unitCells, unitType, unitIndex) {
    const bucket = new Map();
    for (let digit = 1; digit <= GRID_SIZE; digit += 1) {
      bucket.set(digit, []);
    }
    for (const [row, col] of unitCells) {
      if (board[row][col] !== 0) {
        continue;
      }
      const candidates = getCandidates(board, row, col);
      for (const digit of candidates) {
        bucket.get(digit).push([row, col]);
      }
    }
    for (let digit = 1; digit <= GRID_SIZE; digit += 1) {
      const spots = bucket.get(digit);
      if (spots.length === 1) {
        return {
          row: spots[0][0],
          col: spots[0][1],
          value: digit,
          reason: "隐藏单",
          unitType,
          unitIndex,
          candidateSpots: spots.map(([row, col]) => ({ row, col }))
        };
      }
    }
    return null;
  }

  for (let row = 0; row < GRID_SIZE; row += 1) {
    const found = scanUnit(
      Array.from({ length: GRID_SIZE }, (_, col) => [row, col]),
      "row",
      row
    );
    if (found) {
      return found;
    }
  }

  for (let col = 0; col < GRID_SIZE; col += 1) {
    const found = scanUnit(
      Array.from({ length: GRID_SIZE }, (_, row) => [row, col]),
      "col",
      col
    );
    if (found) {
      return found;
    }
  }

  let boxIndex = 0;
  for (let row = 0; row < GRID_SIZE; row += BOX_SIZE) {
    for (let col = 0; col < GRID_SIZE; col += BOX_SIZE) {
      const cells = [];
      for (let r = row; r < row + BOX_SIZE; r += 1) {
        for (let c = col; c < col + BOX_SIZE; c += 1) {
          cells.push([r, c]);
        }
      }
      const found = scanUnit(cells, "box", boxIndex);
      if (found) {
        return found;
      }
      boxIndex += 1;
    }
  }
  return null;
}

export function evaluateBoard(board, solution) {
  let empty = 0;
  let wrong = 0;
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const value = board[row][col];
      if (value === 0) {
        empty += 1;
      } else if (value !== solution[row][col]) {
        wrong += 1;
      }
    }
  }
  const conflicts = calculateConflicts(board);
  return { empty, wrong, conflicts };
}

export function countClues(grid) {
  let clues = 0;
  for (const row of grid) {
    for (const value of row) {
      if (value !== 0) {
        clues += 1;
      }
    }
  }
  return clues;
}

export function findFirstEditableCell(grid) {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] === 0) {
        return { row, col };
      }
    }
  }
  return { row: 0, col: 0 };
}

export function isValidGrid(grid, allowZero) {
  if (!Array.isArray(grid) || grid.length !== GRID_SIZE) {
    return false;
  }
  return grid.every(
    (row) =>
      Array.isArray(row) &&
      row.length === GRID_SIZE &&
      row.every((value) => {
        if (!Number.isInteger(value)) {
          return false;
        }
        if (allowZero) {
          return value >= 0 && value <= GRID_SIZE;
        }
        return value >= 1 && value <= GRID_SIZE;
      })
  );
}

export function isValidBoolGrid(grid) {
  if (!Array.isArray(grid) || grid.length !== GRID_SIZE) {
    return false;
  }
  return grid.every(
    (row) => Array.isArray(row) && row.length === GRID_SIZE && row.every((value) => typeof value === "boolean")
  );
}

export function isValidNoteGrid(grid) {
  if (!Array.isArray(grid) || grid.length !== GRID_SIZE) {
    return false;
  }
  return grid.every(
    (row) =>
      Array.isArray(row) &&
      row.length === GRID_SIZE &&
      row.every(
        (cell) =>
          Array.isArray(cell) &&
          cell.every((value) => Number.isInteger(value) && value >= 1 && value <= GRID_SIZE)
      )
  );
}

export function isValidSelectedCell(cell) {
  if (cell === null) {
    return true;
  }
  if (!cell || typeof cell !== "object") {
    return false;
  }
  return (
    Number.isInteger(cell.row) &&
    Number.isInteger(cell.col) &&
    cell.row >= 0 &&
    cell.row < GRID_SIZE &&
    cell.col >= 0 &&
    cell.col < GRID_SIZE
  );
}

export function normalizeNotes(notes) {
  return notes.map((row) =>
    row.map((cell) => {
      const uniq = [...new Set(cell)];
      uniq.sort((a, b) => a - b);
      return uniq;
    })
  );
}
