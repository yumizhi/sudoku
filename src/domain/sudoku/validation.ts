import { BOX_SIZE, GRID_SIZE } from "./constants";
import { boxStart, makeCellKey } from "./grid";
import type { BoardEvaluation, Digit, Grid, NotesGrid } from "./types";

function addBucketConflicts(
  buckets: Map<number, Array<[row: number, col: number]>>,
  conflicts: Set<string>
): void {
  for (const positions of buckets.values()) {
    if (positions.length < 2) {
      continue;
    }
    for (const [row, col] of positions) {
      conflicts.add(makeCellKey(row, col));
    }
  }
}

export function calculateConflicts(grid: Grid): Set<string> {
  const conflicts = new Set<string>();

  for (let row = 0; row < GRID_SIZE; row += 1) {
    const buckets = new Map<number, Array<[number, number]>>();
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const value = grid[row][col];
      if (value === 0) {
        continue;
      }
      if (!buckets.has(value)) {
        buckets.set(value, []);
      }
      buckets.get(value)?.push([row, col]);
    }
    addBucketConflicts(buckets, conflicts);
  }

  for (let col = 0; col < GRID_SIZE; col += 1) {
    const buckets = new Map<number, Array<[number, number]>>();
    for (let row = 0; row < GRID_SIZE; row += 1) {
      const value = grid[row][col];
      if (value === 0) {
        continue;
      }
      if (!buckets.has(value)) {
        buckets.set(value, []);
      }
      buckets.get(value)?.push([row, col]);
    }
    addBucketConflicts(buckets, conflicts);
  }

  for (let row = 0; row < GRID_SIZE; row += BOX_SIZE) {
    for (let col = 0; col < GRID_SIZE; col += BOX_SIZE) {
      const buckets = new Map<number, Array<[number, number]>>();
      for (let scanRow = row; scanRow < row + BOX_SIZE; scanRow += 1) {
        for (let scanCol = col; scanCol < col + BOX_SIZE; scanCol += 1) {
          const value = grid[scanRow][scanCol];
          if (value === 0) {
            continue;
          }
          if (!buckets.has(value)) {
            buckets.set(value, []);
          }
          buckets.get(value)?.push([scanRow, scanCol]);
        }
      }
      addBucketConflicts(buckets, conflicts);
    }
  }

  return conflicts;
}

export function clearPeerNotes(notes: NotesGrid, row: number, col: number, value: Digit): void {
  const seen = new Set<string>();

  const removeDigit = (nextRow: number, nextCol: number): void => {
    const key = makeCellKey(nextRow, nextCol);
    if (key === makeCellKey(row, col) || seen.has(key)) {
      return;
    }

    seen.add(key);
    const cellNotes = notes[nextRow][nextCol];
    const index = cellNotes.indexOf(value);
    if (index >= 0) {
      cellNotes.splice(index, 1);
    }
  };

  for (let index = 0; index < GRID_SIZE; index += 1) {
    removeDigit(row, index);
    removeDigit(index, col);
  }

  const startRow = boxStart(row);
  const startCol = boxStart(col);
  for (let scanRow = startRow; scanRow < startRow + BOX_SIZE; scanRow += 1) {
    for (let scanCol = startCol; scanCol < startCol + BOX_SIZE; scanCol += 1) {
      removeDigit(scanRow, scanCol);
    }
  }
}

export function toggleNote(notes: NotesGrid, row: number, col: number, digit: Digit): void {
  const current = notes[row][col];
  const index = current.indexOf(digit);
  if (index >= 0) {
    current.splice(index, 1);
  } else {
    current.push(digit);
    current.sort((left, right) => left - right);
  }
}

export function evaluateBoard(board: Grid, solution: Grid): BoardEvaluation {
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

  return {
    empty,
    wrong,
    conflicts: calculateConflicts(board)
  };
}
