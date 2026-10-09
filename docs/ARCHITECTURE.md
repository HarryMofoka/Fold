# Fold Architecture Documentation

## 1. System Overview

**Fold** is a privacy-first, local-capable PDF workspace and document processing platform. It is engineered with a layered, decoupled architecture allowing document manipulation to occur locally in the client where possible, and securely on the backend engine when heavy compute or format conversions are needed.

```text
┌────────────────────────────────────────────────────────┐
│                        Fold UI                         │
│   (Vite + React 19 + TypeScript + Mantine + Tailwind)  │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       (Client-Side WASM)       (REST API / Local Proxy)
                │                        │
                ▼                        ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│  Browser-Native Engine    │ │      Fold Backend        │
│  - @cantoo/pdf-lib        │ │  - Spring Boot (Java 21+)│
│  - PDF.js / EmbedPDF      │ │  - Apache PDFBox 3.0     │
│  - WebAssembly Runtimes   │ │  - BouncyCastle Crypto   │
│  - IndexedDB Storage      │ │  - Tesseract OCR         │
└───────────────────────────┘ │  - Document Converters   │
                              └──────────┬───────────────┘
                                         │
                                         ▼
                              ┌──────────────────────────┐
                              │     Local Filesystem     │
                              │  (Auto-cleaned temp dir) │
                              └──────────────────────────┘
```

---

## 2. Major Components

The repository is organized into distinct functional submodules:

### 2.1. Frontend Single Page Application (`frontend/editor`)
* **Technology Stack:** React 19, TypeScript, Vite, Mantine UI components (`@mantine/core`), and Tailwind CSS.
* **Canvas & Rendering Engine:** Powered by `@embedpdf/core`, `@embedpdf/plugin-render`, and Mozilla's `pdfjs-dist` (v5.4+).
* **Client-Side PDF Manipulation:** Integrates `@cantoo/pdf-lib` for zero-server document merges, splits, page rotations, and deletions.
* **Interactive Signature & Annotation Layers:** Features vector freehand drawing (`signature_pad`), drag-and-drop page manipulation (`@dnd-kit/core`, `@atlaskit/pragmatic-drag-and-drop`), and annotation overlays.
* **Desktop Shell (`frontend/editor/src-tauri`):** Tauri v2 wrapper connecting the web application directly to the native desktop OS environment.

### 2.2. Core Backend Application (`app/core`)
* **Technology Stack:** Java 21+ (Java 25 compatible), Spring Boot 4.x, Spring MVC, and Jetty HTTP engine.
* **Primary Processing Engine:** Apache PDFBox 3.0.8 for low-level PDF parsing, content stream extraction, structural manipulation, and rendering.
* **Security & Cryptography:** BouncyCastle (v1.85) providing X.509 PKCS#12 digital signature generation, verification, and AES-128/256 encryption/decryption.
* **Document Converters:** Native adapters for WeasyPrint, LibreOffice (`soffice`/`unoconvert`), Calibre (`ebook-convert`), and Tesseract OCR (`ocrmypdf`).
* **Routing & SPA Gateway:** `ReactRoutingController.java` serves static frontend bundles, transparently forwarding non-API client routes to `index.html` while serving prerendered route metadata for link previews.

### 2.3. Common Utilities & Lifecycle Layer (`app/common`)
* **Temporary File Management:** `TempFileManager.java` and `TempFileCleanupService.java` provide deterministic lifecycle tracking for all file uploads and intermediate transformation artifacts.
* **Configuration Model:** `ApplicationProperties.java` maps system properties, YAML templates, and environment variables into typed configuration beans.
* **Exception Standardization:** `GlobalExceptionHandler.java` translating internal processing exceptions into RFC 7807 Problem Detail responses without exposing internal stack traces.

### 2.4. Python Processing Engine (`engine/`)
* **Technology Stack:** Python 3.12+ managed via `uv` and `pyproject.toml`.
* **Purpose:** Handles specialized image recognition, advanced OCR tasks, and automated document analysis tasks.

---

## 3. PDF Processing & Data Flows

Fold uses a **hybrid execution strategy**: operations that can run entirely in the browser run locally with zero network overhead; operations that require heavy native binary tooling run via the backend engine.

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

### 3.2. Server-Side Processing Execution Flow
```text
User drops file into Tool Panel
   │
   ▼
HTTP POST /api/v1/... (Multipart File Upload)
   │
   ▼
TempFileManager writes to isolated temp directory (prefix: fold-)
File registered in TempFileRegistry
   │
   ▼
Controller validates MIME, size limits, and parameter integrity
   │
   ▼
Service Layer invokes processing engine:
   ├─ PDFBox: Structural edits, bookmarks, text replace, watermarks
   ├─ BouncyCastle: Certificate signing, password encryption
   ├─ Tesseract: OCR text layer extraction
   └─ Subprocess (LibreOffice / WeasyPrint): Format conversions
   │
   ▼
Result streamed to client as StreamingResponseBody
   │
   ▼
TempFileRegistry unlinks temporary artifacts; TempFileCleanupService sweeps stale files
```

---

## 4. File Lifecycle & Security Model

### 4.1. Temporary File Management
* **Deterministic Tracking:** Every temporary file created during processing is registered with `TempFileRegistry`.
* **Automated Cleanup:** `TempFileCleanupService` operates a dual-cleanup cycle:
  1. *Immediate Cleanup:* Intermediate files are removed immediately upon completion of the HTTP response stream.
  2. *Scheduled Background Sweep:* A background scheduled task scans temp directories every 30 minutes, purging unregistered files older than `maxAgeHours` (default 24h, zero-byte artifacts purged after 5 minutes).
  3. *Startup Purge:* Upon application startup, lingering temporary files from previous abrupt terminations are cleaned up.

### 4.2. Security Hardening
* **Path Traversal Protection:** Input filenames are sanitized through strict path-element stripping. Arbitrary absolute or relative paths (`../`) in uploads are rejected.
* **Command Execution Isolation:** External subprocess invocations (e.g. `soffice`, `ocrmypdf`) pass arguments strictly as structured argument arrays rather than shell strings, preventing shell injection vulnerabilities.
* **SSRF Mitigation:** HTML/URL converters run with `urlSecurity.level = MEDIUM` or `MAX`, blocking internal networks (RFC 1918 private subnets 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), link-local addresses, and cloud provider metadata endpoints (`169.254.169.254`).
* **Error Sanitization:** `spring.web.error.include-stacktrace=never` ensures that unhandled internal exceptions never expose JVM stack traces or system environment details to the user interface.

---

## 5. Configuration & Environment Variables

Fold configuration is driven by `settings.yml` (templated from `settings.yml.template`) with environment variable overrides:

| Environment Variable | Description | Default | Privacy / Safety Impact |
| :--- | :--- | :--- | :--- |
| `SERVER_PORT` | Port for the backend server | `8080` | Local network binding |
| `SECURITY_ENABLELOGIN` | Require user accounts & login | `false` | When `false`, full application is accessible anonymously |
| `SYSTEM_ENABLEANALYTICS` | Master toggle for analytics | `false` | Disabled by default in Fold |
| `SYSTEM_ENABLEPOSTHOG` | PostHog telemetry toggle | `false` | Disabled by default in Fold |
| `SYSTEM_ENABLESCARF` | Scarf telemetry pixel toggle | `false` | Disabled by default in Fold |
| `SYSTEM_FILEUPLOADLIMIT` | Max upload size (e.g. `500MB`) | `""` (2000MB) | DoS protection |
| `SYSTEM_MAXDPI` | Maximum allowed DPI for conversions | `500` | Memory protection |
| `STIRLING_FLAVOR` | Build flavor (`core`, `proprietary`) | `proprietary` | Enables all built-in tools |

---

## 6. Target Future Architecture

To support the long-term vision of Fold (Web, PWA, Windows, Android, iOS):

```text
┌────────────────────────────────────────────────────────┐
│                   Unified Fold UI                      │
│            (Modular React / Web Components)            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               Fold Client Document Core                │
│    - Document State Machine & Document Graph           │
│    - Undo/Redo Operation History                       │
│    - Local File System Access API / OPFS Storage       │
└───────────────────────────┬────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
   ┌───────────────────────┐ ┌───────────────────────┐
   │ Client-Native Engine  │ │ Server Engine Adapter │
   │ (WebAssembly / Rust)  │ │ (Local / Remote REST) │
   │ - pdf-lib / pdfium.wasm│ │ - Spring Boot Core   │
   │ - Client-side OCR     │ │ - LibreOffice Worker  │
   └───────────────────────┘ └───────────────────────┘
```

---

## 7. Known Technical Debt & Ongoing Improvements

1. **Large Tool Component Files:** Several legacy tool controllers (e.g. `Annotate.tsx`, `EditTableOfContents.tsx`) combine UI presentation with low-level stream transformation logic. These are being incrementally refactored into modular hooks.
2. **Proprietary Module Decoupling:** Core backend functionality should run cleanly with zero references to closed or enterprise features. The `stirlingFlavor=core` target provides a clean baseline.
3. **WASM-First Migration:** Common transformation tasks currently invoking the JVM (e.g. simple watermarking, password encryption, metadata alteration) can be migrated to client-side WebAssembly runtimes, reducing memory footprint on lower-end systems.
