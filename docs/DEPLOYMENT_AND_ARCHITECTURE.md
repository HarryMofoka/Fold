# Fold Deployment Model & Architectural Separation

This document defines the real deployment model for **Fold** across Web/PWA, Windows Desktop, Android, and iOS, and establishes the formal architectural boundary between the Fold application layer and its underlying document engines.

---

## 1. The Deployment Reality: "Install Fold → Open Document → Use Features"

The target user experience for Fold is:
> **Install Fold → Open document → Use features.**
> No manual installations of Java, Python, Tesseract, language packs, or office suites.

### Platform Breakdown

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              FOLD PLATFORMS                            │
├───────────────────┬───────────────────┬────────────────────────────────┤
│      Web / PWA    │   Windows Desktop │        Mobile (Android/iOS)    │
│   (Zero-Install)  │  (Bundled Native) │           (Future Engine)      │
│                   │                   │                                │
│ • Runs in browser │ • Tauri container │ • No JVM / No subprocesses     │
│ • PDFium WASM     │ • Bundled JRE 25  │ • Pure WASM or Native NDK      │
│ • Client PDF-lib  │ • Bundled JAR     │ • Client-side processing only  │
│ • Tesseract.js    │ • Bundled Tesseract│                               │
│ • Optional remote │ • In-process POI  │                                │
│   backend proxy   │ • Zero setup      │                                │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

## 2. Detailed Platform Analysis

### A. Web / Progressive Web App (PWA)

| Category | Features & Technical Reality |
| :--- | :--- |
| **Runs entirely in browser today** | • Document viewing & rendering (`pdfjs-dist`)<br>• Thumbnail generation via Web Workers<br>• Form inspection & filling (`@embedpdf/pdfium` WASM)<br>• Annotation removal (`useRemoveAnnotationsOperation.ts` via PDFium WASM)<br>• Color & contrast adjustment (`useAdjustContrastOperation.ts` via PDFium WASM)<br>• Page re-ordering and preview manipulation in UI state (`FileContext.tsx`) |
| **Currently requires Java backend** | • Merge, Split, Rotate, Extract, Reorder, Delete pages<br>• Watermarking, Stamps, Page numbers<br>• Password encryption & decryption<br>• Form flattening and unlock<br>• Metadata update<br>• Redaction execution |
| **Requires external system binaries** | • OCR (Tesseract / OCRmyPDF)<br>• Deep compression (Ghostscript / QPDF)<br>• PDF Repair (Ghostscript / QPDF)<br>• Office conversions (LibreOffice)<br>• HTML/URL to PDF (WeasyPrint)<br>• E-book conversions (Calibre)<br>• Photo scan extraction (OpenCV) |
| **Can realistically move to WASM** | • **Core Page Ops (Tier 1):** Merge, Split, Rotate, Extract, Delete, Watermark, Form Flattening can be implemented client-side using `@cantoo/pdf-lib` and `@embedpdf/pdfium` (both already included in `node_modules`!).<br>• **Linearization & Repair (Tier 2):** QPDF compiled to WebAssembly via Emscripten.<br>• **Client-Side OCR (Tier 2):** **Tesseract.js** (WASM build of Tesseract) running in a Web Worker, fetching `.traineddata.gz` models over CDN/HTTP and caching in browser IndexedDB.<br>• **Image Cropping (Tier 2):** OpenCV.js (WASM) for contour detection.<br>• **Impractical for WASM (Tier 3):** LibreOffice (~500MB) and WeasyPrint (Python+Pango). These must remain optional server features. |

---

### B. Windows Desktop (Tauri)

| Question | Assessment & Technical Path |
| :--- | :--- |
| **Can the Java backend be bundled?** | **YES.** The build pipeline already contains `jlink` (`.taskfiles/desktop.yml:145–178`). It compiles a trimmed JRE 25 (~45–60 MB) and places it in `src-tauri/runtime/jre/`. The application JAR is placed in `src-tauri/libs/`. |
| **Can Tauri launch & manage the backend?** | **YES.** `frontend/editor/src-tauri/src/commands/backend.rs` already implements the entire lifecycle: finds bundled JRE, finds JAR, starts Java on a dynamic port (`-Dserver.port=0`), captures the port from logs, routes API requests, and shuts down the child process when the window closes. |
| **Can Tesseract & language data be bundled?** | **YES.** Portable `tesseract.exe` + Leptonica DLLs (~25 MB) and `eng.traineddata` + `osd.traineddata` (~14 MB) can be packaged into `src-tauri/bin/` and `src-tauri/tessdata/`. `RuntimePathConfig` needs a Windows desktop check to set `system.tessdataDir` to the local application directory. |
| **Can QPDF & Ghostscript be bundled?** | **YES.** Portable `qpdf.exe` (~10 MB) can be bundled directly. Ghostscript (`gswin64c.exe`) can also be bundled, subject to AGPL-3.0 compliance. |
| **Can LibreOffice be bundled?** | **Impractical (~500MB installer bloat).** Instead, Fold should default to **Stirling Office Convert** (pure Java Apache POI bridge, already bundled in the JAR) for standard Word/Excel/PowerPoint conversions, making external LibreOffice an optional setting for users with existing office installations. |

---

### C. Android & iOS (Mobile)

| Mobile OS | Technical Constraints & Incompatibilities |
| :--- | :--- |
| **Android** | • Standard desktop JVM (Temurin JRE 25) cannot run on Android (requires Dalvik/ART runtime).<br>• Subprocesses (`ProcessBuilder` running `tesseract`, `gs`, `soffice`, `qpdf`) cannot be spawned in standard unrooted sandboxes.<br>• Python runtime and venv cannot be shipped unchanged.<br>• **Future Architecture:** Hybrid UI (Capacitor or Tauri Mobile) running client-side WASM (PDFium WASM, pdf-lib, Tesseract.js), or native Android NDK libraries. |
| **iOS** | • Strict sandbox rules: **`fork()` and `exec()` are forbidden by Apple policy**.<br>• No subprocess execution of any kind.<br>• Java cannot run on iOS.<br>• **Future Architecture:** All document operations must execute within the WebKit process via WebAssembly (PDFium WASM, Tesseract.js) or compiled natively into the app binary via Swift/C++ (Apple PDFKit, native compiled C++ PDFium). |

---

## 3. Boundary Definition: Fold Core vs. Fold Runtime

To ensure future platform-specific implementations (Desktop, PWA, Mobile) can be added without breaking existing functionality, Fold must formally separate **Application Logic** from **Processing Engines** and **Platform Runtimes**.

### Layered Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                               FOLD UI                                  │
│         (React 19, TypeScript, Mantine UI, FileContext)                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FOLD APPLICATION LAYER                          │
│        (Tool orchestrators, validation, undo/redo, state management)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DOCUMENT OPERATIONS CONTRACT                    │
│    (Typed interfaces: DocumentMerge, DocumentSplit, DocumentOcr, etc.) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      DOCUMENT PROCESSING ADAPTER                       │
│      (Determines execution target based on platform & capabilities)     │
└──────────┬────────────────────────┬────────────────────────┬───────────┘
           │                        │                        │
           ▼                        ▼                        ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  Client-Side / WASM  │ │   Local Desktop JRE  │ │  Remote / Docker Server│
│       Adapter        │ │       Adapter        │ │       Adapter        │
├──────────────────────┤ ├──────────────────────┤ ├──────────────────────┤
│ • @embedpdf/pdfium   │ │ • Bundled Java 25    │ │ • Full Spring Boot   │
│ • @cantoo/pdf-lib    │ │ • In-process PDFBox  │ │ • LibreOffice        │
│ • Tesseract.js (WASM)│ │ • In-process POI     │ │ • Ghostscript        │
│ • QPDF (WASM)        │ │ • Bundled Tesseract  │ │ • OCRmyPDF           │
│ • Pure Offline PWA   │ │ • Bundled QPDF       │ │ • Python Engine      │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

### Separation Rules

1. **Fold Application Logic**:
   - Owns UI state, file queues, thumbnail previews, user parameters, drag-and-drop layout, and task progress.
   - **MUST NOT** import or depend on raw operating system APIs (`ProcessBuilder`, filesystem roots, `exec`).

2. **Document Operations Contract**:
   - Pure typed data contracts (e.g. `MergeRequest(files, order) -> Result(blob)`).
   - Platform-agnostic.

3. **Processing Adapter**:
   - Inspects the active environment (`Platform.isDesktop()`, `Platform.isPwa()`, `Platform.hasBackend()`).
   - Routes requests to the appropriate engine:
     - If client-side WASM engine can handle the operation (e.g. merge, split, rotate, remove annotations): run locally in-browser without network latency.
     - If local desktop backend is running: route to bundled JRE sidecar.
     - If connected to a self-hosted Docker server: route over HTTP REST API.

4. **Optional Feature Dependencies**:
   - Heavy dependencies (LibreOffice, WeasyPrint, Calibre) are treated as **optional plug-in capabilities**.
   - If missing, the UI gracefully indicates capability status rather than throwing uncaught process errors.
