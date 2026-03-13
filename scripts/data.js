export const GRID_SIZE = 9;
export const BOX_SIZE = 3;
export const HISTORY_LIMIT = 240;
export const STORAGE_KEY = "sudoku-studio-state-v1";

export const DIFFICULTY_CONFIG = {
  easy: { label: "简单", clues: 40 },
  medium: { label: "中等", clues: 33 },
  hard: { label: "困难", clues: 28 }
};

export const TUTORIAL_LEVELS = [
  {
    id: "t1-naked-single",
    title: "教程 1：裸单",
    technique: "Naked Single",
    objective: "先学会在一个空格里直接收敛到唯一答案。",
    summary: "当一个空格只剩一个候选时，不需要再推理，直接填写。",
    steps: [
      "先选中 R1C1，再看右侧“当前格”里的候选芯片。",
      "把这一行、这一列和这个 3x3 宫里已经出现的数字排除后，这个格子只剩 5 可以填。",
      "填入 5 之后，再沿着它的行列继续扫新的裸单。"
    ],
    puzzle: "034678912672195348198342567859761423426853791713924856961537284287419635345286179",
    solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
    guideDigit: 5
  },
  {
    id: "t2-hidden-single",
    title: "教程 2：隐藏单",
    technique: "Hidden Single",
    objective: "学会在一整行、一整列或一整个宫里找只有一个位置能放的数字。",
    summary: "隐藏单不是看某一格只剩一个候选，而是看某个数字在一个单元里只剩一个落点。",
    steps: [
      "先在“全局观察”里点数字 1，只盯这一个数字。",
      "再回到第 1 宫和第 1 行，找数字 1 还剩哪些落点。",
      "如果这个数字在某个单元里只剩一个位置，就直接填进去。"
    ],
    puzzle: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
    guideDigit: 1
  },
  {
    id: "t3-locked-candidates",
    title: "教程 3：锁定候选",
    technique: "Locked Candidates",
    objective: "学会先看一个宫，再看这个宫里的候选是否被锁在同一行或同一列。",
    summary: "如果同一宫里某个数字的候选全都落在同一行或同一列，那么这条线在其他宫里的同数字候选可以删掉。",
    steps: [
      "先在“全局观察”里点数字 7，再选中相关空格对照候选芯片。",
      "在一个宫里数清 7 还剩几个候选。",
      "如果这些候选都落在同一行或同一列，就形成锁定。",
      "沿着这条线看向其他宫，把同数字候选删掉，再继续求解。"
    ],
    puzzle: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
    solution: "435269781682571493197834562826195347374682915951743628519326874248957136763418259",
    guideDigit: 7
  },
  {
    id: "t4-x-wing",
    title: "教程 4：X-Wing",
    technique: "X-Wing",
    objective: "学会先固定一个数字，再找它在两行两列之间形成的矩形结构。",
    summary: "当某个数字在两行中都只剩同样两列可放时，就形成 X-Wing；这两列里的其他同数字候选都能删掉。",
    steps: [
      "先在“全局观察”里点数字 7，只看整盘 7 的分布。",
      "找出哪些行只剩两个 7 候选，并检查它们是否落在同样两列。",
      "一旦形成矩形，就把这两列其余位置上的 7 候选删掉。"
    ],
    puzzle: "003020600900305001001806400008102900700000008006708200002609500800203009005010300",
    solution: "483921657967345821251876493548132976729564138136798245372689514814253769695417382",
    guideDigit: 7
  }
];

export function getTutorialById(id) {
  return TUTORIAL_LEVELS.find((item) => item.id === id) || null;
}

export function isValidTutorialId(id) {
  return typeof id === "string" && getTutorialById(id) !== null;
}
