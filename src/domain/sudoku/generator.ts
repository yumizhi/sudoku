import { DIFFICULTY_CONFIG, DIGITS, GRID_SIZE } from "./constants";
import { cloneGrid, makeGrid } from "./grid";
import { createRng, makeSeed } from "./rng";
import { countSolutions, solveGrid } from "./solver";
import type { Difficulty, Grid, PuzzleBundle } from "./types";

export function generateSolvedGrid(seed: number): Grid {
  const rng = createRng(seed);
  const grid = makeGrid(0);
  grid[0] = rng.shuffle(DIGITS);

  if (!solveGrid(grid, true, rng)) {
    throw new Error("Failed to generate a solved grid.");
  }

  return grid;
}

export function generatePuzzle(solution: Grid, difficulty: Difficulty, seed: number): Grid {
  const rng = createRng(seed);
  const puzzle = cloneGrid(solution);
  const targetClues = DIFFICULTY_CONFIG[difficulty].clues;
  const positions = rng.shuffle(Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => index));
  let clues = GRID_SIZE * GRID_SIZE;

  for (const position of positions) {
    if (clues <= targetClues) {
      break;
    }

    const row = Math.floor(position / GRID_SIZE);
    const col = position % GRID_SIZE;
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

export function generateGameBundle(difficulty: Difficulty, seed = makeSeed()): PuzzleBundle {
  const normalizedSeed = makeSeed(seed);
  const solution = generateSolvedGrid(normalizedSeed);
  const puzzle = generatePuzzle(solution, difficulty, normalizedSeed ^ 0x9e3779b9);

  return {
    difficulty,
    seed: normalizedSeed,
    puzzle,
    solution
  };
}
