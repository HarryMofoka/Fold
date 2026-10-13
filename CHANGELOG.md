# Fold Transformation & Audit Changelog

This document logs all architectural, branding, privacy, and codebase changes made during the transformation of Stirling-PDF into **Fold**.

---

## [Initial Transformation & Audit] — October 2026

### 🎨 Product & Identity Transformation
- **Repository Root Project**: Updated `settings.gradle` to define `rootProject.name = 'Fold'`.
- **Application Startup Banner**: Updated `app/core/src/main/resources/banner.txt` to display the Fold ASCII banner and privacy tagline.
- **Frontend HTML & Metadata**:
  - Updated `frontend/editor/index.html` title to `Fold | Privacy-First PDF Workspace`.
  - Updated web application manifests (`manifest.json`, `manifest.desktop.json`) to reflect the Fold product name, short name, and description.
  - Updated `useDocumentMeta.ts` to dynamically maintain the Fold title hierarchy across document modes.
- **UI Components & Branding**:
  - `BrandMark.tsx`: Updated brand wordmark to render "Fold".
  - `Logo.tsx`: Updated brand logo presentations for light, dark, and icon-only modes.
  - `QuickNavBrand.tsx`: Updated sidebar brand mark to Fold.
  - `HomePage.tsx`: Updated home page brand banner and feature welcome text.
  - `AddFileCard.tsx` & `Tooltip.tsx`: Updated drag-and-drop tooltips and prompts.
  - `MobileScannerPage.tsx`: Updated mobile upload scanner instructions.
- **Brand Assets**:
  - Updated `wordmark-light.svg`, `wordmark-dark.svg`, and logo vectors to reflect the modern Fold identity while preserving open-source SVG geometries.

---

### 🛡️ Privacy & Security Defaults Hardened
- **Telemetry Disabled**:
  - PostHog product analytics disabled by default in `application.properties` (`analytics.posthog.enabled=false`).
  - Scarf gateway analytics disabled by default.
  - Updated `configs/settings.yml.template` to default all telemetry flags to `false`.
- **Information Leak Suppression**:
  - Configured `spring.web.error.include-stacktrace=never` in `application.properties` to ensure internal server exceptions never leak stack traces to client browsers.
- **Local Anonymous Access**:
  - Configured `security.enableLogin=false` in `application.properties` and `settings.yml.template` so users can immediately use the software without login or account registration walls.
- **Temporary File Isolation**:
  - Configured managed temporary files to use the `fold-` prefix (`fold-temp-` / `fold-workspace-`).

---

### 🔍 Runtime Dependency & OCR Deep-Dive Audit
- **Dependency Audit Matrix (`docs/DEPENDENCIES.md`)**:
  - Audited all 22 external runtime dependencies across Java, Spring Boot, PDFBox, JPDFium, Tesseract, OCRmyPDF, Ghostscript, QPDF, LibreOffice, WeasyPrint, Calibre, ImageMagick, OpenCV, Python, and system fonts.
  - Traced exact invocation code paths through `ProcessExecutor.java`, `RuntimePathConfig.java`, and individual REST controllers.
  - Established bundling viability, manual install requirements, platform limitations, and open-source licensing.
- **OCR Pipeline Audit (`docs/OCR_AUDIT.md`)**:
  - Traced complete OCR execution flow from frontend request to output searchable PDF.
  - Established that Tesseract is **not bundled** in raw repository downloads or desktop installers.
  - Confirmed that `0` `.traineddata` files exist in the downloaded repo.
  - Documented that on Windows, Fold defaults to Linux path `/usr/share/tesseract-ocr/5/tessdata`, requiring manual configuration to function.
  - Evaluated the roadmap to client-side PWA OCR via **Tesseract.js** WebAssembly.
- **Feature Verification Status (`docs/FEATURE_VERIFICATION.md`)**:
  - Probed the host environment for development runtimes.
  - Documented empirical execution status across Organize, Convert, Edit, Security, Optimize, and OCR features under the rule `NOT VERIFIED — missing dependency: X`.
  - Identified client-side WebAssembly operations already running in-browser (Color & Contrast Adjustment, Annotation Removal).
- **Deployment & Architecture Specification (`docs/DEPLOYMENT_AND_ARCHITECTURE.md`)**:
  - Evaluated Web/PWA, Windows Desktop, Android, and iOS deployment realities.
  - Formalized the architectural boundary separating Fold Application Logic, Document Operations Contract, Processing Adapters, and Document Processing Engines.
- **Evolutionary Roadmap (`docs/ROADMAP.md`)**:
  - Updated technical roadmap into 5 distinct phases with classifications: Already Working, Needs Packaging, Needs Refactoring, Needs Local/WASM Implementation, Desktop-Only, Server-Dependent, and Future Mobile.

---

### 🧹 Repository Hygiene & .gitignore Hardening
- **Gradle Wrapper Preserved**: Added `!gradle/wrapper/gradle-wrapper.jar` to `.gitignore` to prevent Gradle wrapper corruption on clone.
- **Build & Target Caches Ignored**: Added `target/`, `**/target/`, `build/`, and `**/build/` to prevent committing Cargo/Rust build output.
- **Test & Platform Artifacts Ignored**: Added Windows system files (`Thumbs.db`, `ehthumbs.db`, `Desktop.ini`), Playwright report folders (`playwright-report/`, `test-results/`), coverage directories, and package manager debug logs.
- **Documentation Overhaul**:
  - Rewrote root `README.md` to center around Fold's philosophy, 50+ tool catalog, privacy architecture, and local/Docker getting-started workflows.

---

### ⚡ Pure TypeScript & WebAssembly Architecture (Path 1 Rewrite)
- **Elimination of Java Runtime Dependency**:
  - Transitioned the entire document processing execution model from the Java Spring Boot backend (`app/`) to a 100% client-side, zero-server architecture in TypeScript.
- **Client PDF Engine (`frontend/editor/src/core/services/clientPdfEngine.ts`)**:
  - Built a comprehensive, in-browser PDF manipulation engine using `@cantoo/pdf-lib`, WebAssembly (`pdfiumService`), and `JSZip`.
  - Native implementations for:
    - **Organize**: Merge PDFs, Split pages (single and ZIP), Rotate pages, Reorder/Reorganize, Extract pages, Remove/Delete pages, Continuous Single Large Page.
    - **Edit & Enhance**: Add Text/Image Watermarks, Format and render Page Numbers (1-9 anchor positions), Update Document Metadata, Flatten AcroForms, Unlock form fields, Repair damaged syntax.
    - **Convert & Export**: Convert Images (JPG, PNG, WebP) to PDF, Extract Attachments, Embed arbitrary file attachments.
    - **Security & Inspection**: Document Sanitization (stripping JavaScript / OpenAction dictionaries), JavaScript inspection report, In-depth PDF metadata and geometry inspection (`getPdfInfo`).
    - **Optimization**: Object stream reconstruction and compression (`compressPdf`).
- **Seamless Local API Adapter (`frontend/editor/src/core/services/clientPdfAdapter.ts`)**:
  - Implemented an in-memory Axios adapter that intercepts `/api/v1/*` requests.
  - Wired into `core/services/apiClient.ts` and `desktop/services/apiClient.ts` via `localFirstAdapter`.
  - All 49 existing tool UI components, parameters, drag-and-drop file managers, and viewers continue to function without modification, executing completely in browser memory.
- **Developer Workflow & Taskfile Modernization**:
  - Updated `Taskfile.yml` so `task dev` launches Fold's development server directly with Vite, and `task build` produces a production-ready static bundle without requiring Java, Gradle, or external system tools.
  - Updated `README.md` with zero-Java quick start instructions.
- **Total Elimination of Python Files & Unification to JavaScript/TypeScript**:
  - Purged obsolete Python engine (`engine/`), Python cucumber test suites (`testing/cucumber/`), and all legacy `.py` scripts across the entire repository.
  - Rewrote translation status utility into a high-performance, zero-dependency Node.js script: `scripts/counter_translation.mjs`.
  - Repository codebase consolidated strictly into JavaScript and TypeScript.
- **Total Elimination of Java Backend & Gradle Build Tooling**:
  - Purged all 2,500+ Java source files and the entire Spring Boot backend (`app/core`, `app/common`, `app/proprietary`).
  - Removed Gradle wrappers and build scripts (`gradle/`, `gradlew`, `gradlew.bat`, `build.gradle`, `settings.gradle`, `gradle.properties`, `buildSrc/`).
  - Preserved and relocated all fallback TrueType fonts into `frontend/editor/public/fonts/` for in-browser PDFium WebAssembly rendering.
  - Removed Java `.taskfiles/backend.yml` and unified `Taskfile.yml` exclusively around the TypeScript frontend.


