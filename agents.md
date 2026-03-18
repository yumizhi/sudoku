# Agents Guide

## Product Intent
- Build a polished Sudoku frontend product for GitHub Pages.
- Stack: React + TypeScript + Vite + Tailwind CSS.
- No backend. All gameplay stays deterministic, local-first, and testable.

## Core Rules
- Keep Sudoku domain logic framework-agnostic under `src/domain/sudoku`.
- UI components must not own solving or generation rules.
- Puzzle generation must be deterministic from a seed.
- Hints are explanation-first. Do not auto-apply a hint when it is requested.
- Preserve keyboard play, mobile usability, undo/redo, notes, tutorials, and local persistence.

## Architecture
- `src/domain/sudoku`: pure functions, types, serialization, tutorials, generator, solver, hints.
- `src/features/game`: reducer, React hooks, and game-specific UI components.
- `src/app`: app shell and entrypoint.
- `tests/unit`: engine and serialization tests.
- `tests/e2e`: user-flow and accessibility smoke tests.

## UI Expectations
- Desktop: board-first layout with persistent side intelligence panel.
- Mobile: stack panels below the board without losing access to notes, tutorials, or hint explanations.
- Accessibility: proper grid semantics, visible focus, keyboard navigation, dialog semantics for the hint modal, and readable live-region messages.
- Visual direction: warm paper surfaces, cool blue controls, subtle depth, and motion that supports focus instead of distracting from play.

## Deployment
- Keep GitHub Pages compatibility.
- Vite `base` must support static hosting from the repository root or repo subpath.
- Output remains a static site in `dist/`.

## Change Workflow
1. Update `progress.md` after meaningful milestones.
2. Keep domain changes covered by unit tests where practical.
3. Prefer incremental compatibility over broad rewrites inside a single layer.
4. If a future change threatens determinism or keyboard accessibility, treat it as a regression.
