# Fold OCR Architecture & Runtime Audit

This document traces the complete Optical Character Recognition (OCR) pipeline in **Fold** (derived from Stirling-PDF), establishing the precise runtime requirements, data flows, configuration mechanisms, and platform limitations.

---

## 1. Complete OCR Pipeline Trace

```text
User action (Selects PDF, picks languages & options in Fold UI)
      ↓
Frontend request (POST /api/v1/misc/ocr-pdf multipart FormData)
      ↓
Backend endpoint (stirling.software.SPDF.controller.api.misc.OCRController)
      ↓
Language validation (getAvailableTesseractLanguages() scans tessdata)
      ↓
OCR Execution Engine Selection:
      ├─► Mode A: OCRmyPDF Enabled (isOcrMyPdfEnabled() == true)
      │         ↓
      │    ProcessExecutor.Processes.OCR_MY_PDF ("ocrmypdf")
      │         ↓
      │    CLI: ocrmypdf --output-type pdf --pdf-renderer <hocr|sandwich>
      │         [--deskew] [--rotate-pages] [--clean] [--clean-final]
      │         --language <eng+...> input.pdf output.pdf
      │         ↓ (Optional Post-Process if removeImagesAfter == true)
      │    ProcessExecutor.Processes.GHOSTSCRIPT ("gs -dFILTERIMAGE")
      │
      └─► Mode B: Tesseract Direct (isTesseractEnabled() == true)
                ↓
           PDFBox PDFRenderer renders each page to PNG at 300 DPI
                ↓
           ProcessExecutor.Processes.TESSERACT ("tesseract")
                ↓
           CLI: tesseract <page_i.png> <page_i> -l <lang> pdf
                ↓
           Tesseract reads <lang>.traineddata from tessdata directory
                ↓
           PDFBox PDFMergerUtility merges individual page PDFs
      ↓
Response Generation:
      ├─► If sidecar == true: Zips searchable PDF + extracted .txt sidecar
      └─► If sidecar == false: Returns searchable PDF directly
```

---

## 2. Technical Findings & Factual Answers

### Where Tesseract is located
- **In Docker**: Pre-installed as an OS system package at `/usr/bin/tesseract`.
- **In Code**: Looked up via `RuntimePathConfig` and `ProcessExecutor`. On non-Docker environments, it defaults to the bare string `"tesseract"`, relying on the host system's `PATH`.
- **In Desktop (Tauri)**: It is **not present**. Tauri bundles Java and `stirling-pdf-*.jar`, but does not package a Tesseract binary.

### Whether Tesseract is bundled
- **NO.** Tesseract is **not bundled** in the repository, not bundled in the Spring Boot JAR, and not bundled in the Tauri desktop installer (`frontend/editor/src-tauri/tauri.conf.json`).

### Whether it is expected to be installed separately
- **YES.** On bare metal (Windows, macOS, Linux outside Docker), the user is expected to manually install Tesseract (e.g. via Windows installer from UB-Mannheim, Homebrew on macOS, or `apt install tesseract-ocr` on Linux).

### Where `tessdata` is located
Resolved in `RuntimePathConfig.java:123–133` using the following priority cascade:
1. `system.tessdataDir` from `configs/settings.yml` (if defined and non-empty).
2. Environment variable `TESSDATA_PREFIX` (if set).
3. Hardcoded Linux fallback: `/usr/share/tesseract-ocr/5/tessdata`.

### Which languages are included in the repository as downloaded
- **NONE.** There are **0 `.traineddata` files** in the downloaded repository.
- In Docker images, `tesseract-ocr-eng`, `tesseract-ocr-deu`, `tesseract-ocr-fra`, `tesseract-ocr-por`, `tesseract-ocr-chi-sim`, and `tesseract-ocr-osd` are installed into `/usr/share/tesseract-ocr/5/tessdata` via Debian packages.

### Which language files are required
- `eng.traineddata` is the minimum required language model for default OCR operations.
- `osd.traineddata` (Orientation and Script Detection) is required for `--rotate-pages` and `/auto-rotate-pdf`.
- For any user-selected language, `<lang>.traineddata` must exist in `tessdata`; otherwise, `OCRController.java:142` throws `ExceptionUtils.createOcrInvalidLanguagesException()`.

### Whether OCR works with the current repository as downloaded
- **NO.** Because neither the Tesseract executable nor any `.traineddata` files are present in the repository, any call to `/api/v1/misc/ocr-pdf` fails immediately with an invalid language exception or executable not found error.

### Whether OCR works without manually modifying configuration
- **On Docker**: YES, because the Dockerfile sets up `/usr/share/tesseract-ocr/5/tessdata` matching the default fallback.
- **On Windows**: **NO.** Even if a user installs Tesseract to the standard path `C:\Program Files\Tesseract-OCR`, Fold defaults to `/usr/share/tesseract-ocr/5/tessdata` unless the user manually edits `configs/settings.yml` to set:
  ```yaml
  system:
    tessdataDir: "C:/Program Files/Tesseract-OCR/tessdata"
  ```
  or sets the `TESSDATA_PREFIX` environment variable.

### Whether OCR works on Windows
- **Out of the box**: **NO.**
- **With manual setup**: YES, but requires:
  1. Installing Tesseract 5 for Windows.
  2. Downloading language models (`.traineddata`) into the tessdata directory.
  3. Adding Tesseract to Windows system `PATH`.
  4. Editing `configs/settings.yml` to specify `system.tessdataDir`.

### Whether OCR works in Docker
- **YES.** In the standard and fat Docker images, Tesseract, OCRmyPDF, `tessdata_fast`, and 5 language packs (`eng`, `deu`, `fra`, `por`, `chi-sim`, `osd`) are pre-baked into the image.

### Whether OCR can eventually work in the PWA
- **YES.** In a Progressive Web App, OCR can run entirely client-side using **Tesseract.js** (WebAssembly / Emscripten build of Tesseract) inside a Web Worker. Tesseract.js fetches `.traineddata.gz` files dynamically over HTTP, caches them in IndexedDB, and runs recognition without transmitting document bytes to any server.

### Whether additional language packs can be downloaded by Fold itself
- **Partially / Admin-Only in Backend**: `UIDataTessdataController.java:60` exposes an admin endpoint `POST /api/v1/ui-data/tessdata/download` which fetches language models from GitHub (`tesseract-ocr/tessdata_fast`).
- **Limitations**:
  - Gated behind `@PreAuthorize("hasRole('ADMIN')")`.
  - Requires write permissions to `system.tessdataDir` (fails in Docker when running as non-root with read-only system paths).
  - Not exposed to standard end users in desktop mode or offline mode.
  - Fold has no client-side / PWA language pack manager currently implemented.
