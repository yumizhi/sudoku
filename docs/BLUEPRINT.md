# Sudoku Studio Blueprint

这份蓝图已经从原生浏览器模块版本迁移到新的产品架构。

## 当前技术方向

- 前端栈：`React + TypeScript + Vite + Tailwind CSS`
- 部署方式：GitHub Pages 静态部署
- 核心原则：数独规则层保持纯函数、确定性、可测试，不依赖 UI 框架

## 当前目录角色

- `src/domain/sudoku`: 生成器、求解器、提示、教程、序列化与校验
- `src/features/game`: reducer、存档和游戏界面组件
- `src/app`: 应用入口与整体布局
- `tests/unit`: 规则层与存档测试
- `tests/e2e`: 基础交互与可访问性测试

## 产品目标

- 保留教程、笔记、撤销重做、提示解释、键盘操作和移动端可用性
- 把原先的“能玩”提升为“适合作为正式前端作品展示”的界面质量
- 降低后续迭代成本，让规则扩展和 UI 扩展分开演进

## 协作入口

更完整的协作和工程约束请查看仓库根目录的 `agents.md`。
