# Sudoku Studio

一个为 GitHub Pages 设计的现代数独前端产品，采用 `React + TypeScript + Vite + Tailwind CSS`。

## 特性

- 种子驱动的确定性棋盘生成与唯一解校验
- React reducer 状态管理，支持撤销 / 重做 / 自动存档恢复
- 全局 `focus` 状态对象统一管理选中格、数字盘模式、输入 focus digit 与观察 focus digit
- 笔记模式、冲突检查、解释优先的提示弹窗
- 教程关卡模式，覆盖裸单、隐藏单、锁定候选与 X-Wing
- 键盘输入、方向键导航、移动端友好布局
- GitHub Pages 静态部署兼容

## 交互模型

- 数字盘模式分为 `input` 与 `observe`，模式保存在 reducer 里，不依赖 `App` 本地状态
- 键盘 `1-9` 与数字盘点击走同一条 reducer 事件：
  - `input` 模式执行填入 / 笔记
  - `observe` 模式切换观察数字，不会落子
- `focusDigit` 会参与棋盘与数字盘高亮：
  - 选中已填数字格时，使用该格数字作为 focus
  - 选中空格时，若当前模式已有 focus digit，则叠加同数字与候选数字高亮
- 棋盘高亮按多层叠加渲染：
  - 选中 ring
  - 同行同列 / 同宫底色
  - 同数字 tint
  - 候选数字 accent
  - 冲突 / 检查错误边框
  - 最近编辑格弱提示
- 自动存档会保存当前 `focus`，包括数字盘模式与 `selectedDigit`

## 本地开发

推荐 Node.js 24。

先安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

默认地址：

```text
http://localhost:5173
```

## 测试

单元测试：

```bash
npm run test
```

端到端测试：

```bash
npm run test:e2e
```

## 构建

```bash
npm run build
```

产物输出到 `dist/`，可直接用于 GitHub Pages。

## GitHub Pages

仓库已包含 [`.github/workflows/pages.yml`](./.github/workflows/pages.yml)。

1. 推送到 `main`
2. 在仓库设置中启用 GitHub Pages
3. Source 选择 `GitHub Actions`

工作流会自动安装依赖、构建 Vite 产物并部署。

## 项目结构

```text
sudoku/
├─ .github/workflows/
│  └─ pages.yml
├─ src/
│  ├─ app/
│  ├─ domain/sudoku/
│  └─ features/game/
├─ tests/
│  ├─ e2e/
│  └─ unit/
├─ agents.md
├─ index.html
├─ package.json
└─ README.md
```

## 快捷键

- `1-9`: 按当前数字盘模式执行输入或观察
- `Backspace` / `Delete` / `0`: 擦除
- `N`: 切换笔记模式
- `H`: 打开提示解释
- `方向键`: 移动选中格
