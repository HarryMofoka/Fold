# Fold Feature Verification & Execution Status

This document records the actual execution and verification state of core Fold operations on a standard environment, following the rule:

> **If a feature cannot be tested because a dependency is missing, explicitly state:**  
> `NOT VERIFIED — missing dependency: X`  
> **Do not call it "working."**

---

## 1. Environment Baseline

A runtime probe of the host operating system (Windows 11, bare environment) confirms:
- `java` / `javac`: Not installed on `PATH`.
- `node` / `npm`: Not installed on `PATH`.
- `python`: Not installed (Windows Store stub only).
- `tesseract`: Not installed on `PATH`.
- `gs` (Ghostscript): Not installed on `PATH`.
- `qpdf`: Not installed on `PATH`.
- `soffice` (LibreOffice): Not installed on `PATH`.
- `docker` / `podman`: Not installed.
- `wsl`: Windows Subsystem for Linux not installed.

Because no runtime is pre-bundled in the downloaded repository files, none of the server-side endpoints could be executed live on this host machine. Every operation has been audited at the source-code level to identify its underlying engine, code path, and required dependencies.

---

## 2. Feature Verification Results

### Organize

| Operation | Controller / Implementation | Engine / Library | Result | Reason & Missing Dependency |
| :--- | :--- | :--- | :--- | :--- |
| **Merge** | `MergeController.java:54` | Apache PDFBox (`PDFMergerUtility`) | **NOT VERIFIED** | Missing dependency: Java 25 runtime |
| **Split** | `SplitPDFController.java:60` | Apache PDFBox (`Splitter`, `PDDocument`) | **NOT VERIFIED** | Missing dependency: Java 25 runtime |
| **Rotate** | `RotatePDFController.java:52` | Apache PDFBox (`PDPage.setRotation`) | **NOT VERIFIED** | Missing dependency: Java 25 runtime |
| **Reorder** | `RearrangePagesPDFController.java:50` | Apache PDFBox (page extraction & re-ordering) | **NOT VERIFIED** | Missing dependency: Java 25 runtime |
| **Extract** | `ExtractPagesController.java:45` | Apache PDFBox (`PDDocument.importPage`) | **NOT VERIFIED** | Missing dependency: Java 25 runtime |
| **Delete pages** | `RemovePagesFromPDFController.java:50` | Apache PDFBox (`PDDocument.removePage`) | **NOT VERIFIED** | Missing dependency: Java 25 runtime |

---

### Convert

| Operation | Controller / Implementation | Engine / Library | Result | Reason & Missing Dependency |
| :--- | :--- | :--- | :--- | :--- |
| **Image → PDF** | `ConvertImgPDFController.java:80` | TwelveMonkeys ImageIO + PDFBox (`PDImageXObject`) | **NOT VERIFIED** | Missing dependency: Java 25 runtime |
| **PDF → Image** | `ConvertPDFToImage.java:75` | PDFBox `PDFRenderer` / JPDFium native rasterizer | **NOT VERIFIED** | Missing dependency: Java 25 runtime |
| **DOCX → PDF** | `ConvertOfficeController.java:74` | LibreOffice CLI (`soffice --headless`) or Stirling Office Convert | **NOT VERIFIED** | Missing dependency: Java 25 runtime & LibreOffice |
| **PDF → DOCX** | `ConvertPDFToOffice.java:138` | LibreOffice CLI (`soffice --infilter="writer_pdf_import"`) or Stirling Office Convert | **NOT VERIFIED** | Missing dependency: Java 25 runtime & LibreOffice |

---

### Edit

| Operation | Controller / Implementation | Engine / Library | Result | Reason & Missing Dependency |
| :--- | :--- | :--- | :--- | :--- |
| **Watermark** | `WatermarkController.java:55` | Apache PDFBox (`PDPageContentStream`) | **NOT VERIFIED** | Missing dependency: Java 25 runtime |
| **Header/Footer / Page Numbers** | `AddPageNumbersController.java:48` | Apache PDFBox (`PDPageContentStream`) | **NOT VERIFIED** | Missing dependency: Java 25 runtime |
| **Metadata** | `UpdateMetadataController.java:46` | Apache PDFBox (`PDDocumentInformation`, `xmpbox`) | **NOT VERIFIED** | Missing dependency: Java 25 runtime |
| **Form Operations (Unlock / Flatten)** | `UnlockPdfFormsController.java`, `FlattenController.java` | Apache PDFBox (`PDAcroForm.flatten()`) | **NOT VERIFIED** | Missing dependency: Java 25 runtime |

---

### Security

| Operation | Controller / Implementation | Engine / Library | Result | Reason & Missing Dependency |
| :--- | :--- | :--- | :--- | :--- |
| **Password Protection** | `AddPasswordController.java:50` | Apache PDFBox + BouncyCastle (`StandardProtectionPolicy`) | **NOT VERIFIED** | Missing dependency: Java 25 runtime |
| **Decryption** | `RemovePasswordController.java:48` | Apache PDFBox (`setAllSecurityToBeRemoved(true)`) | **NOT VERIFIED** | Missing dependency: Java 25 runtime |
| **Redaction** | `RedactController.java:151` | JPDFium native (`PdfRedactor.redact`) | **NOT VERIFIED** | Missing dependency: Java 25 runtime |

---

### Optimize

| Operation | Controller / Implementation | Engine / Library | Result | Reason & Missing Dependency |
| :--- | :--- | :--- | :--- | :--- |
| **Compression** | `CompressController.java:1289` | Ghostscript (`gs`), QPDF (`qpdf`), ImageMagick | **NOT VERIFIED** | Missing dependency: Java 25 runtime, Ghostscript & QPDF |
| **Repair** | `RepairController.java:64` | Ghostscript (`gs`), QPDF (`qpdf`), PDFBox fallback | **NOT VERIFIED** | Missing dependency: Java 25 runtime, Ghostscript & QPDF |

---

### OCR

| Operation | Controller / Implementation | Engine / Library | Result | Reason & Missing Dependency |
| :--- | :--- | :--- | :--- | :--- |
| **OCR Scanned PDF** | `OCRController.java:113` | OCRmyPDF (`ocrmypdf`) or Tesseract (`tesseract`) | **NOT VERIFIED** | Missing dependency: Java 25 runtime, Tesseract OCR binary & tessdata language models |
| **Verify Searchable Text Exists** | `OCRController.java:379` | PDFBox `PDFTextStripper` / Tesseract PDF output | **NOT VERIFIED** | Missing dependency: Tesseract OCR binary & traineddata |
| **Verify Output PDF Opens** | `OCRController.java:480` | PDFBox `PDFMergerUtility` | **NOT VERIFIED** | Missing dependency: Tesseract OCR binary |

---

## 3. Client-Side (In-Browser / PWA) Execution Status

While backend endpoints require Java and external CLI utilities, source-code analysis reveals that two client-side operations use WebAssembly directly inside the browser without calling the backend:
1. **Adjust Contrast** (`useAdjustContrastOperation.ts:151`):
   - Implemented via `@embedpdf/pdfium` WebAssembly module (`FPDF_LoadPage`, `FPDF_RenderPageBitmap`).
   - Runs client-side in the browser.
2. **Remove Annotations** (`useRemoveAnnotationsOperation.ts:20`):
   - Implemented via `@embedpdf/pdfium` WebAssembly module (`FPDFPage_RemoveAnnot`, `saveRawDocument`).
   - Runs client-side in the browser.
3. **PDF Viewing & Form Inspection**:
   - Implemented via `pdfjs-dist` and `@embedpdf/pdfium` WebAssembly in the browser.

All remaining operations require an active HTTP backend connection.
