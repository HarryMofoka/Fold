# Fold Developer Guide

## 1. Introduction

**Fold** is a robust, privacy-first PDF workspace and document processing toolkit. Fold features a modern React 19 Single Page Application (SPA), client-side in-browser PDF manipulation via WebAssembly and `@cantoo/pdf-lib`, and a cross-platform Tauri (Rust) desktop wrapper.

This guide provides instructions for developers contributing to Fold.

## 2. Project Overview

Fold is built using:

**Frontend (React SPA):**
- React 19 + TypeScript
- Vite for build tooling and development server
- Mantine UI component library
- TailwindCSS for styling
- PDF.js for client-side PDF rendering
- `@cantoo/pdf-lib` for client-side PDF manipulation
- IndexedDB for client-side file storage and thumbnails
- i18next for internationalization

**Desktop Application (Tauri):**
- Tauri v2 for cross-platform desktop app packaging
- Rust desktop shell for system integration and native file dialogs

## 3. Development Environment Setup

### Prerequisites

- **Node.js**: Node.js 22+ and npm 10+
- **Rust & Cargo** (optional, only needed for Tauri desktop builds)
- **Task** (optional command runner; `npm` commands work directly)

### Setup Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/HarryMofoka/Ink.git
   cd Ink
   ```

2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Initialize environment and metadata:
   ```bash
   npx tsx editor/scripts/setup-env.mts
   node editor/scripts/generate-og-metadata.mjs
   ```

4. Start development server:
   ```bash
   npx vite editor
   ```
   Open `http://localhost:5173` in your browser.

## 4. Frontend Architecture & Rules

### Import Paths - CRITICAL
**ALWAYS use `@app/*` for imports.** Do not use `@core/*` or `@proprietary/*` unless explicitly wrapping/extending a lower layer implementation.

```typescript
// Correct - Use @app/* for imports
import { AppLayout } from "@app/components/AppLayout";
import { useFileContext } from "@app/contexts/FileContext";
```

### Layer Cascade
`@app/*` resolves through a cascade:
- **core** → OSS base
- **proprietary** → proprietary → core
- **saas** → saas → cloud → proprietary → core
- **desktop** → desktop → cloud → proprietary → core

### State Management & FileContext
- Location: `frontend/editor/src/core/contexts/FileContext.tsx`
- All document operations flow through `FileContext`
- Memory management: Always call `.destroy()` on PDF.js documents and revoke blob URLs

### Adding New Tools
See [ADDING_TOOLS.md](ADDING_TOOLS.md) for step-by-step instructions on implementing new PDF tools with `useToolOperation` and `clientPdfEngine`.

## 5. Code Quality & Testing

Run checks before opening PRs:
```bash
# In frontend/ directory:
npx oxlint --config oxlint.config.ts    # Linting
npx oxfmt --check .                     # Formatting check
npx vitest run                          # Tests
```

Comment guidelines are enforced via `node scripts/lint/comment-lint.mjs`. See [devGuide/CODE_COMMENTS.md](devGuide/CODE_COMMENTS.md).
