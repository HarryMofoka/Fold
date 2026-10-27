# AGENTS.md

This file provides guidance to AI Agents when working with code in this repository.

## Overview

Fold  is a 100% JavaScript/TypeScript client-side PDF manipulation application built on React 19, Vite, and Mantine UI, with an optional cross-platform Tauri (Rust) desktop shell. All document processing happens in-browser via `@cantoo/pdf-lib` and Mozilla `pdfjs-dist` without requiring a Java backend or Python engine.

## Taskfile & NPM Commands

This project uses [Task](https://taskfile.dev/) (or `npm` directly) as a command runner.

### Quick Reference
- `task install` (or `cd frontend && npm install`) — install all frontend dependencies
- `task dev` — start client-side development server on http://localhost:5173
- `task build` — build production web bundle in `frontend/editor/dist`
- `task desktop:dev` — run desktop application via Tauri
- `task desktop:build` — build native desktop installer
- `task check` — run quality gate (typecheck, lint, format, test)
- `task format` — auto-fix formatting across all TypeScript and CSS files
- `task comment-lint` — check comment quality

## Comments

A comment must carry information the code cannot. If a reader could derive it from the code in front of them, delete it.

Comment the current state. Not what the code used to do, not what changed, not why it changed: git holds that. Where history explains the shape, state the reason instead.

Write a comment when it does one of these four jobs:
- **Contract.** What a caller must know that the signature cannot say: preconditions, invariants, units, ownership and lifetime, thread-safety, error semantics, side effects.
- **Why.** The constraint the code satisfies, the bug it avoids, the alternative rejected and the reason.
- **Hazard.** "Must stay in sync with X", "order matters because Y", "do not remove, it prevents Z".
- **Map.** A short orientation at the top of a genuinely complex file: what it owns, and what it deliberately does not.

Never write:
- A comment that restates the next line (`// Handle drag start` above `handleDragStart` is noise).
- Section banners or position markers (`// --- Types ---`, `// Helpers`).
- Step narration in a function body (`// Step 1:`, `// Then we`).
- Commented-out code. Delete it.
- Doc tags that restate the signature.

`task comment-lint` mechanically enforces these rules on changed lines. See `devGuide/CODE_COMMENTS.md`.

## Frontend Architecture & Development

- **Tech Stack**: React 19 + TypeScript + Vite + Mantine UI + TailwindCSS + PDF.js + `@cantoo/pdf-lib`.
- **Directory**: `frontend/editor` (root workspace in `frontend/`).
- **Client PDF Engine**: Located in `frontend/editor/src/core/services/clientPdfEngine.ts`. Performs merges, splits, page extraction, rotation, encryption, and deletions directly in-browser.

### Import Paths - CRITICAL
**ALWAYS use `@app/*` for imports.** Do not use `@core/*` or `@proprietary/*` unless explicitly wrapping/extending a lower layer implementation.

```typescript
// Correct - Use @app/* for imports
import { AppLayout } from "@app/components/AppLayout";
import { useFileContext } from "@app/contexts/FileContext";
```

The `@app/*` alias automatically resolves through a per-flavor cascade:
- **core** → core
- **proprietary** → proprietary → core
- **saas** → saas → cloud → proprietary → core
- **desktop** → desktop → cloud → proprietary → core

### Component Override Pattern (Stub/Shadow)
Use this pattern for desktop-specific or proprietary-specific features without runtime checks or conditionals:
1. Core defines a stub component (returns null or no-op)
2. Desktop or proprietary overrides it with the exact same path/name
3. Higher layers shadow core during build resolution

### State Management & FileContext
**Location**: `frontend/editor/src/core/contexts/FileContext.tsx`
- **Active files**: Currently loaded PDFs and their variants
- **Tool navigation**: Current mode (`viewer`, `pageEditor`, `fileEditor`, or tool name)
- **Memory management**: Explicit PDF.js `.destroy()` calls, blob URL revocation, worker termination
- **Storage**: IndexedDB caching with LRU thumbnail management

All file operations MUST go through `FileContext`. Never bypass it with direct detached File handling.

### Tool Architecture
Tools use modular hook orchestration:
- `useToolOperation` (`frontend/editor/src/core/hooks/tools/shared/useToolOperation.ts`): Orchestrates execution, progress, error handling, and `FileContext` updates.
- `clientPdfEngine`: Executes document operations client-side.

### Translation Rules
- Always update translations in `en-US` only (`frontend/editor/public/locales/en-US/translation.toml` or JSON).
- Other languages are updated downstream.
