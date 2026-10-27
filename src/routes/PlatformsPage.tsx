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
  architecture: string;
  formats: string;
  description: string;
  highlights: string[];
  specs: { label: string; value: string }[];
  ctaLabel: string;
  isAvailable: boolean;
}

const PLATFORMS: PlatformInfo[] = [
  {
    id: "web",
    name: "Web Browser & PWA",
    category: "Web",
    status: "available",
    statusLabel: "Available Now",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    architecture: "Universal WebAssembly (Wasm)",
    formats: "Web Application / Progressive Web App (PWA)",
    description:
      "The flagship Fold experience. Operates 100% in-browser across Chrome, Firefox, Safari, Edge, Brave, and Opera with zero server uploads and complete offline capability via Service Worker.",
    highlights: [
      "Zero installation required — runs immediately",
      "True local-first processing via WebAssembly",
      "Full offline air-gapped support",
      "Complete editing, OCR, vector inking & encryption suite",
    ],
    specs: [
      { label: "Execution Engine", value: "@cantoo/pdf-lib + pdfjs-dist Wasm" },
      { label: "Offline Storage", value: "IndexedDB + Origin Sandbox" },
      {
        label: "Supported Browsers",
        value: "Chrome, Safari, Firefox, Edge, Brave",
      },
      { label: "File Size Limit", value: "Governed by client RAM (up to 2GB)" },
    ],
    ctaLabel: "Launch Web App",
    isAvailable: true,
  },
  {
    id: "windows",
    name: "Windows Desktop",
    category: "Desktop",
    status: "unavailable",
    statusLabel: "Unavailable · In Development",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    architecture: "x86_64, ARM64 (Windows 10 / 11)",
    formats: "MSI Installer, Portable .exe, Winget",
    description:
      "Native Windows client powered by Tauri 2.0 and Rust. Integrates with Windows Explorer context menus, local file associations, and background directory processing.",
    highlights: [
      "Right-click 'Open with Fold' Explorer integration",
      "Native Direct2D GPU-accelerated canvas rendering",
      "Automated local watch-folder daemon",
      "System tray quick-access document utilities",
    ],
    specs: [
      { label: "Runtime", value: "Tauri 2.0 + Rust + Microsoft WebView2" },
      { label: "Target OS", value: "Windows 10, Windows 11 (64-bit / ARM64)" },
      { label: "Telemetry", value: "Zero telemetry / Air-Gapped Certified" },
      { label: "Status", value: "Alpha build in internal testing" },
    ],
    ctaLabel: "Unavailable",
    isAvailable: false,
  },
  {
    id: "macos",
    name: "macOS Desktop",
    category: "Desktop",
    status: "unavailable",
    statusLabel: "Unavailable · Coming Soon",
    badgeColor: "bg-stone-200 text-stone-700 border-stone-300",
    architecture: "Apple Silicon (Universal M1–M4) & Intel x64",
    formats: "Apple Notarized DMG, Homebrew Cask",
    description:
      "A tailored macOS native experience designed with Apple Human Interface Guidelines in mind. Features Finder QuickLook preview plugins and native menu bar shortcuts.",
    highlights: [
      "Finder QuickLook spacebar PDF preview extension",
      "Apple Silicon Metal API hardware rasterization",
      "Trackpad gestures: pinch-to-zoom & two-finger rotate",
      "Spotlight deep indexer for local document metadata",
    ],
    specs: [
      { label: "Runtime", value: "Tauri 2.0 + Rust + WebKit" },
      { label: "Target OS", value: "macOS 12.0 Monterey or newer" },
      { label: "Security", value: "Apple Notarized & Hardened Runtime" },
      { label: "Status", value: "Signing & packaging validation" },
    ],
    ctaLabel: "Unavailable",
    isAvailable: false,
  },
  {
    id: "linux",
    name: "Linux Desktop",
    category: "Desktop",
    status: "unavailable",
    statusLabel: "Unavailable · Under Construction",
    badgeColor: "bg-stone-200 text-stone-700 border-stone-300",
    architecture: "x86_64, aarch64",
    formats: "Flatpak (Flathub), AppImage, .deb, .rpm, Arch AUR",
    description:
      "A privacy-respecting native desktop application for Linux power users. Works on both Wayland and X11 with fractional scaling and CLI pipeline flags.",
    highlights: [
      "Wayland native display server support with fractional scaling",
      "Command-line interface: fold --merge file1.pdf file2.pdf",
      "Systemd user unit for automated folder batch processing",
      "Freedesktop dark mode portal integration",
    ],
    specs: [
      { label: "Runtime", value: "Rust 1.80+ / WebKitGTK 4.1" },
      { label: "Distros", value: "Ubuntu, Debian, Fedora, Arch, openSUSE" },
      { label: "CLI Mode", value: "Headless batch scriptable" },
      { label: "Status", value: "Packaging manifests in development" },
    ],
    ctaLabel: "Unavailable",
    isAvailable: false,
  },
  {
    id: "android",
    name: "Android Mobile",
    category: "Mobile",
    status: "unavailable",
    statusLabel: "Unavailable · In Architectural Design",
    badgeColor: "bg-stone-200 text-stone-700 border-stone-300",
    architecture: "ARM64-v8a, armeabi-v7a",
    formats: "Google Play Store, F-Droid, Standalone APK",
    description:
      "Mobile companion app featuring on-device camera document scanning, quad-point edge perspective correction, and peer-to-peer WebRTC sync with desktop Fold.",
    highlights: [
      "Real-time OpenCV camera document edge detection",
      "Automatic perspective de-skewing and shadow elimination",
      "Direct end-to-end encrypted WebRTC desktop pairing",
      "Zero cloud sync — local SQLite document vault",
    ],
    specs: [
      { label: "Target OS", value: "Android 11.0+ (API Level 30)" },
      { label: "Capture Engine", value: "CameraX API + OpenCV Wasm" },
      { label: "Sync Protocol", value: "Local P2P WebRTC DataChannel" },
      { label: "Status", value: "Core camera pipeline prototyping" },
    ],
    ctaLabel: "Unavailable",
    isAvailable: false,
  },
  {
    id: "ios",
    name: "iOS & iPadOS",
    category: "Mobile",
    status: "unavailable",
    statusLabel: "Unavailable · In Architectural Design",
    badgeColor: "bg-stone-200 text-stone-700 border-stone-300",
    architecture: "ARM64 (iPhone & iPad)",
    formats: "Apple App Store & TestFlight",
    description:
      "Engineered specifically for iPadOS and iOS with Apple Pencil vector inking, low-latency handwriting recognition, and seamless Apple Files integration.",
    highlights: [
      "Apple Pencil pressure & tilt vector handwriting",
      "iOS Files app DocumentProvider extension",
      "Local sandboxed document repository with Face ID lock",
      "AirDrop direct transfer to Fold desktop app",
    ],
    specs: [
      { label: "Target OS", value: "iOS 16.0+ / iPadOS 16.0+" },
      { label: "Inking Engine", value: "PencilKit + Bezier vector curves" },
      { label: "Storage", value: "Encrypted iOS App Sandbox" },
      { label: "Status", value: "Architectural specification phase" },
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
  const [notificationEmail, setNotificationEmail] = useState("");
  const [notificationSubmitted, setNotificationSubmitted] = useState(false);

  const filteredPlatforms =
    activeCategory === "All"
      ? PLATFORMS
      : PLATFORMS.filter((p) => p.category === activeCategory);

  const handleLaunchWeb = () => {
    navigate(EDITOR_BASENAME);
  };

  const handleNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notificationEmail.trim()) {
      setNotificationSubmitted(true);
    }
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
              Documentation
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
              <span>Launch Web App (Available Now)</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pt-8 pb-20 w-full">
        {/* Hero Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE7DF] border border-neutral-300 text-[11px] font-mono font-medium text-neutral-800 mb-4 animate-float">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span>Web App Available &bull; Native Shells in Development</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-neutral-900 mb-4">
            Get Fold for Your Operating System
          </h1>

          <p className="font-serif text-lg sm:text-xl text-neutral-600 italic leading-relaxed max-w-2xl mx-auto">
            Experience complete document privacy. The Web Application is ready
            to use right now on any device with zero install. Native desktop and
            mobile apps are currently in active development.
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
                  : "bg-white/60 border-neutral-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] opacity-95"
              }`}
            >
              <div>
                {/* Status Badge & Architecture */}
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
                <div className="mb-5 pt-3 border-t border-neutral-100">
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

                {/* Technical Specs */}
                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-neutral-200/80 text-[11px] space-y-1.5 mb-6">
                  {platform.specs.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-neutral-500 font-medium">
                        {s.label}:
                      </span>
                      <span className="text-neutral-800 font-mono text-right truncate">
                        {s.value}
                      </span>
                    </div>
                  ))}
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
                  <div className="flex flex-col gap-1.5">
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
                      <span>Unavailable for Download</span>
                    </button>
                    <span className="text-[10px] text-center text-neutral-400">
                      Target release in development
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Feature Comparison Matrix Table ──────────────────────────────── */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl font-semibold text-neutral-900 mb-2">
              Cross-Platform Feature Comparison
            </h2>
            <p className="text-sm text-neutral-600 max-w-xl mx-auto">
              How Fold&apos;s local-first architecture scales from instant
              in-browser execution to full native hardware acceleration.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F5F2EB] border-b border-neutral-200/80 text-neutral-700 font-semibold">
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Local Wasm Execution</th>
                  <th className="py-3 px-3">Zero Cloud Storage</th>
                  <th className="py-3 px-3">Offline Mode</th>
                  <th className="py-3 px-3">OS File Association</th>
                  <th className="py-3 px-3">Watch Folders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                <tr className="bg-emerald-50/40 font-medium">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
                    <span>Web Application (PWA)</span>
                  </td>
                  <td className="py-3 px-3 text-emerald-700 font-semibold font-mono">
                    AVAILABLE
                  </td>
                  <td className="py-3 px-3 text-emerald-800">
                    100% In-Browser
                  </td>
                  <td className="py-3 px-3 text-emerald-800">
                    Yes (0 bytes sent)
                  </td>
                  <td className="py-3 px-3 text-emerald-800">
                    Full (Service Worker)
                  </td>
                  <td className="py-3 px-3 text-neutral-400">File Picker</td>
                  <td className="py-3 px-3 text-neutral-400">
                    Web FileSystem API
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Windows Desktop</td>
                  <td className="py-3 px-3 text-amber-700 font-mono">
                    UNAVAILABLE
                  </td>
                  <td className="py-3 px-3">Native Rust + Wasm</td>
                  <td className="py-3 px-3">Yes (0 bytes sent)</td>
                  <td className="py-3 px-3">Full (Air-Gapped)</td>
                  <td className="py-3 px-3 text-emerald-700">
                    Explorer Right-Click
                  </td>
                  <td className="py-3 px-3 text-emerald-700">
                    Systemd / Service
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">macOS Desktop</td>
                  <td className="py-3 px-3 text-stone-500 font-mono">
                    UNAVAILABLE
                  </td>
                  <td className="py-3 px-3">Metal GPU + Wasm</td>
                  <td className="py-3 px-3">Yes (0 bytes sent)</td>
                  <td className="py-3 px-3">Full (Air-Gapped)</td>
                  <td className="py-3 px-3 text-emerald-700">
                    Finder QuickLook
                  </td>
                  <td className="py-3 px-3 text-emerald-700">Folder Actions</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Linux Desktop</td>
                  <td className="py-3 px-3 text-stone-500 font-mono">
                    UNAVAILABLE
                  </td>
                  <td className="py-3 px-3">Native Rust + Wasm</td>
                  <td className="py-3 px-3">Yes (0 bytes sent)</td>
                  <td className="py-3 px-3">Full (Air-Gapped)</td>
                  <td className="py-3 px-3 text-emerald-700">
                    MIME Type Handler
                  </td>
                  <td className="py-3 px-3 text-emerald-700">Inotify Daemon</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Android Mobile</td>
                  <td className="py-3 px-3 text-stone-500 font-mono">
                    UNAVAILABLE
                  </td>
                  <td className="py-3 px-3">Wasm + OpenCV</td>
                  <td className="py-3 px-3">Yes (0 bytes sent)</td>
                  <td className="py-3 px-3">Full (Local Vault)</td>
                  <td className="py-3 px-3 text-neutral-400">Android Intent</td>
                  <td className="py-3 px-3 text-neutral-400">
                    P2P WebRTC Camera
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">iOS &amp; iPadOS</td>
                  <td className="py-3 px-3 text-stone-500 font-mono">
                    UNAVAILABLE
                  </td>
                  <td className="py-3 px-3">WebKit + Metal</td>
                  <td className="py-3 px-3">Yes (0 bytes sent)</td>
                  <td className="py-3 px-3">Full (Local Sandbox)</td>
                  <td className="py-3 px-3 text-neutral-400">
                    Files App Provider
                  </td>
                  <td className="py-3 px-3 text-neutral-400">
                    PencilKit Vector
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Notification Signup Card ────────────────────────────────────── */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] max-w-2xl mx-auto text-center">
          <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto mb-3 text-lg">
            &bull;
          </div>
          <h3 className="font-serif text-2xl font-semibold text-neutral-900 mb-2">
            Get Notified When Native Apps Launch
          </h3>
          <p className="text-xs text-neutral-600 mb-6 max-w-md mx-auto">
            Native Windows, macOS, and Linux installers are progressing through
            packaging and code signing. Be the first to receive build updates.
          </p>

          {notificationSubmitted ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              Thank you! We will notify you as soon as the native packages
              become available.
            </div>
          ) : (
            <form
              onSubmit={handleNotificationSubmit}
              className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full sm:flex-1 px-4 py-2.5 rounded-full border border-neutral-300 text-xs bg-[#FAF9F6] focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow cursor-pointer active-press"
              >
                Notify Me
              </button>
            </form>
          )}
        </section>
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
