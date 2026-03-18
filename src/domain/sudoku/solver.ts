import { BOX_SIZE, DIGITS, GRID_SIZE } from "./constants";
import { boxStart, cloneGrid } from "./grid";
import type { Digit, Grid } from "./types";
import type { SeededRng } from "./rng";

export interface CandidateCell {
  row: number;
  col: number;
  candidates: Digit[];
}

export function isSafe(grid: Grid, row: number, col: number, value: Digit): boolean {
  for (let index = 0; index < GRID_SIZE; index += 1) {
    if (grid[row][index] === value || grid[index][col] === value) {
      return false;
    }
  }

  const startRow = boxStart(row);
  const startCol = boxStart(col);
  for (let scanRow = startRow; scanRow < startRow + BOX_SIZE; scanRow += 1) {
    for (let scanCol = startCol; scanCol < startCol + BOX_SIZE; scanCol += 1) {
      if (grid[scanRow][scanCol] === value) {
        return false;
      }
    }
  }

  return true;
}

export function getCandidates(grid: Grid, row: number, col: number): Digit[] {
  if (grid[row][col] !== 0) {
    return [];
  }

  const used = new Set<number>();

  for (let index = 0; index < GRID_SIZE; index += 1) {
    if (grid[row][index] !== 0) {
      used.add(grid[row][index]);
    }
    if (grid[index][col] !== 0) {
      used.add(grid[index][col]);
    }
  }

  const startRow = boxStart(row);
  const startCol = boxStart(col);
  for (let scanRow = startRow; scanRow < startRow + BOX_SIZE; scanRow += 1) {
    for (let scanCol = startCol; scanCol < startCol + BOX_SIZE; scanCol += 1) {
      if (grid[scanRow][scanCol] !== 0) {
        used.add(grid[scanRow][scanCol]);
      }
    }
  }

  return DIGITS.filter((digit) => !used.has(digit));
}

export function findCellWithFewestCandidates(grid: Grid): CandidateCell | null {
  let best: CandidateCell | null = null;

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

export function solveGrid(grid: Grid, randomize = false, rng?: SeededRng): boolean {
  const next = findCellWithFewestCandidates(grid);
  if (!next) {
    return true;
  }

  if (next.candidates.length === 0) {
    return false;
  }

  const choices = randomize && rng ? rng.shuffle(next.candidates) : next.candidates;
  for (const candidate of choices) {
    grid[next.row][next.col] = candidate;
    if (solveGrid(grid, randomize, rng)) {
      return true;
    }
  }

  grid[next.row][next.col] = 0;
  return false;
}

export function solveCopy(grid: Grid): Grid | null {
  const copy = cloneGrid(grid);
  return solveGrid(copy) ? copy : null;
}

export function countSolutions(grid: Grid, limit = 2): number {
  let count = 0;

  const search = (): void => {
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

    for (const candidate of next.candidates) {
      grid[next.row][next.col] = candidate;
      search();
      if (count >= limit) {
        break;
      }
    }

    grid[next.row][next.col] = 0;
  };

  search();
  return count;
}
