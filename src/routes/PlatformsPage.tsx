import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EDITOR_BASENAME } from "@app/routes/editorBasename";
import "@app/styles/landing.css";

interface PlatformInfo {
  id: string;
  name: string;
  category: "Web" | "Desktop" | "Mobile";
  status: "available" | "unavailable";
  statusLabel: string;
  badgeColor: string;
  description: string;
  highlights: string[];
  ctaLabel: string;
  isAvailable: boolean;
}

const PLATFORMS: PlatformInfo[] = [
  {
    id: "web",
    name: "Web Browser & PWA",
    category: "Web",
    status: "available",
    statusLabel: "Available",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description:
      "The flagship Fold experience. Operates 100% in-browser across Chrome, Firefox, Safari, Edge, Brave, and Opera with zero server uploads and complete offline capability.",
    highlights: [
      "Zero installation required — runs immediately",
      "True local-first processing via WebAssembly",
      "Full offline air-gapped capability via Service Worker",
      "Complete editing, OCR, vector inking, and encryption suite",
    ],
    ctaLabel: "Launch Web App",
    isAvailable: true,
  },
  {
    id: "windows",
    name: "Windows Desktop",
    category: "Desktop",
    status: "unavailable",
    statusLabel: "Unavailable",
    badgeColor: "bg-neutral-100 text-neutral-600 border-neutral-200",
    description:
      "Native Windows client for Windows 10 and 11 with Explorer right-click integration and local file processing.",
    highlights: [
      "Right-click 'Open with Fold' Explorer integration",
      "Hardware-accelerated local canvas rendering",
      "Automated local watch-folder processing",
      "System tray quick-access document utilities",
    ],
    ctaLabel: "Unavailable",
    isAvailable: false,
  },
  {
    id: "macos",
    name: "macOS Desktop",
    category: "Desktop",
    status: "unavailable",
    statusLabel: "Unavailable",
    badgeColor: "bg-neutral-100 text-neutral-600 border-neutral-200",
    description:
      "Tailored native client for macOS and Apple Silicon with Finder QuickLook previews and native gesture shortcuts.",
    highlights: [
      "Finder QuickLook spacebar PDF preview extension",
      "Optimized for Apple Silicon hardware acceleration",
      "Trackpad gestures: pinch-to-zoom and two-finger rotate",
      "Integrated macOS menu bar shortcuts",
    ],
    ctaLabel: "Unavailable",
    isAvailable: false,
  },
  {
    id: "linux",
    name: "Linux Desktop",
    category: "Desktop",
    status: "unavailable",
    statusLabel: "Unavailable",
    badgeColor: "bg-neutral-100 text-neutral-600 border-neutral-200",
    description:
      "Privacy-respecting native desktop application for Linux distributions with CLI support and Wayland display scaling.",
    highlights: [
      "Wayland and X11 native display server support",
      "Command-line batch document processing interface",
      "Complete local offline processing with zero telemetry",
      "Freedesktop system dark mode integration",
    ],
    ctaLabel: "Unavailable",
    isAvailable: false,
  },
  {
    id: "android",
    name: "Android Mobile",
    category: "Mobile",
    status: "unavailable",
    statusLabel: "Unavailable",
    badgeColor: "bg-neutral-100 text-neutral-600 border-neutral-200",
    description:
      "Mobile companion app featuring on-device camera document scanning and local PDF manipulation.",
    highlights: [
      "Real-time camera document edge detection",
      "Automatic perspective de-skewing and shadow elimination",
      "Local document vault with zero cloud uploads",
      "Quick document viewing and annotation on the go",
    ],
    ctaLabel: "Unavailable",
    isAvailable: false,
  },
  {
    id: "ios",
    name: "iOS & iPadOS",
    category: "Mobile",
    status: "unavailable",
    statusLabel: "Unavailable",
    badgeColor: "bg-neutral-100 text-neutral-600 border-neutral-200",
    description:
      "Tailored companion app for iPhone and iPad with camera document capture and Apple Pencil vector signing.",
    highlights: [
      "Camera document capture with auto edge-detection",
      "Apple Pencil precision vector inking and signatures",
      "Native Files app document provider integration",
      "Private and air-gapped on-device execution",
    ],
    ctaLabel: "Unavailable",
    isAvailable: false,
  },
];

export default function PlatformsPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<
    "All" | "Web" | "Desktop" | "Mobile"
  >("All");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredPlatforms =
    activeCategory === "All"
      ? PLATFORMS
      : PLATFORMS.filter((p) => p.category === activeCategory);

  const handleLaunchWeb = () => {
    navigate(EDITOR_BASENAME);
  };

  return (
    <div className="landing-container platforms-page w-full h-full overflow-y-auto overflow-x-hidden bg-[#FAF9F6] text-[#1E1E1E] antialiased selection:bg-amber-200 flex flex-col">
      {/* ── Header Navigation (Identical to Home Page) ────────────────────── */}
      <header
        className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-50"
        data-purpose="site-header"
      >
        {/* Brand Logo */}
        <a
          aria-label="Fold Home"
          className="flex items-center gap-2 group cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
          href="/"
        >
          <svg
            className="w-6 h-6 text-black fill-current transform group-hover:rotate-6 transition-transform"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18.2 8 12 11.8 5.8 8 12 4.2zM5.5 9.5l5.5 3.4v7.2L5.5 16.5V9.5zm7.5 10.6v-7.2l5.5-3.4v7l-5.5 3.6z" />
          </svg>
          <span className="font-serif text-2xl font-medium tracking-tight text-neutral-900">
            fold
          </span>
        </a>

        {/* Desktop Pill Nav Links */}
        <nav className="hidden md:flex items-center gap-6 px-6 py-2 rounded-full bg-[#F0EDE6]/80 border border-neutral-200/60 text-xs font-medium text-neutral-600">
          <a
            className="hover:text-black transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
            href="/"
          >
            Home
          </a>
          <a
            className="hover:text-black transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              navigate("/editor");
            }}
            href="/editor"
          >
            Tools
          </a>
          <span className="text-black font-semibold">Platforms</span>
          <a
            className="hover:text-black transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              navigate("/docs");
            }}
            href="/docs"
          >
            Docs
          </a>
          <a
            className="hover:text-black transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              navigate("/privacy");
            }}
            href="/privacy"
          >
            Privacy
          </a>
          <a
            className="hover:text-black transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              navigate("/terms");
            }}
            href="/terms"
          >
            Terms
          </a>
        </nav>

        {/* Top Right Actions: Web App CTA & Mobile Hamburger */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLaunchWeb}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-medium tracking-tight hover:bg-neutral-800 transition-all shadow-sm hover:shadow cursor-pointer active-press"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span>Launch Web App</span>
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="md:hidden flex flex-col items-center justify-center w-9 h-9 rounded-full bg-[#F0EDE6] border border-neutral-200/80 p-2 cursor-pointer transition-colors hover:bg-neutral-200"
          >
            <span
              className={`w-4 h-0.5 bg-neutral-900 rounded transition-all duration-200 ${
                mobileMenuOpen ? "transform rotate-45 translate-y-1.5" : "mb-1"
              }`}
            />
            <span
              className={`w-4 h-0.5 bg-neutral-900 rounded transition-all duration-200 ${
                mobileMenuOpen ? "opacity-0" : "mb-1"
              }`}
            />
            <span
              className={`w-4 h-0.5 bg-neutral-900 rounded transition-all duration-200 ${
                mobileMenuOpen ? "transform -rotate-45 -translate-y-1.5" : ""
              }`}
            />
          </button>
        </div>
      </header>

      {/* ── Mobile Navigation Drawer ──────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full bg-[#F5F2EB] border-b border-neutral-200/80 px-6 py-4 animate-menu-open shadow-md">
          <div className="flex flex-col gap-3 text-sm font-medium text-neutral-700">
            <a
              className="py-1 hover:text-black cursor-pointer"
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
              className="py-1 hover:text-black cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                navigate("/editor");
                setMobileMenuOpen(false);
              }}
              href="/editor"
            >
              Tools &amp; Editor
            </a>
            <span className="py-1 text-black font-semibold">Platforms</span>
            <a
              className="py-1 hover:text-black cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                navigate("/docs");
                setMobileMenuOpen(false);
              }}
              href="/docs"
            >
              Docs
            </a>
            <a
              className="py-1 hover:text-black cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                navigate("/privacy");
                setMobileMenuOpen(false);
              }}
              href="/privacy"
            >
              Privacy Policy
            </a>
            <a
              className="py-1 hover:text-black cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                navigate("/terms");
                setMobileMenuOpen(false);
              }}
              href="/terms"
            >
              Terms of Service
            </a>
            <button
              onClick={() => {
                handleLaunchWeb();
                setMobileMenuOpen(false);
              }}
              className="mt-2 w-full py-2.5 rounded-full bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span>Launch Web App</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pt-8 pb-20 w-full">
        {/* Hero Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-neutral-900 mb-4">
            Get Fold for Your Operating System
          </h1>

          <p className="font-serif text-lg sm:text-xl text-neutral-600 italic leading-relaxed max-w-2xl mx-auto">
            Experience complete document privacy. Access Fold right in your browser on any device with zero install.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {(["All", "Web", "Desktop", "Mobile"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-[#1E1E1E] text-white shadow-sm"
                    : "bg-[#F0EDE6] text-neutral-600 hover:text-black hover:bg-neutral-200"
                }`}
              >
                {cat} Platforms
              </button>
            ))}
          </div>
        </div>

        {/* Operating Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredPlatforms.map((platform) => (
            <div
              key={platform.id}
              className={`rounded-2xl p-6 sm:p-7 border flex flex-col justify-between transition-all duration-200 ${
                platform.isAvailable
                  ? "bg-white border-neutral-300 shadow-[0_4px_20px_rgba(0,0,0,0.04)] ring-2 ring-emerald-500/20"
                  : "bg-white/70 border-neutral-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
              }`}
            >
              <div>
                {/* Status Badge & Category */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${platform.badgeColor}`}
                  >
                    {platform.isAvailable && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse-dot" />
                    )}
                    {platform.statusLabel}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    {platform.category}
                  </span>
                </div>

                {/* Platform Name */}
                <h2 className="font-serif text-2xl font-semibold text-neutral-900 mb-2">
                  {platform.name}
                </h2>

                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  {platform.description}
                </p>

                {/* Highlights */}
                <div className="mb-6 pt-3 border-t border-neutral-100">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block mb-2">
                    Key Capabilities
                  </span>
                  <ul className="space-y-1.5">
                    {platform.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="text-xs text-neutral-700 flex items-start gap-1.5"
                      >
                        <span className="text-neutral-400 font-bold">
                          &bull;
                        </span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {platform.isAvailable ? (
                  <button
                    onClick={handleLaunchWeb}
                    className="w-full py-3 rounded-xl bg-[#1E1E1E] hover:bg-black text-white text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 cursor-pointer shadow hover:shadow-md active-press"
                  >
                    <span>Launch Web App</span>
                    <svg
                      className="w-4 h-4 text-neutral-300"
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
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-400 text-xs font-medium cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    <span>Unavailable</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Site Footer (Identical to Home Page) ──────────────────────────── */}
      <footer
        className="max-w-6xl mx-auto px-6 py-10 mt-auto border-t border-neutral-200/60 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-neutral-500 w-full"
        data-purpose="site-footer"
      >
        <a
          aria-label="Fold Home"
          className="flex items-center gap-2 text-neutral-900 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
          href="/"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18.2 8 12 11.8 5.8 8 12 4.2zM5.5 9.5l5.5 3.4v7.2L5.5 16.5V9.5zm7.5 10.6v-7.2l5.5-3.4v7l-5.5 3.6z" />
          </svg>
          <span className="font-serif text-xl font-medium tracking-tight">
            fold
          </span>
        </a>

        <div className="flex items-center gap-6 text-neutral-600">
          <a
            className="hover:text-black transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              navigate(EDITOR_BASENAME);
            }}
            href={EDITOR_BASENAME}
          >
            Tools
          </a>
          <span className="text-black font-semibold">Platforms</span>
          <a
            className="hover:text-black transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              navigate("/privacy");
            }}
            href="/privacy"
          >
            Privacy
          </a>
          <a
            className="hover:text-black transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              navigate("/terms");
            }}
            href="/terms"
          >
            Terms
          </a>
        </div>

        <div className="flex items-center gap-1.5 text-neutral-500">
          <span>Your PDFs. Still yours.</span>
        </div>
      </footer>
    </div>
  );
}
