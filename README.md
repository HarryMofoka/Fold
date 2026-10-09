# Fold

> **Your documents belong to you.**

Fold is a free, privacy-first PDF editor and document workspace. It combines the depth and breadth of a 50+ tool PDF processing suite with the speed, elegance, and simplicity of a modern desktop application.

Work with your PDFs directly—no account creation, no subscriptions, no profile tracking, and no unwanted cloud uploads.

---

## Philosophy

Fold was designed to make working with documents fast, private, and frictionless:

* **Privacy-First:** Your files are your personal property. Documents are processed locally or within your private self-hosted boundary. No tracking, no behavioral telemetry, and no data harvesting.
* **Local-First Architecture:** Where technically possible, document manipulation happens client-side directly inside your browser via WebAssembly and browser APIs.
* **No Account Required:** Open Fold, drop in your files, perform your operations, and download your result. No registration, no login walls, and no email capture.
* **Zero Cloud Dependency:** Run Fold as a standalone desktop utility, inside an offline browser sandbox, or self-hosted in your private homelab or infrastructure.
* **Power Underneath, Simplicity on Top:** Behind an uncluttered, minimalist interface lies a production-grade PDF engine capable of complex transformations, digital signing, redactions, OCR, and multi-file workflows.
* **Completely Free:** Free and open-source foundation with no watermarks or artificial page limitations.

---

## Features

Fold organizes over 50 document capabilities into clear, focused categories:

### Organize
* **Merge PDFs:** Combine multiple PDFs into a single, cohesive document.
* **Split PDFs:** Split documents by page numbers, page ranges, file size, bookmark sections, outline chapters, or automatic barcode/separator detection.
* **Reorder & Rearrange:** Visual thumbnail workspace to reorder, duplicate, invert, and organize pages.
* **Rotate & Auto-Rotate:** Rotate pages manually in 90-degree increments or use automated page-orientation detection for scanned sheets.
* **Extract & Remove Pages:** Selectively extract specific pages into new documents or delete unnecessary pages.
* **Remove Blank Pages:** Detect and strip blank pages automatically using customizable threshold sensitivity.
* **Multi-Page Layout (N-Up):** Arrange multiple pages per sheet (2-up, 4-up, 9-up, 16-up) for print preparation.
* **Booklet Imposition:** Re-sequence pages specifically for folded booklets and saddle-stitch printing.
* **Posterize (Tiling):** Split large document pages across multiple standard sheets for tiled printing.
* **Continuous Single Page:** Concatenate multi-page documents vertically into a single continuous scroll page.
* **Crop & Scale:** Crop page margins or rescale canvas dimensions (A4, Letter, custom scale factors).

### Convert
* **Images to/from PDF:** Convert JPG, PNG, WEBP, GIF, TIFF, and BMP images to PDF, or export PDF pages as high-resolution images.
* **Office Documents:** Convert Microsoft Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`), and OpenDocument (`.odt`, `.ods`, `.odp`) to PDF.
* **PDF to Office:** Export PDFs to editable Microsoft Word documents or PowerPoint presentations.
* **PDF to Data (Excel & CSV):** Extract tables from PDFs directly into structured Excel (`.xlsx`) or CSV spreadsheets.
* **Web & Markup:** Render HTML files, full websites (URL), or Markdown (`.md`) formatted text directly into styled PDFs.
* **Ebooks:** Convert EPUB, MOBI, and AZW ebook formats to and from PDF.
* **Email Messages:** Convert `.eml` and `.msg` email archives, including attachments, to PDF.
* **Vector Graphics:** Convert SVG vector graphics to vector PDF documents.
* **Archival Standards (PDF/A):** Convert standard PDF documents to PDF/A formats for long-term legal archival.

### Edit
* **Interactive Document Editor:** Full visual editor with page rendering, freehand ink, highlight, underline, text callouts, shapes, and stamps.
* **Direct Content Text Editor:** Find and replace text directly within PDF stream definitions.
* **Table of Contents & Bookmarks:** Create, edit, reorder, or delete hierarchical document outlines and bookmarks.
* **Form Filling & Unlocking:** Fill out interactive AcroForm fields or unlock read-only/restricted forms.
* **Headers, Footers & Page Numbers:** Add custom pagination (Arabic, Roman, custom formatted strings) with precise positioning and font controls.
* **Watermarks:** Add multi-line or angled text watermarks with opacity and style controls.
* **Stamps:** Apply preset or custom business rubber stamps (Approved, Confidential, Draft, etc.).
* **Attachments & Portfolios:** Embed arbitrary file attachments or package multi-file collections into interactive PDF Portfolios.

### Security
* **Password Encryption:** Protect documents with standard 128-bit or 256-bit AES encryption, setting distinct user and owner passwords.
* **Decryption & Permission Controls:** Remove known passwords or configure fine-grained permissions (printing, copying, form filling, modifications).
* **Sanitization:** Strip dangerous JavaScript, embedded metadata, hidden layers, links, and sensitive structural data for safe sharing.
* **Permanent Redaction:** Search and redact sensitive text or regular expressions, permanently obliterating content from document streams.
* **Digital Signatures:** Draw handwritten signatures or sign cryptographically using X.509 PKCS#12 digital certificates.
* **RFC 3161 Timestamps:** Append cryptographically verifiable timestamps from trusted Timestamp Authorities (TSA).
* **Signature & Compliance Verification:** Validate digital signature chains and verify PDF/A compliance standards.
* **Inspect JavaScript:** Audit and extract embedded PDF JavaScript code for security inspection.

### Optimize
* **Compression & Downsampling:** Reduce file sizes through intelligent image downsampling and stream compression.
* **Decompression:** Expand compressed streams for inspection, debugging, and structural repair.
* **Flattening:** Flatten interactive form fields and annotations permanently into the visual page layer.
* **Repair:** Rebuild damaged, corrupt, or unreadable PDF structures using PDFBox and Ghostscript recovery engines.

### Images & Documents
* **Extract Embedded Images:** Extract all raster graphics embedded inside a document into a clean archive.
* **Remove Images:** Strip all images from a PDF while preserving layout and typography.
* **Scanner Simulation Effect:** Give digital PDFs an authentic physical scanned look with adjustable tilt, noise, and texture.
* **Color Inversion & Adjustment:** Contrast enhancement, dark mode color inversion, or selective color replacement.
* **Scanner Sheet Splitting:** Automatically detect, crop, and split multi-photo flatbed scans into individual images.

### Utilities
* **Optical Character Recognition (OCR):** Process scanned documents with Tesseract OCR to generate searchable, selectable text layers in dozens of languages.
* **Document Comparison:** Visual side-by-side and pixel/text diff comparison of two PDF revisions.
* **Metadata Inspector:** View and modify PDF metadata tags (Title, Author, Subject, Keywords, Creator, Producer).
* **Auto-Rename:** Automatically rename files based on extracted text patterns or detected barcodes.
* **Automation Pipelines:** Chain multiple PDF operations into repeatable multi-step processing pipelines.

---

## Privacy Architecture

Fold makes a clear distinction between how and where documents are processed:

| Mode | Where processing happens | Network activity | Ideal for |
| :--- | :--- | :--- | :--- |
| **Client-Side (Local)** | In-browser via WebAssembly, `@cantoo/pdf-lib`, and PDF.js | None. Documents never leave your browser sandbox | Quick merges, splits, viewing, rotation, signing, annotations |
| **Private Server / Local Host** | Your local machine (`localhost`) or private server | Communication only between your browser and your local/private backend | Heavy conversions (LibreOffice, OCR, PDFBox repairs) |
| **Optional Integrations** | Explicit external endpoints (e.g. public TSA timestamp servers) | Only when explicitly configured by the user | RFC 3161 timestamping from certified public authorities |

> [!NOTE]
> Fold comes with **all telemetry, analytics, and third-party trackers disabled by default**. Error handlers never expose raw stack traces to the browser.

---

## System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                        Fold UI                         │
│   (Vite + React 19 + TypeScript + Mantine + Tailwind)  │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       (Client-side WASM)       (REST API / Local Proxy)
                │                        │
                ▼                        ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│  Browser-Native Engine    │ │      Fold Backend        │
│  - @cantoo/pdf-lib        │ │  - Spring Boot (Java)    │
│  - PDF.js / EmbedPDF      │ │  - Apache PDFBox 3.0     │
│  - WebAssembly Runtimes   │ │  - BouncyCastle Crypto   │
│  - IndexedDB Storage      │ │  - Tesseract OCR Engine  │
└───────────────────────────┘ │  - Document Converters   │
                              └──────────┬───────────────┘
                                         │
                                         ▼
                              ┌──────────────────────────┐
                              │     Local Filesystem     │
                              │  (Auto-cleaned temp dir) │
                              └──────────────────────────┘
```

* **Frontend (`frontend/editor`):** Modern React 19 single-page application built on Vite, Mantine UI components, and Tailwind CSS. Features full in-browser PDF rendering, canvas annotation overlays, and drag-and-drop workspace layout.
* **Backend (`app/core`, `app/common`):** High-performance Spring Boot application orchestrating Apache PDFBox 3, BouncyCastle cryptographic providers, and external format converters.
* **Automation Engine (`engine/`):** Python-based utility microservice handling specialized document tasks.
* **Desktop Client (`frontend/editor/src-tauri`):** Native desktop shell powered by Tauri, binding the frontend to local OS file dialogs and window frames.

---

## Getting Started

### Prerequisites

* **Java:** JDK 17 or 21+ (Java 25 supported)
* **Node.js:** Node.js 20+ and npm 10+
* **Task Runner (optional but recommended):** [Task](https://taskfile.dev/)

### Running Locally

#### 1. Start Frontend and Backend together with Task:
```bash
task dev
```
This automatically allocates free local ports and launches the backend server alongside the Vite development server.

#### 2. Running the Backend independently:
```bash
# Windows
.\gradlew.bat :stirling-pdf:bootRun

# Linux / macOS
./gradlew :stirling-pdf:bootRun
```
The backend API initializes on `http://localhost:8080`.

#### 3. Running the Frontend independently:
```bash
cd frontend
npm install
npm run dev --prefix editor
```
The Fold interface starts on `http://localhost:5173` with automatic API proxying to port 8080.

#### 4. Running as a Unified Bundled Server:
To run Fold as a single standalone server with the web application pre-packaged into Spring Boot:
```bash
# Build frontend bundle into backend static resources
task backend:build:bundled

# Run the unified server
task backend:dev:bundled
```

---

## Project Structure

```text
Fold/
├── app/
│   ├── core/              # Core PDF API controllers, routes, and services
│   ├── common/            # Shared utilities, temp file management, model definitions
│   └── proprietary/       # Optional extended pipeline and security modules
├── frontend/
│   ├── editor/            # Fold web and desktop SPA (React 19 + TypeScript)
│   │   ├── src/core/      # UI components, tool registry, workspace canvas, hooks
│   │   ├── src-tauri/     # Tauri desktop application configuration
│   │   └── public/        # Static assets, vector icons, localization files
│   └── shared/            # Shared UI tokens and cross-app utilities
├── engine/                # Python processing engine (OCR and specialized tasks)
├── docs/                  # Architecture specifications and technical audits
│   ├── ARCHITECTURE.md    # In-depth technical architecture & data flows
│   ├── DEPENDENCIES.md    # Full runtime dependency audit & invocation trace
│   ├── OCR_AUDIT.md       # Complete OCR pipeline & model analysis
│   ├── FEATURE_VERIFICATION.md # Empirical execution & verification state
│   ├── DEPLOYMENT_AND_ARCHITECTURE.md # Platform deployment & layer boundary
│   └── ROADMAP.md         # Long-term feature roadmap & technical constraints
├── CHANGELOG.md           # Detailed record of all transformation changes
├── build.gradle           # Root Gradle build configuration
├── settings.gradle        # Multi-project Gradle settings
└── Taskfile.yml           # Unified task runner definitions
```

---

## Contributing

We welcome community contributions, bug reports, and pull requests!

1. Fork the repository and create a feature branch (`git checkout -b feature/amazing-feature`).
2. Adhere to code formatting:
   * Frontend: `npm run lint` and `npm run format` (using oxlint / oxfmt)
   * Backend: `./gradlew spotlessApply`
3. Verify your changes pass test suites:
   * Frontend: `npm test`
   * Backend: `./gradlew test`
4. Commit your changes with clear, semantic commit messages.
5. Submit a pull request detailing the problem solved and the implementation details.

---

## Attribution & License

Fold originated as a transformation of the open-source **Stirling-PDF** project, created by Anthony Stirling and the open-source community. Fold builds upon this strong technical foundation with a refined, privacy-first, and local-first product vision.

* **Core License:** The core platform is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
* **Third-Party Components:** Third-party libraries, including Apache PDFBox, BouncyCastle, PDF.js, and font assets, are subject to their respective open-source licenses as documented in `app/core/src/main/resources/static/3rdPartyLicenses.json`.
