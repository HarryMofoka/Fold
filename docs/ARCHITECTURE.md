# Fold Architecture Documentation

## 1. System Overview

**Fold** is a privacy-first, client-side PDF workspace and document processing platform. It is engineered with a modern, decoupled architecture allowing document manipulation to occur locally in the client browser with zero server dependency.

```text
┌────────────────────────────────────────────────────────┐
│                        Fold UI                         │
│   (Vite + React 19 + TypeScript + Mantine + Tailwind)  │
└───────────────────────────┬────────────────────────────┘
                            │
               (In-Browser Client Processing)
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               Browser-Native Client Engine             │
│  - @cantoo/pdf-lib (manipulation & assembly)           │
│  - Mozilla pdfjs-dist / EmbedPDF (canvas rendering)    │
│  - WebAssembly Runtimes                                │
│  - IndexedDB (client-side persistence & thumbnails)    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Major Components

The repository is organized into distinct submodules:

### 2.1. Frontend Single Page Application (`frontend/editor`)
* **Technology Stack:** React 19, TypeScript, Vite, Mantine UI components (`@mantine/core`), and Tailwind CSS.
* **Canvas & Rendering Engine:** Powered by `@embedpdf/core`, `@embedpdf/plugin-render`, and Mozilla's `pdfjs-dist`.
* **Client-Side PDF Manipulation:** Integrates `@cantoo/pdf-lib` for zero-server document merges, splits, page rotations, deletions, and page extractions.
* **Interactive Signature & Annotation Layers:** Features vector freehand drawing (`signature_pad`), drag-and-drop page manipulation (`@dnd-kit/core`, `@atlaskit/pragmatic-drag-and-drop`), and annotation overlays.
* **Desktop Shell (`frontend/editor/src-tauri`):** Tauri v2 wrapper connecting the web application directly to the native desktop OS environment.

### 2.2. Client PDF Engine (`frontend/editor/src/core/services/clientPdfEngine.ts`)
* Implements direct in-browser operations:
  - Merge PDFs
  - Split PDFs (by ranges, page counts, extracts)
  - Rotate pages
  - Delete / rearrange pages
  - Password protection & permissions
  - Watermarking & stamping
  - Form filling & flattening

---

## 3. PDF Processing & Data Flows

Fold uses a **pure client-side execution model**: all operations run directly within the browser memory and sandbox without sending any document data over the network.

### 3.1. Client-Side (Zero-Network) Execution Flow
```text
User selects PDF
   │
   ▼
Read into ArrayBuffer (FileReader / FileSystem API)
   │
   ▼
Parsed into memory by @cantoo/pdf-lib / pdfjs-dist
   │
   ├─► Page Reordering / Split / Merge
   ├─► Rotate / Extract / Delete Pages
   ├─► Annotation addition & signature drawing
   │
   ▼
Serialized to Uint8Array in-browser
   │
   ▼
Trigger direct browser download (zero bytes sent to server)
```

---

## 4. State Management

All document lifecycles are coordinated through `FileContext` (`frontend/editor/src/core/contexts/FileContext.tsx`):
- Active documents and page caches
- Undo / redo histories
- Thumbnail generation in background Web Workers
- Automatic resource cleanup (revoking object URLs, terminating workers, calling `.destroy()` on PDF.js documents)
