<p align="center">
  <pre align="center">
  ███████╗ ██████╗ ██╗     ██████╗ 
  ██╔════╝██╔═══██╗██║     ██╔══██╗
  █████╗  ██║   ██║██║     ██║  ██║
  ██╔══╝  ██║   ██║██║     ██║  ██║
  ██║     ╚██████╔╝███████╗██████╔╝
  ╚═╝      ╚═════╝ ╚══════╝╚═════╝ 
  </pre>
</p>

<p align="center">
  <strong>Your PDFs. Still yours.</strong>
</p>

<p align="center">
  <em>The private, local-first, zero-cloud PDF workspace running entirely in your browser or on your desktop.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Privacy-100%25%20Local-22c55e?style=for-the-badge&logo=shield" alt="100% Local" />
  <img src="https://img.shields.io/badge/Cloud%20Uploads-Zero-blue?style=for-the-badge" alt="Zero Cloud Uploads" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20Desktop-purple?style=for-the-badge" alt="Web and Desktop" />
  <img src="https://img.shields.io/badge/License-MIT-amber?style=for-the-badge" alt="MIT License" />
</p>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Why Fold?](#-why-fold)
- [How It Works: Zero-Cloud Architecture](#-how-it-works-zero-cloud-architecture)
- [Complete Feature Catalog](#-complete-feature-catalog)
  - [1. Organize & Assemble](#1-organize--assemble)
  - [2. Edit, Annotate & Markup](#2-edit-annotate--markup)
  - [3. Security, Privacy & Redaction](#3-security-privacy--redaction)
  - [4. Optimize, Convert & Flatten](#4-optimize-convert--flatten)
- [Fold vs. Cloud PDF Converters](#-fold-vs-cloud-pdf-converters)
- [Quick Start Guide](#-quick-start-guide)
  - [Web Development](#web-development)
  - [Desktop Application (Tauri)](#desktop-application-tauri)
  - [Static Production Build](#static-production-build)
- [Project Architecture & Directory Layout](#-project-architecture--directory-layout)
- [Keyboard Shortcuts & Workflows](#-keyboard-shortcuts--workflows)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Fold** is a full-featured, privacy-sovereign document workspace that gives you complete control over your PDF files. Unlike conventional online PDF utilities that force you to upload sensitive contracts, bank statements, tax documents, and personal IDs to third-party cloud servers, **Fold executes 100% of its document processing directly on your machine**.

Built on **React 19**, **Vite**, **Mantine UI**, **Tailwind CSS**, Mozilla's **PDF.js**, and **`@cantoo/pdf-lib`**, Fold combines desktop-grade document manipulation capabilities with the instantaneous responsiveness and convenience of a modern web application.

```
┌────────────────────────────────────────────────────────────────────────┐
│  NO ACCOUNTS  ·  NO SUBSCRIPTIONS  ·  NO TRACKING  ·  NO CLOUD UPLOADS  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Why Fold?

Working with PDF files should not require compromising your confidentiality or paying monthly subscription fees for basic document tasks.

* **🔒 Mathematically Private:** Documents never leave your device. Every operation—splitting, merging, redacting, signing, encrypting, and reordering—is computed locally inside your browser's WebAssembly and JavaScript sandbox.
* **⚡ Instantaneous Processing:** No network upload or download bottlenecks. Files process immediately at native memory speeds, whether you are dealing with a 2-page invoice or a 500-page legal brief.
* **✈️ 100% Offline & Air-Gapped:** Load Fold once and disconnect your Wi-Fi: every tool continues functioning without an active internet connection.
* **🆓 Unrestricted & Free:** No arbitrary page limits, no 15 MB file size caps, no daily upload throttling, and no invasive promotional watermarks stamped onto your output files.
* **📱 P2P Mobile Scanner:** Need to digitize paper? Scan documents using your smartphone's camera via a peer-to-peer WebRTC connection directly to your computer—with zero third-party cloud relays.

---

## 🏗️ How It Works: Zero-Cloud Architecture

Traditional PDF websites ingest your documents onto their remote backend servers, run server-side binaries, and stream the result back to your browser. **Fold reverses this model entirely:**

```
                  ┌────────────────────────────────────────────────────────────────┐
                  │                          YOUR DEVICE                           │
                  │                                                                │
                  │   ┌────────────────────────────────────────────────────────┐   │
                  │   │                    Fold Workspace                      │   │
                  │   │       React 19 · Vite · Mantine UI · Tailwind CSS      │   │
                  │   └───────────────────────────┬────────────────────────────┘   │
                  │                               │                                │
                  │                               ▼  In-Memory ArrayBuffer         │
                  │   ┌────────────────────────────────────────────────────────┐   │
                  │   │              Client-Side Execution Engine              │   │
                  │   │                                                        │   │
                  │   │  ┌──────────────────┐  ┌────────────────────────────┐  │   │
                  │   │  │ @cantoo/pdf-lib  │  │ Mozilla pdfjs-dist         │  │   │
                  │   │  │ - Page Assembly  │  │ - High-Fidelity Rendering  │  │   │
                  │   │  │ - Merge & Split  │  │ - Text Layer Extraction    │  │   │
                  │   │  │ - Cryptography   │  │ - Visual Viewport Canvas   │  │   │
                  │   │  └──────────────────┘  └────────────────────────────┘  │   │
                  │   │  ┌──────────────────┐  ┌────────────────────────────┐  │   │
                  │   │  │ WebAssembly Core │  │ Web Worker Pool            │  │   │
                  │   │  │ - Fast PDFium    │  │ - Non-blocking Processing  │  │   │
                  │   │  │ - Stream Parsing │  │ - Background Thumbnails    │  │   │
                  │   │  └──────────────────┘  └────────────────────────────┘  │   │
                  │   │  ┌──────────────────┐  ┌────────────────────────────┐  │   │
                  │   │  │ IndexedDB Cache  │  │ WebRTC P2P Sync            │  │   │
                  │   │  │ - Local History  │  │ - Direct Mobile Scanner    │  │   │
                  │   │  │ - Session State  │  │ - Air-Drop style Transfer  │  │   │
                  │   │  └──────────────────┘  └────────────────────────────┘  │   │
                  │   └───────────────────────────┬────────────────────────────┘   │
                  │                               │                                │
                  │                               ▼ Pure Client Save               │
                  │                    [ Your Local Storage ]                      │
                  └───────────────────────────────┬────────────────────────────────┘
                                                  │
                                            NO CONNECTION
                                               NEEDED
                                                  │
                                                  ▼
                                            ┌───────────┐
                                            │ THE CLOUD │  ◄── ZERO BYTES SENT
                                            └───────────┘
```

---

## 🧰 Complete Feature Catalog

Fold provides an extensive suite of specialized PDF tools organized into four core functional pillars:

```
┌───────────────────────────┬───────────────────────────┐
│   1. ORGANIZE & ASSEMBLE  │  2. EDIT & ANNOTATE       │
│   Merge, Split, Arrange   │  Text, Ink, Forms, Stamps │
├───────────────────────────┼───────────────────────────┤
│   3. SECURITY & PRIVACY   │  4. OPTIMIZE & CONVERT    │
│   Encrypt, Redact, Sign   │  Compress, Flatten, Image │
└───────────────────────────┴───────────────────────────┘
```

### 1. Organize & Assemble

Manipulate the structure, sequence, and dimensions of any PDF document:

| Tool | Capability & Implementation Details |
| :--- | :--- |
| **Merge PDFs** | Combine multiple separate PDF files into a single, seamless document. Drag and drop to reorder input files before concatenation. |
| **Split PDFs** | Disassemble a document by explicit page ranges (e.g. `1-4, 7, 9-15`), split into individual single-page documents, or split every *N* pages. |
| **Visual Page Grid** | An interactive canvas workspace displaying high-resolution thumbnails for every page. Reorder via drag-and-drop, invert page order, rotate, duplicate, or delete with one click. |
| **Extract Pages** | Select specific pages visually or via expressions to extract them into a brand-new, clean PDF. |
| **Remove / Delete Pages** | Strip out blank pages, cover sheets, or confidential sections permanently from the PDF stream. |
| **Rotate Pages** | Rotate individual pages or entire documents in 90°, 180°, or 270° increments with automatic orientation correction. |
| **Crop & Canvas Scale** | Visually crop page margins to eliminate unwanted borders or resize page dimensions to standardized print profiles (A4, US Letter, Legal). |
| **Multi-File Workbench** | Load and stage multiple documents simultaneously in a persistent local session without reloading the page. |

---

### 2. Edit, Annotate & Markup

Interact with and modify document contents directly:

| Tool | Capability & Implementation Details |
| :--- | :--- |
| **Interactive Document Editor** | Full visual editing suite supporting smooth pan, continuous scroll, multi-level zoom, single-page and two-page spreads, and page overview thumbnails. |
| **Direct Stream Text Editing** | Find and replace text directly within low-level PDF content streams—modifying typographical strings in place without flattening or rasterization. |
| **Form Filling (AcroForms)** | Detect and interactively complete standard AcroForm fields: fill text inputs, toggle checkboxes, select radio buttons, and choose options from dropdown lists. |
| **Freehand Ink & Pen** | Vector drawing layer powered by smooth bezier curves with adjustable line weight, opacity, and color palette. |
| **Highlighter & Text Snapping** | Semi-transparent highlight, underline, and strike-through annotations that automatically snap to rendered text layers. |
| **Shapes & Callouts** | Add geometric vector shapes (rectangles, ellipses, polylines, arrows) and callout speech bubbles with customizable stroke and fill colors. |
| **Rubber Stamps** | Apply pre-configured business stamps (*APPROVED*, *CONFIDENTIAL*, *DRAFT*, *VOID*, *FINAL*, *RECEIVED*) or generate customized text stamps with dates and timestamps. |
| **Headers, Footers & Pagination** | Insert automated page numbers (`Page {n} of {total}`), Roman numerals, Bates numbering, and custom header/footer text with precision alignment and margin controls. |
| **Table of Contents & Bookmarks** | Inspect, create, edit, reorder, or delete hierarchical document outlines and navigation bookmarks. |

---

### 3. Security, Privacy & Redaction

Protect sensitive information and maintain strict document governance:

| Tool | Capability & Implementation Details |
| :--- | :--- |
| **Password Encryption** | Lock documents using industry-standard **AES-128** or **AES-256** bit encryption. Set distinct **User passwords** (required to view) and **Owner passwords** (required to edit). |
| **Fine-Grained Permissions** | Restrict or allow granular capabilities: high-resolution printing, text and image copying, content modification, annotation authoring, and screen reader access. |
| **Decryption & Unlock** | Remove encryption and password restrictions from protected documents whenever you hold the decryption passphrase. |
| **Deep Metadata Sanitization** | Thoroughly purge hidden document data: author names, creation and modification timestamps, operating system metadata, software generator signatures, PDF version history, and XMP metadata trees. |
| **True Vector Redaction** | Permanently excise confidential text, figures, and vectors from the underlying PDF stream—ensuring redacted text cannot be highlighted, selected, or recovered from raw bytes. |
| **Handwritten & Digital Signatures** | Draw signatures on desktop or touch screens, import transparent signature stamps, or place formal signature blocks on agreements. |
| **P2P Mobile Document Scanner** | Point your phone camera at a QR code displayed in Fold to establish a direct WebRTC peer-to-peer data channel. Take pictures of physical paper and transfer them directly into your browser workspace without any cloud relay. |

---

### 4. Optimize, Convert & Flatten

Ensure your documents are fast, universally compatible, and archival-ready:

| Tool | Capability & Implementation Details |
| :--- | :--- |
| **PDF Stream Compression** | Intelligently compress PDF object streams and downsample oversized embedded images with adjustable DPI profiles and quality targets. |
| **Annotation & Form Flattening** | Permanently fuse interactive AcroForm fields, vector signatures, and markup annotations directly into the base page rendering layer to prevent tampering. |
| **Images to PDF** | Convert batches of PNG, JPG, WebP, SVG, and TIFF images into a unified, high-resolution PDF document with configurable page sizing and margins. |
| **PDF to Image Export** | Rasterize PDF pages into crisp PNG or JPEG image sequences at customizable DPI resolutions (72, 150, 300, 600 DPI) for web display or print. |
| **Embedded Image Extraction** | Extract all embedded raster images from within a PDF file into a downloadable ZIP archive without re-compression quality loss. |

---

## ⚖️ Fold vs. Cloud PDF Converters

| Feature / Criteria | 📁 Fold | ☁️ Online Cloud Converters (SmallPDF, iLovePDF, etc.) |
| :--- | :--- | :--- |
| **Document Location** | **Never leaves your device** (in-memory only) | Uploaded to third-party cloud servers |
| **Privacy & Compliance** | **HIPAA / GDPR compliant by design** (zero telemetry) | Data retention policies apply; risk of breach |
| **Offline Functionality** | **100% works without internet** | Fails completely without internet connection |
| **Account & Login** | **None required** — instant workspace | Frequent login walls, sign-ups, and email captures |
| **Processing Speed** | **Zero upload/download delay**; native speed | Bottlenecked by home/office upload bandwidth |
| **File Size Constraints** | **Virtually unlimited** (bounded only by local RAM) | Strict 15 MB – 50 MB caps on free tiers |
| **Cost** | **100% Free and Open Source (MIT)** | $8 – $20 / month subscriptions for full access |
| **Document Watermarks** | **Zero watermarks** | Free tiers frequently stamp watermarks onto pages |

---

## 🚀 Quick Start Guide

Fold can be run directly as a local web app or compiled into a lightweight native desktop binary.

### Prerequisites

- **Node.js**: `v20.0.0` or higher (recommended: `v22.x`)
- **npm**: `v10.0.0` or higher
- **Rust & Cargo**: (Optional, only required if compiling the native Tauri desktop shell)

---

### Web Development

To run Fold in development mode with hot-reloading:

```bash
# 1. Clone the repository
git clone https://github.com/HarryMofoka/Ink.git
cd Ink

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

Open your browser and navigate to:
```
http://localhost:5173
```

All PDF manipulation capabilities are active immediately. No background Java engines or Python environments are required!

---

### Desktop Application (Tauri)

Fold includes an optional cross-platform native desktop shell built with [Tauri v2](https://tauri.app/) (Rust):

```bash
# Start desktop development mode
npm run tauri:dev

# Build standalone desktop installer (MSI / DMG / Deb)
npm run tauri:build
```

---

### Static Production Build

Because Fold executes 100% client-side, the production build is a completely static set of HTML, JavaScript, CSS, and WebAssembly assets that can be hosted on any static host (GitHub Pages, Cloudflare Pages, Netlify, Vercel, S3):

```bash
# Build production bundle
npm run build
```

The output artifacts will be written to `dist/`.

---

## 🏛️ Project Architecture & Directory Layout

```text
Fold/
├── src/
│   ├── components/            # UI components (Editor, Toolbar, PageGrid, Canvas)
│   │   ├── editor/            # Document canvas, annotation layers, ink pad
│   │   ├── pages/             # Page organizer grid and thumbnail cards
│   │   ├── shared/            # Shared design system components & modals
│   │   └── settings/          # Local-only configuration panels
│   ├── core/                  # Core abstractions and client-side processing
│   │   ├── services/          # clientPdfEngine.ts (100% client-side PDF operations)
│   │   ├── contexts/          # FileContext.tsx (in-memory document management)
│   │   └── hooks/             # Tool orchestration and state hooks
│   ├── routes/                # Application routes (Home, Editor, Privacy, Terms)
│   ├── icons/                 # Scalable vector icon registry
│   └── theme/                 # Mantine UI & Tailwind design tokens
├── public/                    # Favicons, WebApp manifest, fonts, and static assets
├── docs/                      # Technical specifications & roadmap
│   ├── ARCHITECTURE.md        # Deep dive into client data flows
│   └── ROADMAP.md             # Development priorities
├── devGuide/                  # Developer guides and contribution standards
│   ├── CODE_COMMENTS.md       # Guidelines for code comments
│   └── HowToAddNewLanguage.md # Internationalization guide
├── src-tauri/                 # Tauri Rust desktop application configuration
├── package.json               # Dependencies and build scripts
├── vite.config.ts             # Vite configuration with @app/* alias resolution
├── tailwind.config.js         # Tailwind typography and theme configuration
└── README.md                  # Project overview and documentation
```

### Import Paths (`@app/*`)

The codebase uses `@app/*` as the universal import alias configured in `vite.config.ts` and `tsconfig.json`:

```typescript
// Correct
import { useFileContext } from "@app/contexts/FileContext";
import { clientPdfEngine } from "@app/services/clientPdfEngine";
```

---

## ⌨️ Keyboard Shortcuts & Workflows

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>O</kbd> / <kbd>⌘</kbd> + <kbd>O</kbd> | Global | Open file selector dialog |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> / <kbd>⌘</kbd> + <kbd>S</kbd> | Editor | Save / Download processed PDF |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>⌘</kbd> + <kbd>Z</kbd> | Editor | Undo last action |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> / <kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Editor | Redo undone action |
| <kbd>Ctrl</kbd> + <kbd>+</kbd> / <kbd>⌘</kbd> + <kbd>+</kbd> | Canvas | Zoom in |
| <kbd>Ctrl</kbd> + <kbd>-</kbd> / <kbd>⌘</kbd> + <kbd>-</kbd> | Canvas | Zoom out |
| <kbd>Ctrl</kbd> + <kbd>0</kbd> / <kbd>⌘</kbd> + <kbd>0</kbd> | Canvas | Reset zoom to 100% / Fit to Page |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | Page Grid | Delete selected page(s) |
| <kbd>Space</kbd> + <kbd>Click & Drag</kbd> | Canvas | Pan document viewport |

---

## 🤝 Contributing

Contributions to Fold are warmly welcomed! To contribute:

1. **Fork the repository** on GitHub.
2. **Create a descriptive feature branch**:
   ```bash
   git checkout -b feature/cool-new-tool
   ```
3. **Ensure quality checks pass**:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   ```
4. **Adhere to Code Comment Guidelines**: Review [devGuide/CODE_COMMENTS.md](devGuide/CODE_COMMENTS.md) before submitting.
5. **Open a Pull Request** with a detailed summary of your changes.

---

## 📄 License

Fold is open-source software licensed under the **[MIT License](LICENSE)**.

```
Copyright (c) 2025-2026 Fold Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<p align="center">
  <sub>Built with care for document privacy and digital sovereignty.</sub>
</p>
