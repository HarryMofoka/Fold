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

const TERMS_SECTIONS: TocItem[] = [
  {
    id: "acceptance-scope",
    number: "01",
    title: "Acceptance & Scope",
    category: "Core Terms",
  },
  {
    id: "ownership-rights",
    number: "02",
    title: "100% Document Ownership",
    category: "Core Terms",
  },
  {
    id: "license-grant",
    number: "03",
    title: "Software License Grant",
    category: "Intellectual Property",
  },
  {
    id: "acceptable-use",
    number: "04",
    title: "Acceptable Use Policy",
    category: "Obligations",
  },
  {
    id: "local-execution-disclaimer",
    number: "05",
    title: "Local Execution & Backups",
    category: "Performance",
  },
  {
    id: "third-party-code",
    number: "06",
    title: "Third-Party Components",
    category: "Intellectual Property",
  },
  {
    id: "warranty-disclaimer",
    number: "07",
    title: "Disclaimer of Warranties",
    category: "Legal Disclaimers",
  },
  {
    id: "liability-limitation",
    number: "08",
    title: "Limitation of Liability",
    category: "Legal Disclaimers",
  },
  {
    id: "indemnification",
    number: "09",
    title: "Indemnification",
    category: "Legal Disclaimers",
  },
  {
    id: "enterprise-airgapped",
    number: "10",
    title: "Enterprise & Air-Gapped",
    category: "Commercial",
  },
  {
    id: "export-controls",
    number: "11",
    title: "Export Controls",
    category: "Compliance",
  },
  {
    id: "governing-law",
    number: "12",
    title: "Dispute Resolution & Law",
    category: "Governance",
  },
  {
    id: "modifications-contact",
    number: "13",
    title: "Modifications & Inquiries",
    category: "Governance",
  },
];

export default function TermsPage() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string>("acceptance-scope");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    TERMS_SECTIONS.forEach(({ id }) => {
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
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/");
              }
            }}
            className="legal-docs-header__back-btn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
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
        </div>

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
          <a
            className="legal-docs-header__link"
            onClick={(e) => {
              e.preventDefault();
              navigate("/privacy");
            }}
            href="/privacy"
          >
            Privacy
          </a>
          <span className="legal-docs-header__link is-active">Terms</span>
        </nav>

        <div className="flex items-center gap-2">
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

          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="legal-docs-header__hamburger-btn"
          >
            <span
              className={`legal-docs-hamburger-bar ${mobileMenuOpen ? "bar-1-open" : ""}`}
            />
            <span
              className={`legal-docs-hamburger-bar ${mobileMenuOpen ? "bar-2-open" : ""}`}
            />
            <span
              className={`legal-docs-hamburger-bar ${mobileMenuOpen ? "bar-3-open" : ""}`}
            />
          </button>

        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="legal-docs-mobile-drawer">
          <div className="legal-docs-mobile-drawer__links">
            <a
              className="legal-docs-mobile-drawer__link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
                setMobileMenuOpen(false);
              }}
              href="/"
            >
              Home
            </a>
            <a
              className="legal-docs-mobile-drawer__link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/open");
                setMobileMenuOpen(false);
              }}
              href="/open"
            >
              Platforms
            </a>
            <a
              className="legal-docs-mobile-drawer__link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/docs");
                setMobileMenuOpen(false);
              }}
              href="/docs"
            >
              Documentation
            </a>
            <a
              className="legal-docs-mobile-drawer__link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/privacy");
                setMobileMenuOpen(false);
              }}
              href="/privacy"
            >
              Privacy Policy
            </a>
            <span className="legal-docs-mobile-drawer__link is-active">
              Terms of Service
            </span>
          </div>
          <div className="pt-3 border-t border-neutral-200/80">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/open");
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-black text-white text-xs font-medium cursor-pointer"
            >
              <span>Open Fold</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Documentation Shell */}
      <div className="legal-docs-layout">
        {/* Left Sidebar */}
        <aside className="legal-docs-layout__sidebar">
          {/* Document Switcher */}
          <div className="legal-docs-switcher">
            <span className="legal-docs-switcher__label">
              Legal &amp; Policy Hub
            </span>
            <button
              className="legal-docs-switcher__tab"
              onClick={() => navigate("/privacy")}
            >
              <span>Privacy Policy</span>
              <span className="text-[10px] font-mono opacity-60">v2.4</span>
            </button>
            <button className="legal-docs-switcher__tab is-active">
              <span>Terms of Service</span>
              <span className="text-[10px] font-mono opacity-80">v2.4</span>
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
            {TERMS_SECTIONS.map((item) => (
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
              Plain-English Summary
            </span>
            Fold is free and open-source software provided to process your
            documents locally. You retain 100% ownership and copyright of your
            files.
          </div>
        </aside>

        {/* Center Reading Content */}
        <main className="legal-docs-layout__content">
          {/* Hero Header */}
          <div className="legal-docs-hero">
            <div className="legal-docs-hero__eyebrow">
              <span>Legal Charter</span>
              <span>&bull;</span>
              <span>Terms &amp; User Agreement</span>
            </div>
            <h1 className="legal-docs-hero__title">
              Terms &amp; Conditions of Service
            </h1>
            <p className="legal-docs-hero__lead">
              Governing your access to and use of the Fold client application,
              local document manipulation engine, desktop utilities, and offline
              tooling.
            </p>
            <div className="legal-docs-hero__pills">
              <span className="legal-docs-pill legal-docs-pill--emerald">
                Open Source &bull; MIT
              </span>
              <span className="legal-docs-pill legal-docs-pill--stone">
                100% User Ownership
              </span>
              <span className="legal-docs-pill legal-docs-pill--stone">
                Client Execution
              </span>
              <span className="legal-docs-pill legal-docs-pill--amber">
                Commercial Use Permitted
              </span>
              <span className="legal-docs-pill legal-docs-pill--stone">
                Effective: October 2026
              </span>
            </div>
          </div>

          {/* Core Callout Banner */}
          <div className="legal-docs-callout legal-docs-callout--primary">
            <div className="legal-docs-callout__body">
              <strong>Your PDFs, Your Property, Your Control</strong>
              Fold is engineered on the principle that document utilities should
              not appropriate your property, hold your data hostage behind
              paywalls, or upload your private records to proprietary cloud
              platforms. When you use Fold, you maintain absolute, unencumbered
              ownership of your documents, both before and after processing.
            </div>
          </div>

          {/* Section 1: Acceptance & Scope */}
          <section id="acceptance-scope" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">01</span>
              <h2 className="legal-docs-section__title">
                Acceptance of Agreement &amp; Scope of Service
              </h2>
            </div>
            <p>
              Please review these Terms and Conditions (&ldquo;Terms,&rdquo;
              &ldquo;Agreement&rdquo;) carefully before accessing or using the
              Fold application, website, Progressive Web App (PWA), desktop
              installer (Tauri/Rust), or associated documentation (collectively,
              the &ldquo;Service&rdquo; or &ldquo;Software&rdquo;).
            </p>
            <p>
              By launching, accessing, downloading, installing, or interacting
              with Fold in any manner, you signify that you have read,
              understood, and agree to be bound by these Terms and our{" "}
              <a
                href="/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/privacy");
                }}
                className="font-semibold underline"
              >
                Privacy Policy
              </a>
              . If you do not agree with any provision of these Terms, you must
              promptly discontinue use of the Software.
            </p>
          </section>

          {/* Section 2: 100% Document Ownership */}
          <section id="ownership-rights" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">02</span>
              <h2 className="legal-docs-section__title">
                100% User Document Ownership &amp; Intellectual Property
              </h2>
            </div>
            <p>
              <strong>
                You retain exclusive, absolute, and uncompromised ownership
              </strong>{" "}
              over all PDF files, scans, images, vector annotations, metadata,
              and derived documents processed using Fold:
            </p>
            <ul>
              <li>
                <strong>No License Grant to Fold:</strong> You do not grant
                Fold, its maintainers, or contributors any license, royalty, or
                copyright to your files. Because processing occurs entirely on
                your device, Fold never receives or touches your content.
              </li>
              <li>
                <strong>Output Ownership:</strong> All merged PDFs, split
                documents, redacted files, converted spreadsheets, digitally
                signed records, and compressed archives generated by Fold remain
                your sole intellectual property.
              </li>
              <li>
                <strong>Freedom of Commercial Exploitation:</strong> You may
                freely use, sell, distribute, archive, or publish any document
                produced with Fold for personal, educational, governmental, or
                commercial purposes without attribution or royalty payments.
              </li>
            </ul>
          </section>

          {/* Section 3: Software License Grant */}
          <section id="license-grant" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">03</span>
              <h2 className="legal-docs-section__title">
                Software License Grant &amp; Open-Source Rights
              </h2>
            </div>
            <p>
              Fold is licensed under the permissive <strong>MIT License</strong>
              . You are granted a perpetual, worldwide, non-exclusive,
              royalty-free license to:
            </p>
            <div className="legal-docs-cards-grid">
              <div className="legal-docs-card">
                <h4 className="legal-docs-card__title">Inspect &amp; Audit</h4>
                <p className="legal-docs-card__body">
                  Review the complete source code, inspect cryptography, and
                  verify zero-cloud privacy guarantees directly.
                </p>
              </div>
              <div className="legal-docs-card">
                <h4 className="legal-docs-card__title">Modify &amp; Fork</h4>
                <p className="legal-docs-card__body">
                  Adapt, enhance, translate, or customize Fold for specific
                  internal business workflows or private toolchains.
                </p>
              </div>
              <div className="legal-docs-card">
                <h4 className="legal-docs-card__title">
                  Self-Host &amp; Distribute
                </h4>
                <p className="legal-docs-card__body">
                  Deploy Fold within private corporate intranets, air-gapped
                  clusters, or packaged native enterprise desktop bundles.
                </p>
              </div>
            </div>
            <p className="mt-3">
              The only requirement under the MIT License is the retention of the
              original copyright notice and permission disclaimer in substantial
              copies of the Software.
            </p>
          </section>

          {/* Section 4: Acceptable Use Policy */}
          <section id="acceptable-use" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">04</span>
              <h2 className="legal-docs-section__title">
                Acceptable Use Policy &amp; User Obligations
              </h2>
            </div>
            <p>
              While Fold does not monitor or inspect documents, you represent
              and warrant that your use of the Software complies with all
              applicable local, national, and international laws. Specifically,
              you agree not to use Fold to:
            </p>
            <ul>
              <li>
                Modify, decrypt, or remove security locks from documents for
                which you lack legal authorization or copyright clearance.
              </li>
              <li>
                Forge, alter, or falsify government identity cards, financial
                instruments, educational degrees, or legally binding contracts
                with fraudulent intent.
              </li>
              <li>
                Embed malicious payloads, exploits, or malicious JavaScript into
                PDF structures to compromise recipient viewing devices.
              </li>
              <li>
                Violate export control regulations, trade embargoes, or
                sanctions by deploying Fold into prohibited jurisdictions.
              </li>
            </ul>
          </section>

          {/* Section 5: Local Execution & Backups */}
          <section
            id="local-execution-disclaimer"
            className="legal-docs-section"
          >
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">05</span>
              <h2 className="legal-docs-section__title">
                Local Execution, System Resources &amp; Backups
              </h2>
            </div>
            <p>
              Because Fold operates entirely inside your client browser or
              native runtime, processing performance is governed by your
              device&apos;s available hardware resources (CPU cores, RAM, and
              WebAssembly heap limits):
            </p>
            <div className="legal-docs-callout legal-docs-callout--warning">
              <div className="legal-docs-callout__body">
                <strong>User Responsibility for File Backups</strong>
                Document modifications (such as page deletion, page cropping, or
                redaction) permanently alter document streams upon export. You
                are strongly advised to maintain independent original backup
                copies of all files before performing irreversible
                modifications. Fold bears no responsibility for lost, corrupted,
                or overwritten files resulting from browser crashes, memory
                exhaustion, or user error.
              </div>
            </div>
          </section>

          {/* Section 6: Third-Party Components */}
          <section id="third-party-code" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">06</span>
              <h2 className="legal-docs-section__title">
                Third-Party Open Source Components &amp; Attributions
              </h2>
            </div>
            <p>
              Fold is built upon the collective ingenuity of the open-source
              community and incorporates several foundational client-side
              document processing libraries:
            </p>
            <div className="legal-docs-table-wrap">
              <table className="legal-docs-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Role in Fold</th>
                    <th>License</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>pdfjs-dist</code> (Mozilla)
                    </td>
                    <td>
                      High-fidelity client-side PDF rendering &amp; parsing
                    </td>
                    <td>Apache 2.0</td>
                  </tr>
                  <tr>
                    <td>
                      <code>@cantoo/pdf-lib</code>
                    </td>
                    <td>
                      Document modification, merging, encryption &amp; form
                      filling
                    </td>
                    <td>MIT</td>
                  </tr>
                  <tr>
                    <td>
                      <code>@embedpdf</code>
                    </td>
                    <td>
                      Vector annotations, ink drawing &amp; redaction pipeline
                    </td>
                    <td>Commercial / Open</td>
                  </tr>
                  <tr>
                    <td>
                      <code>Tauri</code> (Rust)
                    </td>
                    <td>Native cross-platform desktop application container</td>
                    <td>MIT / Apache 2.0</td>
                  </tr>
                  <tr>
                    <td>
                      <code>Lucide Icons</code>
                    </td>
                    <td>User interface iconography and brand assets</td>
                    <td>ISC</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-stone-500">
              Each component remains governed by its respective open-source
              license. Full license notices are packaged in the{" "}
              <code>LICENSE</code> file.
            </p>
          </section>

          {/* Section 7: Warranty Disclaimer */}
          <section id="warranty-disclaimer" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">07</span>
              <h2 className="legal-docs-section__title">
                Disclaimer of Warranties (&ldquo;AS-IS&rdquo;)
              </h2>
            </div>
            <p className="uppercase text-xs tracking-wider text-stone-500 font-semibold mb-2">
              Important Legal Notice
            </p>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, THE SOFTWARE
              AND SERVICES ARE PROVIDED ON AN{" "}
              <strong>&ldquo;AS IS&rdquo;</strong> AND{" "}
              <strong>&ldquo;AS AVAILABLE&rdquo;</strong> BASIS, WITHOUT
              WARRANTIES OF ANY KIND, EITHER EXPRESS, IMPLIED, STATUTORY, OR
              OTHERWISE.
            </p>
            <p>
              THE AUTHORS, CONTRIBUTORS, AND COPYRIGHT HOLDERS EXPRESSLY
              DISCLAIM ALL IMPLIED WARRANTIES, INCLUDING BUT NOT LIMITED TO THE
              IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, TITLE, ACCURACY, COMPATIBILITY, AND NON-INFRINGEMENT. WE
              DO NOT WARRANT THAT THE SOFTWARE WILL BE UNINTERRUPTED, BUG-FREE,
              SECURE, OR ACCURATE, OR THAT ANY DEFECTS IN PDF ENCODING WILL BE
              CORRECTED.
            </p>
          </section>

          {/* Section 8: Limitation of Liability */}
          <section id="liability-limitation" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">08</span>
              <h2 className="legal-docs-section__title">
                Limitation of Liability &amp; Damages Cap
              </h2>
            </div>
            <p>
              UNDER NO LEGAL THEORY (WHETHER IN CONTRACT, TORT, NEGLIGENCE,
              STRICT LIABILITY, OR OTHERWISE) SHALL FOLD, ITS MAINTAINERS,
              CONTRIBUTORS, OR AFFILIATES BE LIABLE TO YOU OR ANY THIRD PARTY
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY,
              OR PUNITIVE DAMAGES.
            </p>
            <p>
              THIS INCLUDES, WITHOUT LIMITATION, DAMAGES FOR LOSS OF PROFITS,
              LOSS OF GOODWILL, BUSINESS INTERRUPTION, LOSS OF DOCUMENTS OR
              DATA, SYSTEM CRASHES, OPERATING SYSTEM INCOMPATIBILITIES, COMPUTER
              FAILURE, OR ANY OTHER COMMERCIAL DAMAGES OR LOSSES ARISING OUT OF
              OR RELATING TO THE USE OR INABILITY TO USE THE SOFTWARE.
            </p>
            <p>
              IN JURISDICTIONS THAT DO NOT PERMIT THE EXCLUSION OR LIMITATION OF
              LIABILITY FOR CONSEQUENTIAL OR INCIDENTAL DAMAGES, OUR TOTAL
              AGGREGATE LIABILITY SHALL BE LIMITED TO THE AMOUNT PAID BY YOU TO
              USE FOLD DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE
              HUNDRED UNITED STATES DOLLARS ($100.00 USD), WHICHEVER IS LESS.
            </p>
          </section>

          {/* Section 9: Indemnification */}
          <section id="indemnification" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">09</span>
              <h2 className="legal-docs-section__title">
                Indemnification &amp; Defense
              </h2>
            </div>
            <p>
              You agree to defend, indemnify, and hold harmless Fold, its
              creators, contributors, developers, and licensors from and against
              any claims, liabilities, damages, losses, costs, and expenses
              (including reasonable legal and accounting fees) arising out of or
              in any way connected with:
            </p>
            <ol>
              <li>
                Your violation of these Terms or any applicable statutory law;
              </li>
              <li>
                Your infringement or misappropriation of any third-party
                intellectual property or privacy rights via documents processed
                with Fold; or
              </li>
              <li>
                Any fraudulent, unauthorized, or unlawful document alterations
                executed using the Software.
              </li>
            </ol>
          </section>

          {/* Section 10: Enterprise & Air-Gapped Deployments */}
          <section id="enterprise-airgapped" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">10</span>
              <h2 className="legal-docs-section__title">
                Enterprise, Self-Hosted &amp; Air-Gapped Deployments
              </h2>
            </div>
            <p>
              Organizations deploying Fold inside private Docker containers,
              corporate intranets, or air-gapped government environments are
              subject to the following additional conditions:
            </p>
            <ul>
              <li>
                <strong>Self-Hosted Administration:</strong> Administrators of
                self-hosted deployments bear sole responsibility for configuring
                network firewalls, access controls, container security, and
                compliance with institutional data handling policies.
              </li>
              <li>
                <strong>Independent Telemetry Configuration:</strong>{" "}
                Self-hosted deployments may completely disable all analytics or
                configure private telemetry sinks without voiding the software
                license.
              </li>
            </ul>
          </section>

          {/* Section 11: Export Controls */}
          <section id="export-controls" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">11</span>
              <h2 className="legal-docs-section__title">
                Export Controls &amp; Trade Compliance
              </h2>
            </div>
            <p>
              The Software includes standard cryptographic algorithms (AES-256)
              for document encryption and signature hashing. You represent that
              you are not located in, under the control of, or a national or
              resident of any country subject to comprehensive trade embargoes
              or sanctions under United States or European Union export
              regulations.
            </p>
          </section>

          {/* Section 12: Governing Law & Dispute Resolution */}
          <section id="governing-law" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">12</span>
              <h2 className="legal-docs-section__title">
                Governing Law, Dispute Resolution &amp; Arbitration
              </h2>
            </div>
            <p>
              These Terms shall be governed by, construed, and enforced in
              accordance with the laws of the State of Delaware, United States,
              without regard to its conflict of law principles. The United
              Nations Convention on Contracts for the International Sale of
              Goods shall not apply.
            </p>
            <p>
              Any dispute, controversy, or claim arising out of or relating to
              these Terms or the breach, termination, or invalidity thereof
              shall be settled by binding individual arbitration in accordance
              with the Commercial Arbitration Rules of the American Arbitration
              Association (AAA). You expressly waive any right to participate in
              a class action lawsuit or class-wide arbitration.
            </p>
          </section>

          {/* Section 13: Modifications & Contact */}
          <section id="modifications-contact" className="legal-docs-section">
            <div className="legal-docs-section__header">
              <span className="legal-docs-section__badge">13</span>
              <h2 className="legal-docs-section__title">
                Modifications, Severability &amp; Inquiries
              </h2>
            </div>
            <p>
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. When modifications are made, the
              &ldquo;Effective Date&rdquo; at the top of this document will be
              updated. Continued use of Fold after any such changes constitutes
              your acceptance of the new Terms.
            </p>
            <p>
              If any provision of these Terms is held to be invalid or
              unenforceable, that provision will be severed to the minimum
              extent necessary, and the remaining provisions will continue in
              full force and effect.
            </p>
            <p>
              For legal inquiries, licensing questions, or enterprise
              agreements, please reach out through our official open-source
              project repository channels.
            </p>
          </section>
        </main>

        {/* Right "On This Page" TOC Column */}
        <aside className="legal-docs-layout__toc-col">
          <div className="legal-docs-toc">
            <span className="legal-docs-toc__head">On this page</span>
            <ul className="legal-docs-toc__list">
              {TERMS_SECTIONS.map((item) => (
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
            <a
              className="legal-docs-footer__link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/privacy");
              }}
              href="/privacy"
            >
              Privacy
            </a>
            <span className="font-semibold text-stone-900">Terms</span>
          </div>

          <div className="legal-docs-footer__copy">
            <span>Your PDFs. Still yours. &copy; 2026 Fold.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
