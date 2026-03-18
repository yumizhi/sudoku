import { BOX_SIZE, DIGITS, GRID_SIZE } from "./constants";
import { getCandidates } from "./solver";
import type { Digit, Grid, HintDetail } from "./types";

interface RawHint {
  row: number;
  col: number;
  value: Digit;
  reason: "裸单" | "隐藏单" | "揭示";
  unitType?: "row" | "col" | "box";
  unitIndex?: number;
}

function formatCellLabel(row: number, col: number): string {
  return `R${row + 1}C${col + 1}`;
}

function formatUnitLabel(unitType: "row" | "col" | "box", unitIndex: number): string {
  if (unitType === "row") {
    return `第 ${unitIndex + 1} 行`;
  }
  if (unitType === "col") {
    return `第 ${unitIndex + 1} 列`;
  }
  return `第 ${unitIndex + 1} 宫`;
}

function buildHintDetail(rawHint: RawHint): HintDetail {
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
      highlightMode: "board-selected"
    };
  }

  if (rawHint.reason === "隐藏单" && rawHint.unitType !== undefined && rawHint.unitIndex !== undefined) {
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
      highlightMode: "observe-digit"
    };
  }

  return {
    row: rawHint.row,
    col: rawHint.col,
    value: rawHint.value,
    technique: "揭示",
    summary: `当前盘面还没有发现低阶逻辑提示，所以先揭示 ${cellLabel} = ${rawHint.value}，帮助你继续推进。`,
    steps: [
      `这一步不是严格的教学提示，而是直接给出 ${cellLabel} 的正确数字。`,
      "它适合卡住时打破停滞，但不会替代正常的观察训练。",
      "填入之后，优先继续扫描新的裸单或隐藏单。"
    ],
    highlightMode: "board-selected"
  };
}

export function findNakedSingle(board: Grid): HintDetail | null {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (board[row][col] !== 0) {
        continue;
      }

      const candidates = getCandidates(board, row, col);
      if (candidates.length === 1) {
        return buildHintDetail({
          row,
          col,
          value: candidates[0],
          reason: "裸单"
        });
      }
    }
  }

  return null;
}

export function findHiddenSingle(board: Grid): HintDetail | null {
  const scanUnit = (
    cells: Array<[row: number, col: number]>,
    unitType: "row" | "col" | "box",
    unitIndex: number
  ): HintDetail | null => {
    const bucket = new Map<Digit, Array<[row: number, col: number]>>();
    for (const digit of DIGITS) {
      bucket.set(digit, []);
    }

    for (const [row, col] of cells) {
      if (board[row][col] !== 0) {
        continue;
      }
      for (const candidate of getCandidates(board, row, col)) {
        bucket.get(candidate)?.push([row, col]);
      }
    }

    for (const digit of DIGITS) {
      const positions = bucket.get(digit) ?? [];
      if (positions.length === 1) {
        const [row, col] = positions[0];
        return buildHintDetail({
          row,
          col,
          value: digit,
          reason: "隐藏单",
          unitType,
          unitIndex
        });
      }
    }

    return null;
  };

  for (let row = 0; row < GRID_SIZE; row += 1) {
    const found = scanUnit(
      Array.from({ length: GRID_SIZE }, (_, col): [number, number] => [row, col]),
      "row",
      row
    );
    if (found) {
      return found;
    }
  }

  for (let col = 0; col < GRID_SIZE; col += 1) {
    const found = scanUnit(
      Array.from({ length: GRID_SIZE }, (_, row): [number, number] => [row, col]),
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
      const cells: Array<[number, number]> = [];
      for (let scanRow = row; scanRow < row + BOX_SIZE; scanRow += 1) {
        for (let scanCol = col; scanCol < col + BOX_SIZE; scanCol += 1) {
          cells.push([scanRow, scanCol]);
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

export function findHint(board: Grid, solution: Grid): HintDetail | null {
  const naked = findNakedSingle(board);
  if (naked) {
    return naked;
  }

  const hidden = findHiddenSingle(board);
  if (hidden) {
    return hidden;
  }

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (board[row][col] === 0) {
        return buildHintDetail({
          row,
          col,
          value: solution[row][col] as Digit,
          reason: "揭示"
        });
      }
    }
  }

  return null;
}
