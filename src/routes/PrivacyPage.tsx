import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EDITOR_BASENAME } from "@app/routes/editorBasename";
import "@app/styles/legalDocs.css";

interface TocItem {
  id: string;
  number: string;
  title: string;
  category?: string;
}

const PRIVACY_SECTIONS: TocItem[] = [
  {
    id: "local-execution",
    number: "01",
    title: "Local-First Architecture",
    category: "Core Model",
  },
  {
    id: "data-categories",
    number: "02",
    title: "Data Classification Matrix",
    category: "Core Model",
  },
  {
    id: "client-memory",
    number: "03",
    title: "Memory & Blob Lifecycles",
    category: "Storage & Cache",
  },
  {
    id: "local-storage",
    number: "04",
    title: "IndexedDB & Local Storage",
    category: "Storage & Cache",
  },
  {
    id: "ocr-pipeline",
    number: "05",
    title: "Local OCR & Text Recognition",
    category: "Processing",
  },
  {
    id: "p2p-scanner",
    number: "06",
    title: "Peer-to-Peer Mobile Scanner",
    category: "Processing",
  },
  {
    id: "telemetry-cookies",
    number: "07",
    title: "Telemetry & Cookies",
    category: "Privacy & Tracking",
  },
  {
    id: "gdpr-compliance",
    number: "08",
    title: "GDPR & International Law",
    category: "Compliance",
  },
  {
    id: "hipaa-ferpa",
    number: "09",
    title: "HIPAA & Confidential Records",
    category: "Compliance",
  },
  {
    id: "user-rights",
    number: "10",
    title: "Data Subject Rights (DSAR)",
    category: "Rights & Security",
  },
  {
    id: "security-architecture",
    number: "11",
    title: "Cryptographic Security",
    category: "Rights & Security",
  },
  {
    id: "policy-updates",
    number: "12",
    title: "Revisions & Inquiries",
    category: "Rights & Security",
  },
];

export default function PrivacyPage() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string>("local-execution");

  useEffect(() => {
    const rootEl = document.querySelector(".legal-docs-page");
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      {
        root: rootEl,
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      },
    );

    PRIVACY_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  const scrollToTop = () => {
    const container = document.querySelector(".legal-docs-page");
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="legal-docs-page">
      {/* Top Header Navigation */}
      <header className="legal-docs-header" data-purpose="site-header">
        <a
          aria-label="Fold Home"
          className="legal-docs-header__brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
          href="/"
        >
          <svg className="legal-docs-header__logo" viewBox="0 0 24 24">
            <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18.2 8 12 11.8 5.8 8 12 4.2zM5.5 9.5l5.5 3.4v7.2L5.5 16.5V9.5zm7.5 10.6v-7.2l5.5-3.4v7l-5.5 3.6z" />
          </svg>
          <span className="legal-docs-header__title">fold</span>
        </a>

        <nav className="legal-docs-header__nav">
          <a
            className="legal-docs-header__link"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
            href="/"
          >
            Home
          </a>
          <a
            className="legal-docs-header__link"
            onClick={(e) => {
              e.preventDefault();
              navigate("/open");
            }}
            href="/open"
          >
            Platforms
          </a>
          <a
            className="legal-docs-header__link"
            onClick={(e) => {
              e.preventDefault();
              navigate("/docs");
            }}
            href="/docs"
          >
            Docs
          </a>
          <span className="legal-docs-header__link is-active">Privacy</span>
          <a
            className="legal-docs-header__link"
            onClick={(e) => {
              e.preventDefault();
              navigate("/terms");
            }}
            href="/terms"
          >
            Terms
          </a>
        </nav>

        <button
          onClick={() => navigate("/open")}
          className="legal-docs-header__cta"
        >
          <span>Open Fold</span>
          <svg
            className="w-3.5 h-3.5 opacity-80"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M5 12h14M12 5l7 7-7 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>
      </header>

      {/* Main Documentation Shell */}
      <div className="legal-docs-layout">
        {/* Left Sidebar */}
        <aside className="legal-docs-layout__sidebar">
          {/* Document Switcher */}
          <div className="legal-docs-switcher">
            <span className="legal-docs-switcher__label">
              Legal &amp; Policy Hub
            </span>
            <button className="legal-docs-switcher__tab is-active">
              <span>Privacy Policy</span>
              <span className="text-[10px] font-mono opacity-80">v2.4</span>
            </button>
            <button
              className="legal-docs-switcher__tab"
              onClick={() => navigate("/terms")}
            >
              <span>Terms of Service</span>
              <span className="text-[10px] font-mono opacity-60">v2.4</span>
            </button>
            <button
              className="legal-docs-switcher__tab"
              onClick={() => navigate("/docs")}
            >
              <span>Developer Docs</span>
              <span className="text-[10px] font-mono opacity-60">&rarr;</span>
            </button>
          </div>

          {/* Table of Contents Navigation */}
          <div className="legal-docs-nav-group">
            <span className="legal-docs-nav-group__title">Sections</span>
            {PRIVACY_SECTIONS.map((item) => (
              <a
                key={item.id}
                className={`legal-docs-nav-link ${
                  activeId === item.id ? "is-active" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(item.id);
                }}
                href={`#${item.id}`}
              >
                <span className="legal-docs-nav-link__num">{item.number}</span>
                <span className="truncate">{item.title}</span>
              </a>
            ))}
          </div>

          {/* Quick Info Box */}
          <div className="p-3.5 rounded-xl bg-stone-100/80 border border-stone-200/70 text-[11px] text-stone-600 leading-normal">
            <span className="font-semibold text-stone-900 block mb-1">
              Zero-Cloud Verification
            </span>
            Inspect network traffic in Chrome/Firefox DevTools (Network tab).
            You will confirm 0 document bytes ever leave your device.
          </div>
        </aside>

        {/* Center Reading Content */}
        <main className="legal-docs-layout__content">
          {/* Hero Header */}
          <div className="legal-docs-hero">
            <div className="legal-docs-hero__eyebrow">
              <span>Legal Charter</span>
              <span>&bull;</span>
              <span>Privacy &amp; Data Protection</span>
            </div>
            <h1 className="legal-docs-hero__title">Fold Privacy Policy</h1>
            <p className="legal-docs-hero__lead">
              Your PDFs. Still yours. Fold processes all documents locally
              inside your browser with zero remote storage, zero file
              transmissions, and verifiable client-side execution.
            </p>
            <div className="legal-docs-hero__pills">
              <span className="legal-docs-pill legal-docs-pill--emerald">
                100% Client-Side
              </span>
              <span className="legal-docs-pill legal-docs-pill--stone">
                Zero Cloud Uploads
              </span>
              <span className="legal-docs-pill legal-docs-pill--stone">
                No Server Storage
              </span>
              <span className="legal-docs-pill legal-docs-pill--amber">
                Air-Gapped Ready
              </span>
              <span className="legal-docs-pill legal-docs-pill--stone">
                Effective: October 2026
              </span>
            </div>
          </div>

          {/* Architectural Callout Banner */}
          <div className="legal-docs-callout legal-docs-callout--primary">
            <div className="legal-docs-callout__body">
              <strong>Architectural Guarantee of Confidentiality</strong>
              Unlike traditional SaaS PDF utilities that ingest your sensitive
              tax forms, medical charts, and contracts to remote cloud
              processing clusters, Fold operates as an in-browser WebAssembly
              appliance. Your files are parsed, rendered, modified, and saved
              exclusively in local device memory. No document data is ever
              transmitted to Fold, its creators, or any third-party
              infrastructure.
            </div>
          </div>

          {/* Section 1: Local Execution */}
          <section id="local-execution" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">01</span>
              <h2 className="legal-docs-section__title">
                The Foundational Principle: True Local Execution
              </h2>
            </div>
            <p>
              Traditional PDF manipulation on the web has historically required
              a server-side runtime. When you merged or compressed a document
              with legacy services, your entire file was transmitted across the
              internet, staged on remote hard disks, processed by server-side
              binaries, and streamed back.
            </p>
            <p>
              Fold fundamentally rejects this model. Fold is built upon a{" "}
              <strong>100% client-side, local-first</strong> architecture. Every
              single operation—including merging, splitting, OCR text
              recognition, vector text editing, AcroForm filling, cryptographic
              encryption, digital signing, redaction, rotation, and
              compression—is executed entirely within your browser&apos;s
              sandboxed JavaScript and WebAssembly environment via{" "}
              <code>@cantoo/pdf-lib</code> and Mozilla <code>pdfjs-dist</code>.
            </p>
            <div className="legal-docs-cards-grid">
              <div className="legal-docs-card">
                <h4 className="legal-docs-card__title">Zero File Ingestion</h4>
                <p className="legal-docs-card__body">
                  No document bytes, page buffers, or raw inputs ever cross your
                  network adapter to our servers.
                </p>
              </div>
              <div className="legal-docs-card">
                <h4 className="legal-docs-card__title">Air-Gapped Operation</h4>
                <p className="legal-docs-card__body">
                  Fold works fully offline without an internet connection once
                  loaded as a PWA or desktop app.
                </p>
              </div>
              <div className="legal-docs-card">
                <h4 className="legal-docs-card__title">
                  Independent Verification
                </h4>
                <p className="legal-docs-card__body">
                  Auditable via browser Developer Tools. Network activity during
                  operations remains exactly zero.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Data Classification Matrix */}
          <section id="data-categories" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">02</span>
              <h2 className="legal-docs-section__title">
                Comprehensive Data Classification Matrix
              </h2>
            </div>
            <p>
              To ensure complete transparency under global data protection laws
              (such as GDPR, CCPA/CPRA, and HIPAA), the following matrix defines
              every category of data that touches the application:
            </p>
            <div className="legal-docs-table-wrap">
              <table className="legal-docs-table">
                <thead>
                  <tr>
                    <th>Data Category</th>
                    <th>Storage Location</th>
                    <th>Retention Period</th>
                    <th>Remote Transmission</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>PDF Document Content</strong>
                      <br />
                      <span className="text-xs text-stone-500">
                        Text, graphics, layers, signatures
                      </span>
                    </td>
                    <td>Client RAM (V8 Heap / Blobs)</td>
                    <td>Ephemeral (Duration of session)</td>
                    <td>
                      <span className="text-emerald-700 font-semibold font-mono">
                        NEVER (0 Bytes)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Document Passwords</strong>
                      <br />
                      <span className="text-xs text-stone-500">
                        Owner &amp; User passwords
                      </span>
                    </td>
                    <td>Client RAM only</td>
                    <td>Discarded immediately after crypto</td>
                    <td>
                      <span className="text-emerald-700 font-semibold font-mono">
                        NEVER
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Thumbnail Caches</strong>
                      <br />
                      <span className="text-xs text-stone-500">
                        Page previews for page grid
                      </span>
                    </td>
                    <td>Browser IndexedDB (Local)</td>
                    <td>Until cleared or LRU evicted</td>
                    <td>
                      <span className="text-emerald-700 font-semibold font-mono">
                        NEVER
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>User Preferences</strong>
                      <br />
                      <span className="text-xs text-stone-500">
                        Theme, zoom, locale setting
                      </span>
                    </td>
                    <td>Browser LocalStorage</td>
                    <td>Persistent on device</td>
                    <td>
                      <span className="text-emerald-700 font-semibold font-mono">
                        NEVER
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Operational Telemetry</strong>
                      <br />
                      <span className="text-xs text-stone-500">
                        Crash rate, OS version (Opt-in only)
                      </span>
                    </td>
                    <td>Encrypted PostHog cluster</td>
                    <td>90 days rolling</td>
                    <td>Only if explicit consent granted</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Browser Memory & Blobs */}
          <section id="client-memory" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">03</span>
              <h2 className="legal-docs-section__title">
                Client-Side Memory Lifecycles &amp; Memory Safety
              </h2>
            </div>
            <p>
              When you load a document into Fold, the browser generates an
              internal memory reference (a <code>Blob</code> or{" "}
              <code>ArrayBuffer</code>). Document pages are parsed in a
              dedicated background Web Worker to prevent UI blocking.
            </p>
            <ul>
              <li>
                <strong>No Disk Spillover:</strong> Fold does not create
                temporary files on your operating system disk unless explicitly
                requested by the native Tauri desktop shell in secure
                application sandboxes.
              </li>
              <li>
                <strong>Deterministic Revocation:</strong> Every object URL
                generated via <code>URL.createObjectURL()</code> is explicitly
                tracked by <code>FileContext</code> and freed via{" "}
                <code>URL.revokeObjectURL()</code> upon file closure or page
                navigation.
              </li>
              <li>
                <strong>Memory Destruction:</strong> PDF.js instances explicitly
                call <code>loadingTask.destroy()</code> when a document is
                closed, ensuring that WebAssembly allocations and rasterization
                caches are purged from system memory.
              </li>
            </ul>
          </section>

          {/* Section 4: Local Storage & IndexedDB */}
          <section id="local-storage" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">04</span>
              <h2 className="legal-docs-section__title">
                IndexedDB Caching &amp; Local Storage Governance
              </h2>
            </div>
            <p>
              To deliver high performance without re-rendering high-resolution
              page thumbnails repeatedly, Fold stores visual representations in
              your browser&apos;s local <strong>IndexedDB</strong> database.
            </p>
            <p>
              This database is bound by the browser&apos;s{" "}
              <strong>Same-Origin Policy</strong>. No external website or
              third-party script can access your cached document thumbnails. You
              have absolute control over this data:
            </p>
            <ol>
              <li>
                <strong>In-App Clear:</strong> Click{" "}
                <em>&ldquo;Clear workbench&rdquo;</em> in Fold to purge active
                documents, revoke object buffers, and clear session history.
              </li>
              <li>
                <strong>Browser Storage Wipe:</strong> Clearing your browser
                history, cache, or site data for Fold permanently erases all
                IndexedDB databases and localStorage entries.
              </li>
              <li>
                <strong>Private Browsing (Incognito):</strong> Running Fold in
                an Incognito or Private window ensures all IndexedDB databases
                and memory blobs are completely annihilated upon closing the
                window.
              </li>
            </ol>
          </section>

          {/* Section 5: Local OCR */}
          <section id="ocr-pipeline" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">05</span>
              <h2 className="legal-docs-section__title">
                Local Optical Character Recognition (OCR) Pipeline
              </h2>
            </div>
            <p>
              Fold provides optical character recognition (OCR) to convert
              scanned paper documents and non-selectable image PDFs into
              searchable, selectable text documents.
            </p>
            <div className="legal-docs-callout legal-docs-callout--highlight">
              <div className="legal-docs-callout__body">
                <strong>Zero Cloud Vision APIs</strong>
                Unlike commercial OCR engines that send your pages to cloud
                vision APIs (e.g. Google Cloud Vision or AWS Textract), Fold
                executes OCR entirely in-browser using compiled WebAssembly
                neural networks and Tesseract binaries. Your confidential
                scanned letters and medical records are never read by
                third-party AI models.
              </div>
            </div>
          </section>

          {/* Section 6: Peer-to-Peer Mobile Scanner */}
          <section id="p2p-scanner" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">06</span>
              <h2 className="legal-docs-section__title">
                Direct Peer-to-Peer Mobile Capture (WebRTC)
              </h2>
            </div>
            <p>
              The Fold Mobile Scanner feature allows you to capture documents
              with your phone camera, perform automatic quadrilateral edge
              detection and perspective correction, and send the result directly
              to your desktop workspace.
            </p>
            <p>
              This transfer occurs over an end-to-end encrypted{" "}
              <strong>WebRTC</strong> peer-to-peer data channel. The desktop
              displays a pairing QR code containing a cryptographic session
              token. Once paired, the binary image payload streams directly
              across your local network from phone to desktop. No intermediate
              relay server stores the captured photographs.
            </p>
          </section>

          {/* Section 7: Telemetry & Cookies */}
          <section id="telemetry-cookies" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">07</span>
              <h2 className="legal-docs-section__title">
                Telemetry, Analytics &amp; Strictly Functional Cookies
              </h2>
            </div>
            <p>
              Fold does not use advertising cookies, marketing tracking pixels,
              or cross-site behavioral profiling. Our privacy standards for
              metrics are:
            </p>
            <ul>
              <li>
                <strong>Disabled by Default:</strong> Analytics are strictly
                opt-in. No telemetry packets are dispatched unless affirmative
                consent is provided in the consent prompt.
              </li>
              <li>
                <strong>Aggressive Data Masking:</strong> PostHog tracking
                instances are initialized with <code>mask_all_text: true</code>{" "}
                and <code>mask_all_element_attributes: true</code>. File names,
                page numbers, document titles, and user inputs are strictly
                blocked at the source before transmission.
              </li>
              <li>
                <strong>Revocation:</strong> You can revoke your telemetry
                preference at any time in{" "}
                <em>
                  Settings &rarr; About &rarr; Legal &rarr; Cookie Preferences
                </em>
                .
              </li>
            </ul>
          </section>

          {/* Section 8: GDPR Compliance */}
          <section id="gdpr-compliance" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">08</span>
              <h2 className="legal-docs-section__title">
                GDPR, UK-GDPR &amp; International Data Sovereignty
              </h2>
            </div>
            <p>
              Under the European Union General Data Protection Regulation (EU
              GDPR) and UK Data Protection Act:
            </p>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-xs mb-4">
              <strong>Controller / Processor Legal Analysis:</strong> Under GDPR
              Article 4(7) and 4(8), Fold acts neither as a Data Controller nor
              as a Data Processor for the documents you manipulate. Because the
              software runs locally on your device without transmitting data to
              Fold&apos;s systems, you retain absolute data custody and
              sovereignty. No Data Processing Agreement (DPA) is required to use
              Fold in compliance with GDPR Article 28.
            </div>
            <p>
              Under the California Consumer Privacy Act (CCPA) and California
              Privacy Rights Act (CPRA), Fold does not &ldquo;sell&rdquo; or
              &ldquo;share&rdquo; consumer personal information or sensitive
              personal information.
            </p>
          </section>

          {/* Section 9: HIPAA & FERPA */}
          <section id="hipaa-ferpa" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">09</span>
              <h2 className="legal-docs-section__title">
                HIPAA &amp; Regulated Document Handling
              </h2>
            </div>
            <p>
              Organizations bound by the Health Insurance Portability and
              Accountability Act (HIPAA) can safely utilize Fold for processing
              Protected Health Information (PHI). Because Fold never receives,
              transmits, stores, or accesses PHI, Fold is not classified as a
              &ldquo;Business Associate&rdquo; under 45 CFR &sect; 160.103.
            </p>
            <p>
              Similarly, educational institutions subject to the Family
              Educational Rights and Privacy Act (FERPA) may utilize Fold to
              redact student transcripts and manage educational records without
              violating federal privacy mandates.
            </p>
          </section>

          {/* Section 10: Data Subject Rights */}
          <section id="user-rights" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">10</span>
              <h2 className="legal-docs-section__title">
                Data Subject Rights &amp; Zero Retention Architecture
              </h2>
            </div>
            <p>
              Data protection statutes grant individuals rights of access,
              rectification, portability, and erasure (the &ldquo;Right to Be
              Forgotten&rdquo;).
            </p>
            <p>
              Because Fold stores zero user documents and maintains no central
              database of files, Fold has no technical ability to access,
              retrieve, or delete your documents—
              <strong>
                you already possess complete, exclusive custody of them
              </strong>
              . When you close Fold or clear your browser data, your files cease
              to exist within the application environment.
            </p>
          </section>

          {/* Section 11: Cryptographic Security */}
          <section id="security-architecture" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">11</span>
              <h2 className="legal-docs-section__title">
                Cryptographic Security &amp; Client Standards
              </h2>
            </div>
            <p>
              Fold enforces industry-standard cryptographic primitives directly
              within your client:
            </p>
            <ul>
              <li>
                <strong>AES-256 Standard Encryption:</strong> When encrypting a
                document with a password in Fold, the document is secured using
                standard Adobe PDF AES-256 encryption with PBKDF2 key
                derivation.
              </li>
              <li>
                <strong>Irreversible Redaction:</strong> Fold&apos;s redaction
                tool does not merely paint a black rectangle over sensitive
                text. It physically removes the underlying vector paths, text
                glyphs, and raster streams from the PDF content stream,
                permanently destroying the data prior to export.
              </li>
              <li>
                <strong>Subresource Integrity &amp; Strict CSP:</strong> All
                assets, fonts, and WebAssembly modules are protected by rigorous
                Content Security Policies to eliminate cross-site scripting
                (XSS) vectors.
              </li>
            </ul>
          </section>

          {/* Section 12: Revisions & Contact */}
          <section id="policy-updates" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">12</span>
              <h2 className="legal-docs-section__title">
                Policy Revisions, Audits &amp; Inquiries
              </h2>
            </div>
            <p>
              We may update this Privacy Policy periodically to reflect new
              browser APIs or feature enhancements. The date of the most recent
              revision will always be prominently displayed at the top of this
              document.
            </p>
            <p>
              Because Fold is open-source, you are invited to inspect, review,
              and audit the codebase on GitHub. For security disclosures,
              vulnerability reports, or legal compliance inquiries, please
              submit an issue through our project repository or open a private
              security disclosure.
            </p>
          </section>
        </main>

        {/* Right "On This Page" TOC Column */}
        <aside className="legal-docs-layout__toc-col">
          <div className="legal-docs-toc">
            <span className="legal-docs-toc__head">On this page</span>
            <ul className="legal-docs-toc__list">
              {PRIVACY_SECTIONS.map((item) => (
                <li key={item.id}>
                  <a
                    className={`legal-docs-toc__link ${
                      activeId === item.id ? "is-active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo(item.id);
                    }}
                    href={`#${item.id}`}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
            <a
              className="legal-docs-toc__top-link"
              onClick={(e) => {
                e.preventDefault();
                scrollToTop();
              }}
              href="#top"
            >
              &uarr; Back to top
            </a>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="legal-docs-footer" data-purpose="site-footer">
        <div className="legal-docs-footer__inner">
          <a
            aria-label="Fold Home"
            className="legal-docs-footer__brand"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
            href="/"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18.2 8 12 11.8 5.8 8 12 4.2zM5.5 9.5l5.5 3.4v7.2L5.5 16.5V9.5zm7.5 10.6v-7.2l5.5-3.4v7l-5.5 3.6z" />
            </svg>
            <span>fold</span>
          </a>

          <div className="legal-docs-footer__links">
            <a
              className="legal-docs-footer__link"
              onClick={(e) => {
                e.preventDefault();
                navigate(EDITOR_BASENAME);
              }}
              href={EDITOR_BASENAME}
            >
              Tools
            </a>
            <a
              className="legal-docs-footer__link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/open");
              }}
              href="/open"
            >
              Platforms
            </a>
            <a
              className="legal-docs-footer__link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/docs");
              }}
              href="/docs"
            >
              Docs
            </a>
            <span className="font-semibold text-stone-900">Privacy</span>
            <a
              className="legal-docs-footer__link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/terms");
              }}
              href="/terms"
            >
              Terms
            </a>
          </div>

          <div className="legal-docs-footer__copy">
            <span>Your PDFs. Still yours. &copy; 2026 Fold.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
