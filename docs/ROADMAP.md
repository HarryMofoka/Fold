# Fold Product & Engineering Roadmap

This document outlines the evolutionary development roadmap for **Fold**. Fold transforms an extensive open-source PDF toolkit into a modern, unified, privacy-first document workspace.

Following the comprehensive runtime dependency and OCR audit, this roadmap reflects the real technical constraints discovered across all target deployment environments.

---

## 🎯 Guiding Principles

1. **Your documents belong to you:** Every architectural choice prioritizes local execution and zero mandatory cloud dependencies.
2. **Zero-setup for end users:** "Install Fold → Open document → Use features." No manual installations of Java, Python, Tesseract, or command-line utilities.
3. **Power underneath, simplicity on top:** 50+ PDF capabilities accessible through an intuitive, Apple-grade interface.
4. **No account walls:** Full utility available immediately without registration, profiles, or tracking.
5. **Preserve working capability:** Retain existing backend stability while systematically abstracting document operations for cross-platform delivery.

---

## 📊 Technical Capabilities Classification (Post-Audit)

Based on the code-level dependency and runtime audit, all Fold features are classified into their actual technical readiness states:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      FOLD TECHNICAL CLASSIFICATION                     │
├─────────────────────────┬──────────────────────┬───────────────────────┤
│    Already Working      │   Needs Packaging    │ Needs Local/WASM Impl │
│  (Docker / Server)      │ (Desktop Bundling)   │     (Zero-Install)    │
│                         │                      │                       │
│ • 50+ Backend Ops       │ • JRE 25 (jlink)     │ • Merge & Split       │
│ • PDFBox Page Ops       │ • Tesseract & OSD    │ • Rotate & Reorder    │
│ • JPDFium Redaction     │ • tessdata (eng/osd) │ • Delete & Extract    │
│ • In-Process Office     │ • QPDF binary        │ • Watermark & Stamp   │
│ • Contrast Adjust (WASM)│ • Ghostscript binary │ • Password Protect    │
│ • Remove Annot (WASM)   │ • Poppler pdftohtml  │ • Form Flatten/Fill   │
├─────────────────────────┼──────────────────────┼───────────────────────┤
│    Needs Refactoring    │   Server-Dependent   │     Future Mobile     │
│  (Engine Clean-up)      │ (Heavy Server Only)  │   (Android & iOS)     │
│                         │                      │                       │
│ • Decouple hard paths   │ • LibreOffice Full   │ • Android (NDK/WASM)  │
│ • Desktop path priority │ • WeasyPrint / Cairo │ • iOS (No fork/exec)  │
│ • OCR graceful fallback │ • Calibre / Qt6      │ • Native WebKit WASM  │
│ • Unified errors        │ • OpenCV Scans       │ • Shared offline core │
└─────────────────────────┴──────────────────────┴───────────────────────┘
```

---

## 1. Classification Breakdown

### A. Already Working (in Docker / Server Runtime)
- **Organize**: Merge, Split, Rotate, Reorder, Extract, Delete pages (`PDFBox`).
- **Convert**: PDF to Image (`PDFRenderer` & `JPDFium`), Image to PDF (`TwelveMonkeys` & `PDFBox`).
- **Edit**: Watermark, Page numbers, Stamps, Metadata update, Form flattening & unlock (`PDFBox`).
- **Security**: Password protection, Decryption (`PDFBox` + `BouncyCastle`).
- **Client-Side WASM (Browser)**:
  - Document viewing & thumbnail generation (`pdfjs-dist`).
  - Interactive form field inspection & filling (`@embedpdf/pdfium` WASM).
  - Client-side annotation removal (`useRemoveAnnotationsOperation.ts` via PDFium WASM).
  - Client-side color & contrast adjustment (`useAdjustContrastOperation.ts` via PDFium WASM).

### B. Verified Working (Empirically Proven)
- Docker full stack verified via upstream builds.
- Client-side WASM PDFium rendering and manipulation verified in frontend tests.

### C. Needs Packaging (Desktop Application)
*The code exists and works when dependencies are on PATH, but desktop installers currently omit the binaries:*
- **Java JRE 25**: Currently built via `jlink`, must ensure automated inclusion in Windows/macOS/Linux NSIS/DMG/Deb bundles.
- **Tesseract CLI**: Must package portable `tesseract.exe` and Leptonica DLLs into desktop `resources/bin/`.
- **Language Models (`tessdata`)**: Must package `eng.traineddata` (~4 MB) and `osd.traineddata` (~10 MB) into desktop `resources/tessdata/`.
- **QPDF**: Must package static `qpdf.exe` (~10 MB) into desktop `resources/bin/` for linearization and structural repair.
- **Ghostscript**: Package static `gswin64c.exe` into desktop resources, ensuring AGPL-3.0 compliance.
- **Poppler Utilities**: Package `pdftohtml.exe` for PDF-to-HTML and PDF-to-Markdown tools.

### D. Needs Refactoring
- **Decouple hardcoded Linux paths**: Replace `/usr/share/tesseract-ocr/5/tessdata` in `RuntimePathConfig.java` with a cross-platform resolver that automatically checks application resource directories.
- **Desktop Resource Discovery**: Teach `RuntimePathConfig.java` to discover bundled binaries (`tesseract`, `qpdf`, `gs`) relative to the application install path on Windows/macOS.
- **Graceful Degradation**: Replace uncaught 500 exceptions with typed capability warnings when optional CLI tools are absent.
- **Built-in Office Convert Defaults**: Change default from external LibreOffice to pure Java Office Convert for standard DOCX/XLSX handling.

### E. Needs Local / WASM Implementation (PWA & Offline Web)
*Move from Java backend dependency to 100% in-browser client execution:*
- **Core Page Operations**: Implement Merge, Split, Rotate, Extract, Reorder, and Delete using `@cantoo/pdf-lib` and `@embedpdf/pdfium` in client Web Workers.
- **Security & Protection**: Client-side password encryption and decryption using `pdf-lib` / Web Crypto API.
- **Watermarking & Page Numbers**: Client-side canvas/PDF overlay using `pdf-lib`.
- **Browser OCR**: Implement client-side OCR using **Tesseract.js** (WASM) in a Web Worker, caching language models in IndexedDB.
- **Repair & Linearization**: Compile QPDF to WebAssembly via Emscripten for client-side structural repair.

### F. Desktop-Only Features
*Features that remain native desktop strengths due to binary bundling:*
- High-speed Ghostscript deep compression.
- Native JPDFium regex redaction.
- Offline desktop Tesseract OCR with bundled language models.
- Direct local filesystem save/open without browser download prompts.

### G. Server-Dependent Features (Optional Cloud / Docker Backends)
*Heavy dependencies impractical for lightweight desktop bundling or browser WASM:*
- **LibreOffice**: High-fidelity legacy Office conversions (.doc, .ppt, complex layouts).
- **WeasyPrint**: HTML/CSS rendering requiring Python and Cairo/Pango C libraries.
- **Calibre**: E-book formats (MOBI, AZW, FB2) requiring Calibre's Python/Qt stack.
- **OpenCV Python**: Complex multi-contour perspective rectification for scanned photo albums.

### H. Future Mobile Implementation (Android & iOS)
*Strict architectural separation required for mobile:*
- **Android**:
  - JVM cannot run desktop Spring Boot backend.
  - Subprocess execution (`ProcessBuilder`) cannot spawn standalone CLI tools.
  - Path forward: Hybrid Capacitor/Tauri shell running client-side WASM engine or native Android NDK libraries.
- **iOS**:
  - Apple sandbox prohibits `fork()` and `exec()`.
  - No background server processes.
  - Path forward: 100% in-browser WASM engine within WebKit, or native Swift/C++ PDFKit integration.

---

## 🗺️ Execution Phases

```text
Phase 1: Foundation, Identity & Audit ◄── [COMPLETED]
   │
   ▼
Phase 2: Modern Workspace & Editor Experience (In Progress)
   │
   ▼
Phase 3: Desktop Self-Contained Packaging (Windows / macOS / Linux)
   │
   ▼
Phase 4: Local-First Client Acceleration (PWA / WASM Engine)
   │
   ▼
Phase 5: Mobile & Cross-Platform (Android / iOS)
```

---

## Phase 1 — Foundation, Identity & Audit (Completed)

- [x] **Product Identity Transition:** Rebrand user-facing strings, document titles, vector icons, metadata, and banners to **Fold**.
- [x] **Privacy-First Defaults:** Telemetry disabled, stack traces hidden, anonymous access default.
- [x] **Comprehensive Runtime Dependency Audit:** Complete audit of all 22 external runtime dependencies (`docs/DEPENDENCIES.md`).
- [x] **OCR Deep-Dive Audit:** Complete tracing of OCR pipeline, language models, and configuration requirements (`docs/OCR_AUDIT.md`).
- [x] **Feature Verification Report:** Source-level audit of all 50+ operations with missing dependency documentation (`docs/FEATURE_VERIFICATION.md`).
- [x] **Deployment Model & Architecture Definition:** Boundary established between Fold Application Logic, Document Operations Contract, Processing Adapters, and Document Engines (`docs/DEPLOYMENT_AND_ARCHITECTURE.md`).

---

## Phase 2 — Modern Workspace & Editor Experience

- [ ] **Unified Document Canvas:** Clean edge-to-edge viewer with fluid zooming and panning.
- [ ] **Contextual Action Bar:** Floating tool dock adapting to active document context.
- [ ] **Streamlined Multi-File Navigation:** Tabbed document bar and comparison diff view.
- [ ] **Graceful Dependency Indicators:** UI indicators for features requiring external runtimes.

---

## Phase 3 — Desktop Self-Contained Packaging (Windows / macOS / Linux)

- [ ] **Tauri JRE Verification:** Ensure bundled JRE 25 boots reliably across clean Windows/macOS/Linux installs.
- [ ] **Bundle Portable Tesseract & tessdata:** Package `tesseract.exe`, `eng.traineddata`, and `osd.traineddata` in desktop installer.
- [ ] **Bundle Portable QPDF:** Include `qpdf.exe` for instant repair and linearization.
- [ ] **Update RuntimePathConfig:** Implement dynamic discovery of bundled desktop binaries so no manual configuration is required.
- [ ] **Default to Built-in Office Convert:** Enable pure Java Office conversion by default for zero-install DOCX/XLSX conversion.

---

## Phase 4 — Local-First Client Acceleration (PWA / WASM)

- [ ] **Client-Side Document Operations Adapter:** Implement Merge, Split, Rotate, Delete, and Extract in browser via `@cantoo/pdf-lib` and `@embedpdf/pdfium`.
- [ ] **Client-Side Security:** Password protection and encryption in-browser.
- [ ] **Tesseract.js WebAssembly OCR:** Enable true offline OCR in PWA via Web Workers and cached language models.
- [ ] **Offline PWA Support:** Service worker caching and Origin Private File System (OPFS) integration.

---

## Phase 5 — Mobile & Cross-Platform (Android & iOS)

- [ ] **Mobile Touch-Optimized UI:** Responsive mobile layouts and gesture navigation.
- [ ] **WebKit/WASM Sandboxed Processing:** Pure in-memory document operations complying with iOS App Store rules.
- [ ] **Android NDK / WASM Bridge:** High-performance local document processing without desktop JVM.
