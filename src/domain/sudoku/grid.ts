import { BOX_SIZE, DIGITS, GRID_SIZE } from "./constants";
import type { BoolGrid, CellPosition, Digit, Grid, GridValue, NotesGrid } from "./types";

export function makeGrid(fillValue: GridValue): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array<GridValue>(GRID_SIZE).fill(fillValue));
}

export function makeBoolGrid(fillValue: boolean): BoolGrid {
  return Array.from({ length: GRID_SIZE }, () => Array<boolean>(GRID_SIZE).fill(fillValue));
}

export function makeNoteGrid(): NotesGrid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => [] as Digit[])
  );
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

export function cloneBoolGrid(grid: BoolGrid): BoolGrid {
  return grid.map((row) => [...row]);
}

export function cloneNotes(notes: NotesGrid): NotesGrid {
  return notes.map((row) => row.map((cell) => [...cell]));
}

export function boxStart(index: number): number {
  return Math.floor(index / BOX_SIZE) * BOX_SIZE;
}

export function makeCellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

export function isPeer(selectedRow: number, selectedCol: number, row: number, col: number): boolean {
  if (selectedRow === row && selectedCol === col) {
    return false;
  }

  return (
    selectedRow === row ||
    selectedCol === col ||
    (boxStart(selectedRow) === boxStart(row) && boxStart(selectedCol) === boxStart(col))
  );
}

export function gridFromString(value: string, allowZero: boolean): Grid | null {
  if (typeof value !== "string" || value.length !== GRID_SIZE * GRID_SIZE) {
    return null;
  }

  const grid = makeGrid(0);

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char < "0" || char > "9") {
      return null;
    }

    const digit = Number(char);
    if (allowZero) {
      if (digit < 0 || digit > GRID_SIZE) {
        return null;
      }
    } else if (digit < 1 || digit > GRID_SIZE) {
      return null;
    }

    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    grid[row][col] = digit as GridValue;
  }

  return grid;
}

export function gridToString(grid: Grid): string {
  return grid.flat().join("");
}

export function deriveFixedGrid(puzzle: Grid): BoolGrid {
  return puzzle.map((row) => row.map((value) => value !== 0));
}

export function countClues(grid: Grid): number {
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

export function findFirstEditableCell(grid: Grid): CellPosition {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] === 0) {
        return { row, col };
      }
    }
  }
  return { row: 0, col: 0 };
}

export function normalizeNotes(notes: NotesGrid): NotesGrid {
  return notes.map((row) =>
    row.map((cell) => {
      const unique = [...new Set(cell)];
      unique.sort((left, right) => left - right);
      return unique.filter((value): value is Digit => DIGITS.includes(value as Digit));
    })
  );
}

export function isValidGrid(grid: unknown, allowZero: boolean): grid is Grid {
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

export function isValidBoolGrid(grid: unknown): grid is BoolGrid {
  return (
    Array.isArray(grid) &&
    grid.length === GRID_SIZE &&
    grid.every(
      (row) =>
        Array.isArray(row) &&
        row.length === GRID_SIZE &&
        row.every((value) => typeof value === "boolean")
    )
  );
}

export function isValidNoteGrid(grid: unknown): grid is NotesGrid {
  return (
    Array.isArray(grid) &&
    grid.length === GRID_SIZE &&
    grid.every(
      (row) =>
        Array.isArray(row) &&
        row.length === GRID_SIZE &&
        row.every(
          (cell) =>
            Array.isArray(cell) &&
            cell.every((value) => Number.isInteger(value) && value >= 1 && value <= GRID_SIZE)
        )
    )
  );
}

export function isValidSelectedCell(cell: unknown): cell is CellPosition | null {
  if (cell === null) {
    return true;
  }

  if (!cell || typeof cell !== "object") {
    return false;
  }

  const candidate = cell as CellPosition;
  return (
    Number.isInteger(candidate.row) &&
    Number.isInteger(candidate.col) &&
    candidate.row >= 0 &&
    candidate.row < GRID_SIZE &&
    candidate.col >= 0 &&
    candidate.col < GRID_SIZE
  );
}
