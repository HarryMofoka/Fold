import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EDITOR_BASENAME } from "@app/routes/editorBasename";
import "@app/styles/landing.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string,
  ) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleOpenFold = () => {
    navigate("/open");
  };

  const handleOpenEditor = () => {
    navigate(EDITOR_BASENAME);
  };

  const handleOpenTool = (path: string) => {
    navigate(path);
  };

  return (
    <div className="landing-container w-full h-full overflow-y-auto bg-[#FAF9F6] text-[#1E1E1E] antialiased selection:bg-amber-200">
      {/* Site Navigation */}
      <header
        className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6 flex items-center justify-between relative z-50"
        data-purpose="site-header"
      >
        {/* Brand Logo */}
        <a
          aria-label="Fold Home"
          className="flex items-center gap-2 group cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          href="#"
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

        {/* Pill Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 px-6 py-2 rounded-full bg-[#F0EDE6]/80 border border-neutral-200/60 text-xs font-medium text-neutral-600 backdrop-blur-sm shadow-xs">
          <a
            className="hover:text-black transition-colors cursor-pointer"
            href="/open"
            onClick={(e) => {
              e.preventDefault();
              navigate("/open");
            }}
          >
            Platforms
          </a>
          <a
            className="hover:text-black transition-colors cursor-pointer"
            href="/docs"
            onClick={(e) => {
              e.preventDefault();
              navigate("/docs");
            }}
          >
            Docs
          </a>
          <a
            className="hover:text-black transition-colors cursor-pointer"
            href="/privacy"
            onClick={(e) => {
              e.preventDefault();
              navigate("/privacy");
            }}
          >
            Privacy
          </a>
          <a
            className="hover:text-black transition-colors cursor-pointer"
            href="/terms"
            onClick={(e) => {
              e.preventDefault();
              navigate("/terms");
            }}
          >
            Terms
          </a>
        </nav>

        {/* Top Right Action & Mobile Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenFold}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-medium tracking-tight hover:bg-neutral-800 transition-all shadow-sm hover:shadow cursor-pointer border-0 active-press"
          >
            <span>Open Fold</span>
            <svg
              className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M9 5l7 7-7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="md:hidden flex flex-col items-center justify-center w-9 h-9 rounded-full bg-[#F0EDE6] border border-neutral-200/80 p-2 cursor-pointer transition-colors hover:bg-neutral-200 active-press"
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

      {/* ── Mobile Full-Screen Liquid Glass Navigation ────────────────────────── */}
      {mobileMenuOpen && (
        <div className="liquid-glass-overlay md:hidden">
          {/* Top Bar inside Overlay */}
          <div className="w-full flex items-center justify-between pb-4 border-b border-white/60">
            <div className="flex items-center gap-2.5">
              <svg
                className="w-6 h-6 text-black fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18.2 8 12 11.8 5.8 8 12 4.2zM5.5 9.5l5.5 3.4v7.2L5.5 16.5V9.5zm7.5 10.6v-7.2l5.5-3.4v7l-5.5 3.6z" />
              </svg>
              <span className="font-serif text-2xl font-medium tracking-tight text-neutral-900">
                fold
              </span>
              <span className="text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium font-mono">
                Web App
              </span>
            </div>

            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/70 border border-white/90 text-neutral-800 shadow-xs cursor-pointer active-press hover:bg-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Links in Liquid Glass Cards */}
          <div className="flex-1 flex flex-col justify-center py-6 gap-3">
            <div className="liquid-glass-item bg-white/80 border-white font-semibold">
              <span className="flex items-center gap-3">
                <span className="text-xs font-mono text-neutral-500">01</span>
                <span className="text-black">Home</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-900 text-white font-medium">
                Active
              </span>
            </div>

            <a
              className="liquid-glass-item"
              onClick={(e) => {
                e.preventDefault();
                navigate("/open");
                setMobileMenuOpen(false);
              }}
              href="/open"
            >
              <span className="flex items-center gap-3">
                <span className="text-xs font-mono text-neutral-400">02</span>
                <span>Platforms &amp; OS</span>
              </span>
              <svg
                className="w-4 h-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>

            <a
              className="liquid-glass-item"
              onClick={(e) => {
                e.preventDefault();
                navigate("/docs");
                setMobileMenuOpen(false);
              }}
              href="/docs"
            >
              <span className="flex items-center gap-3">
                <span className="text-xs font-mono text-neutral-400">03</span>
                <span>Documentation</span>
              </span>
              <svg
                className="w-4 h-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>

            <a
              className="liquid-glass-item"
              onClick={(e) => {
                e.preventDefault();
                navigate("/privacy");
                setMobileMenuOpen(false);
              }}
              href="/privacy"
            >
              <span className="flex items-center gap-3">
                <span className="text-xs font-mono text-neutral-400">04</span>
                <span>Privacy Architecture</span>
              </span>
              <svg
                className="w-4 h-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>

            <a
              className="liquid-glass-item"
              onClick={(e) => {
                e.preventDefault();
                navigate("/terms");
                setMobileMenuOpen(false);
              }}
              href="/terms"
            >
              <span className="flex items-center gap-3">
                <span className="text-xs font-mono text-neutral-400">05</span>
                <span>Terms of Service</span>
              </span>
              <svg
                className="w-4 h-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>

          {/* Bottom Action: Launch / Open Fold */}
          <div className="w-full pt-4 border-t border-white/50 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleOpenFold();
              }}
              className="w-full py-4 rounded-2xl bg-neutral-900 text-white font-medium text-sm flex items-center justify-center gap-2.5 shadow-lg active-press cursor-pointer hover:bg-black transition-colors"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span>Open Fold (Select Platform)</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
            <p className="text-center text-[11px] text-neutral-500 font-mono">
              100% In-Browser · Zero Telemetry · Offline Ready
            </p>
          </div>
        </div>
      )}

      <main>
        {/* Hero Section */}
        <section
          className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-16 sm:pb-20 text-center relative"
          data-purpose="hero"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/60 text-[11px] text-neutral-600 mb-6 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span>
              Local &amp; Private · Runs completely inside your browser
            </span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-normal text-neutral-950 tracking-tight leading-[1.08] mb-4">
            Your PDFs.
            <br />
            Still yours.
          </h1>
          <p className="text-sm md:text-base text-neutral-600 max-w-md mx-auto mb-8 font-normal leading-relaxed px-4">
            A simple PDF toolkit that runs on your device.
            <br className="hidden sm:inline" /> No uploads. No accounts.
          </p>

          {/* Primary CTA Button */}
          <div className="flex justify-center mb-16">
            <button
              onClick={handleOpenFold}
              className="inline-flex items-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-medium px-6 py-3 rounded-full transition-all shadow-md hover:shadow-lg cursor-pointer border-0 active-press group"
            >
              <svg
                className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span>Open Fold</span>
            </button>
          </div>

          {/* Classical Filing Chest & Floating Document Badges Illustration */}
          <div
            className="relative w-full max-w-xl mx-auto h-[380px] flex justify-center items-end"
            data-purpose="hero-illustration"
          >
            {/* Floating Badge: PDF */}
            <div
              onClick={handleOpenFold}
              className="absolute -top-4 left-3 sm:left-24 bg-white/95 backdrop-blur border border-neutral-200/80 rounded-2xl p-3 shadow-md flex flex-col items-center justify-center w-16 h-16 transform -rotate-6 hover:scale-105 transition-all cursor-pointer animate-float active-press"
            >
              <svg
                className="w-6 h-6 text-neutral-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[9px] font-semibold text-neutral-800 mt-0.5">
                PDF
              </span>
            </div>

            {/* Floating Badge: Merge */}
            <div
              onClick={() => handleOpenTool("/merge")}
              style={{ animationDelay: "1s" }}
              className="absolute bottom-24 left-1 sm:left-14 bg-white/95 backdrop-blur border border-neutral-200/80 rounded-2xl p-3 shadow-md flex flex-col items-center justify-center w-16 h-16 transform rotate-6 hover:scale-105 transition-all cursor-pointer animate-float active-press"
            >
              <svg
                className="w-6 h-6 text-neutral-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[9px] font-semibold text-neutral-800 mt-0.5">
                Merge
              </span>
            </div>

            {/* Floating Badge: Split */}
            <div
              onClick={() => handleOpenTool("/split")}
              style={{ animationDelay: "2s" }}
              className="absolute -top-1 right-3 sm:right-24 bg-white/95 backdrop-blur border border-neutral-200/80 rounded-2xl p-3 shadow-md flex flex-col items-center justify-center w-16 h-16 transform rotate-6 hover:scale-105 transition-all cursor-pointer animate-float active-press"
            >
              <svg
                className="w-6 h-6 text-neutral-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[9px] font-semibold text-neutral-800 mt-0.5">
                [ ]
              </span>
              <span className="text-[8px] font-semibold text-neutral-800 -mt-1">
                Split
              </span>
            </div>

            {/* Floating Badge: Compress */}
            <div
              onClick={() => handleOpenTool("/compress")}
              style={{ animationDelay: "3s" }}
              className="absolute bottom-24 right-1 sm:right-14 bg-white/95 backdrop-blur border border-neutral-200/80 rounded-2xl p-3 shadow-md flex flex-col items-center justify-center w-16 h-16 transform -rotate-3 hover:scale-105 transition-all cursor-pointer animate-float active-press"
            >
              <svg
                className="w-6 h-6 text-neutral-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[9px] font-semibold text-neutral-800 mt-0.5">
                Compress
              </span>
            </div>

            {/* Central Document Collage Graphic */}
            <div className="relative w-80 h-full flex flex-col items-center justify-end">
              {/* Stack of Document Sheets emerging upwards */}
              <div className="relative w-72 h-56 -mb-6 flex justify-center items-end z-0">
                {/* Left sheet */}
                <div className="absolute left-4 bottom-2 w-36 h-48 bg-white border border-neutral-300 rounded shadow-md transform -rotate-12 p-3 overflow-hidden">
                  <div className="w-12 h-2.5 bg-neutral-300 rounded mb-2" />
                  <div className="w-full h-1.5 bg-neutral-200 rounded mb-1" />
                  <div className="w-5/6 h-1.5 bg-neutral-200 rounded mb-1" />
                  <div className="w-4/6 h-1.5 bg-neutral-200 rounded mb-3" />
                  <div className="w-full h-20 bg-neutral-100 border border-neutral-200 rounded" />
                </div>

                {/* Right sheet with landscape print */}
                <div className="absolute right-4 bottom-2 w-36 h-48 bg-white border border-neutral-300 rounded shadow-md transform rotate-12 p-3 overflow-hidden">
                  <div className="w-full h-20 bg-neutral-200/80 rounded mb-2 overflow-hidden relative">
                    <svg
                      className="w-full h-full text-neutral-400"
                      preserveAspectRatio="none"
                      viewBox="0 0 100 50"
                    >
                      <path
                        d="M0 50 L30 15 L50 35 L75 10 L100 50 Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-200 rounded mb-1" />
                  <div className="w-3/4 h-1.5 bg-neutral-200 rounded mb-1" />
                  <div className="w-5/6 h-1.5 bg-neutral-200 rounded" />
                </div>

                {/* Center prominent PDF Document with Folded Yellow Corner */}
                <div
                  onClick={handleOpenEditor}
                  className="relative z-10 w-44 h-52 bg-white border border-neutral-300/80 rounded shadow-xl p-4 flex flex-col cursor-pointer transition-transform hover:-translate-y-1"
                >
                  {/* Folded yellow dog-ear corner */}
                  <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden pointer-events-none">
                    <div className="w-0 h-0 border-t-[32px] border-t-amber-300 border-l-[32px] border-l-transparent shadow-sm" />
                  </div>
                  <div className="font-serif font-bold text-xl tracking-tight text-neutral-800 mb-2">
                    PDF
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full h-1.5 bg-neutral-200 rounded" />
                    <div className="w-11/12 h-1.5 bg-neutral-200 rounded" />
                    <div className="w-full h-1.5 bg-neutral-200 rounded" />
                    <div className="w-4/5 h-1.5 bg-neutral-200 rounded" />
                    <div className="w-9/12 h-1.5 bg-neutral-200 rounded" />
                    <div className="w-10/12 h-1.5 bg-neutral-200 rounded" />
                  </div>
                </div>
              </div>

              {/* Classical Filing Chest Box Graphic */}
              <div className="relative z-10 w-52 h-44 overflow-hidden flex justify-center">
                <svg
                  className="w-full h-full text-neutral-800"
                  fill="none"
                  viewBox="0 0 208 176"
                >
                  <defs>
                    <linearGradient
                      id="drawerFront"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#282828" />
                      <stop offset="100%" stopColor="#151515" />
                    </linearGradient>
                    <linearGradient
                      id="drawerTopRim"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#3a3a3a" />
                      <stop offset="50%" stopColor="#4f4f4f" />
                      <stop offset="100%" stopColor="#323232" />
                    </linearGradient>
                    <linearGradient
                      id="handleMetallic"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#a3a3a3" />
                      <stop offset="50%" stopColor="#f5f5f5" />
                      <stop offset="100%" stopColor="#737373" />
                    </linearGradient>
                    <radialGradient id="innerShadow" cx="50%" cy="10%" r="60%">
                      <stop
                        offset="0%"
                        stopColor="#080808"
                        stopOpacity="0.95"
                      />
                      <stop
                        offset="100%"
                        stopColor="#181818"
                        stopOpacity="0.4"
                      />
                    </radialGradient>
                    <filter
                      id="softGlow"
                      x="-10%"
                      y="-10%"
                      width="120%"
                      height="125%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="6"
                        stdDeviation="6"
                        floodColor="#000000"
                        floodOpacity="0.35"
                      />
                    </filter>
                  </defs>

                  {/* Base drop shadow ellipse */}
                  <ellipse
                    cx="104"
                    cy="168"
                    rx="78"
                    ry="7"
                    fill="#000000"
                    opacity="0.15"
                  />

                  {/* Drawer Interior Cavity */}
                  <path
                    d="M24 22 L184 22 L172 48 L36 48 Z"
                    fill="url(#innerShadow)"
                  />

                  {/* Interior divider tab */}
                  <line
                    x1="42"
                    y1="35"
                    x2="166"
                    y2="35"
                    stroke="#333333"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.7"
                  />

                  {/* Drawer Outer Body Box */}
                  <g filter="url(#softGlow)">
                    {/* Top rim opening bevel */}
                    <polygon
                      points="18,20 190,20 182,30 26,30"
                      fill="url(#drawerTopRim)"
                    />

                    {/* Front face of filing tray / docket chest */}
                    <path
                      d="M20 28 L188 28 C191 28 193 30 192.5 33 L178 152 C177.5 156 174 159 170 159 L38 159 C34 159 30.5 156 30 152 L15.5 33 C15 30 17 28 20 28 Z"
                      fill="url(#drawerFront)"
                      stroke="#383838"
                      strokeWidth="1"
                    />
                  </g>

                  {/* Architectural / docket seam line */}
                  <path
                    d="M25 40 L183 40"
                    stroke="#383838"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                  <path
                    d="M31 144 L177 144"
                    stroke="#1c1c1c"
                    strokeWidth="1"
                    opacity="0.8"
                  />

                  {/* Minimalist Label Holder Plate */}
                  <rect
                    x="82"
                    y="58"
                    width="44"
                    height="18"
                    rx="2.5"
                    fill="#1e1e1e"
                    stroke="#3d3d3d"
                    strokeWidth="1"
                  />
                  <rect
                    x="86"
                    y="62"
                    width="36"
                    height="10"
                    rx="1.5"
                    fill="#F4F2ED"
                    opacity="0.9"
                  />
                  <line
                    x1="91"
                    y1="67"
                    x2="117"
                    y2="67"
                    stroke="#737373"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />

                  {/* Metallic Drawer Handle */}
                  <rect
                    x="74"
                    y="94"
                    width="60"
                    height="14"
                    rx="7"
                    fill="#0d0d0d"
                    opacity="0.9"
                  />
                  <rect
                    x="72"
                    y="91"
                    width="64"
                    height="10"
                    rx="5"
                    fill="url(#handleMetallic)"
                    stroke="#525252"
                    strokeWidth="0.75"
                  />
                  <rect
                    x="75"
                    y="93"
                    width="58"
                    height="2"
                    rx="1"
                    fill="#ffffff"
                    opacity="0.6"
                  />
                  <circle cx="77" cy="96" r="1.5" fill="#404040" />
                  <circle cx="131" cy="96" r="1.5" fill="#404040" />

                  {/* Corner accents */}
                  <circle cx="36" cy="44" r="1" fill="#4a4a4a" />
                  <circle cx="172" cy="44" r="1" fill="#4a4a4a" />
                  <circle cx="42" cy="148" r="1" fill="#4a4a4a" />
                  <circle cx="166" cy="148" r="1" fill="#4a4a4a" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Tools Grid Section */}
        <section
          className="max-w-5xl mx-auto px-6 py-20 border-t border-neutral-200/60"
          data-purpose="tools-section"
          id="tools"
        >
          {/* Section Header */}
          <div className="mb-12">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 block mb-2">
              Tools
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-normal text-neutral-950 tracking-tight leading-tight mb-3">
              Everything you need.
              <br />
              In one place.
            </h2>
            <p className="text-xs md:text-sm text-neutral-600 max-w-md font-normal leading-relaxed">
              Edit, merge, split and more. All the essential PDF tools, built
              for simplicity and speed.
            </p>
          </div>

          {/* 4x2 Tools Grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
            data-purpose="feature-cards-grid"
          >
            {/* 1. Edit PDF */}
            <div
              onClick={() => handleOpenTool("/pdf-text-editor")}
              className="bg-[#F6F4EE]/90 hover:bg-[#F2EFE7] border border-[#E9E6DF] rounded-2xl p-5 flex flex-col justify-between h-44 shadow-soft shadow-card-hover group cursor-pointer"
            >
              <div>
                <div className="w-8 h-8 flex items-center justify-center text-neutral-800 mb-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Edit PDF
                </h3>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Update text, images and pages with ease.
                </p>
              </div>
              <div className="flex justify-end">
                <span className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all text-sm font-medium">
                  →
                </span>
              </div>
            </div>

            {/* 2. Merge */}
            <div
              onClick={() => handleOpenTool("/merge")}
              className="bg-[#F6F4EE]/90 hover:bg-[#F2EFE7] border border-[#E9E6DF] rounded-2xl p-5 flex flex-col justify-between h-44 shadow-soft shadow-card-hover group cursor-pointer"
            >
              <div>
                <div className="w-8 h-8 flex items-center justify-center text-neutral-800 mb-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <rect
                      height="10"
                      rx="2"
                      strokeLinecap="round"
                      width="10"
                      x="4"
                      y="4"
                    />
                    <rect
                      height="10"
                      rx="2"
                      strokeLinecap="round"
                      width="10"
                      x="10"
                      y="10"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Merge
                </h3>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Combine multiple PDFs into one.
                </p>
              </div>
              <div className="flex justify-end">
                <span className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all text-sm font-medium">
                  →
                </span>
              </div>
            </div>

            {/* 3. Split */}
            <div
              onClick={() => handleOpenTool("/split")}
              className="bg-[#F6F4EE]/90 hover:bg-[#F2EFE7] border border-[#E9E6DF] rounded-2xl p-5 flex flex-col justify-between h-44 shadow-soft shadow-card-hover group cursor-pointer"
            >
              <div>
                <div className="w-8 h-8 flex items-center justify-center text-neutral-800 mb-3 font-mono font-bold text-sm tracking-tighter">
                  [ ]
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Split
                </h3>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Extract the pages you need.
                </p>
              </div>
              <div className="flex justify-end">
                <span className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all text-sm font-medium">
                  →
                </span>
              </div>
            </div>

            {/* 4. Compress */}
            <div
              onClick={() => handleOpenTool("/compress")}
              className="bg-[#F6F4EE]/90 hover:bg-[#F2EFE7] border border-[#E9E6DF] rounded-2xl p-5 flex flex-col justify-between h-44 shadow-soft shadow-card-hover group cursor-pointer"
            >
              <div>
                <div className="w-8 h-8 flex items-center justify-center text-neutral-800 mb-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Compress
                </h3>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Reduce file size without losing quality.
                </p>
              </div>
              <div className="flex justify-end">
                <span className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all text-sm font-medium">
                  →
                </span>
              </div>
            </div>

            {/* 5. Convert */}
            <div
              onClick={() => handleOpenTool("/convert")}
              className="bg-[#F6F4EE]/90 hover:bg-[#F2EFE7] border border-[#E9E6DF] rounded-2xl p-5 flex flex-col justify-between h-44 shadow-soft shadow-card-hover group cursor-pointer"
            >
              <div>
                <div className="w-8 h-8 flex items-center justify-center text-neutral-800 mb-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Convert
                </h3>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  PDF to Word, Excel, Images and more.
                </p>
              </div>
              <div className="flex justify-end">
                <span className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all text-sm font-medium">
                  →
                </span>
              </div>
            </div>

            {/* 6. Rotate */}
            <div
              onClick={() => handleOpenTool("/rotate")}
              className="bg-[#F6F4EE]/90 hover:bg-[#F2EFE7] border border-[#E9E6DF] rounded-2xl p-5 flex flex-col justify-between h-44 shadow-soft shadow-card-hover group cursor-pointer"
            >
              <div>
                <div className="w-8 h-8 flex items-center justify-center text-neutral-800 mb-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Rotate
                </h3>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Change page orientation in seconds.
                </p>
              </div>
              <div className="flex justify-end">
                <span className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all text-sm font-medium">
                  →
                </span>
              </div>
            </div>

            {/* 7. Organise pages */}
            <div
              onClick={() => handleOpenTool("/reorganize-pages")}
              className="bg-[#F6F4EE]/90 hover:bg-[#F2EFE7] border border-[#E9E6DF] rounded-2xl p-5 flex flex-col justify-between h-44 shadow-soft shadow-card-hover group cursor-pointer"
            >
              <div>
                <div className="w-8 h-8 flex items-center justify-center text-neutral-800 mb-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Organise pages
                </h3>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Reorder, delete or rotate pages.
                </p>
              </div>
              <div className="flex justify-end">
                <span className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all text-sm font-medium">
                  →
                </span>
              </div>
            </div>

            {/* 8. Sign */}
            <div
              onClick={() => handleOpenTool("/sign")}
              className="bg-[#F6F4EE]/90 hover:bg-[#F2EFE7] border border-[#E9E6DF] rounded-2xl p-5 flex flex-col justify-between h-44 shadow-soft shadow-card-hover group cursor-pointer"
            >
              <div>
                <div className="w-8 h-8 flex items-center justify-center text-neutral-800 mb-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Sign
                </h3>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Add your signature in just a few clicks.
                </p>
              </div>
              <div className="flex justify-end">
                <span className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all text-sm font-medium">
                  →
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Editor Mockup Section */}
        <section
          className="max-w-6xl mx-auto px-6 py-20 border-t border-neutral-200/60"
          data-purpose="editor-preview"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* App Window Mockup */}
            <div className="lg:col-span-7">
              <div
                onClick={handleOpenEditor}
                className="bg-white rounded-xl border border-neutral-300/80 shadow-2xl overflow-hidden font-sans text-xs cursor-pointer transition-transform hover:-translate-y-1"
                title="Click to launch the Fold editor"
              >
                {/* macOS Window Titlebar */}
                <div className="bg-[#FBFBFA] px-4 py-2.5 border-b border-neutral-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  </div>
                  <div className="text-[11px] text-neutral-500 font-medium">
                    Project Proposal.pdf
                  </div>
                  <div>
                    <span className="bg-black text-white text-[10px] px-2.5 py-1 rounded-full font-medium inline-block">
                      Save
                    </span>
                  </div>
                </div>

                {/* Toolbar Subheader */}
                <div className="bg-white border-b border-neutral-100 px-4 py-1.5 flex items-center justify-between text-neutral-500">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-semibold text-neutral-800 text-xs tracking-tight">
                      fold
                    </span>
                    <span className="text-neutral-300">|</span>
                    <div className="flex items-center gap-2 text-neutral-400 text-xs">
                      <span>↺</span>
                      <span>↻</span>
                      <span>🔍</span>
                      <span>⊖</span>
                      <span>⊕</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-400 text-xs">
                    <span>↖</span>
                    <span>T</span>
                    <span>✎</span>
                    <span>⬡</span>
                    <span>✂</span>
                    <span>💬</span>
                  </div>
                </div>

                {/* Main App Body */}
                <div className="grid grid-cols-12 bg-neutral-50 min-h-[340px]">
                  {/* Left Thumbnails Sidebar */}
                  <div className="col-span-2 bg-[#F9F8F6] border-r border-neutral-200 p-2 space-y-2">
                    <div className="bg-white p-1 rounded border border-neutral-300 shadow-xs ring-1 ring-neutral-400">
                      <div className="w-full h-12 bg-neutral-100 rounded text-[8px] flex items-center justify-center text-neutral-400">
                        1
                      </div>
                    </div>
                    <div className="bg-white p-1 rounded border border-neutral-200 shadow-xs">
                      <div className="w-full h-12 bg-neutral-100 rounded text-[8px] flex items-center justify-center text-neutral-400">
                        2
                      </div>
                    </div>
                    <div className="bg-white p-1 rounded border border-neutral-200 shadow-xs">
                      <div className="w-full h-12 bg-neutral-100 rounded text-[8px] flex items-center justify-center text-neutral-400">
                        3
                      </div>
                    </div>
                  </div>

                  {/* Center Canvas Area */}
                  <div className="col-span-7 bg-[#EFECE6] p-4 flex flex-col justify-between items-center overflow-hidden">
                    {/* PDF Sheet Page */}
                    <div className="bg-white w-full max-w-[280px] h-[300px] shadow-md rounded-sm p-4 flex flex-col justify-between border border-neutral-200/80">
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <h4 className="font-serif text-lg leading-tight text-neutral-900 font-semibold">
                            Project
                            <br />
                            Proposal
                          </h4>
                          <span className="text-[8px] text-neutral-400">
                            2024
                          </span>
                        </div>
                        <div className="w-full h-24 bg-neutral-200 rounded flex items-center justify-center overflow-hidden mb-3 relative">
                          <svg
                            className="w-full h-full text-neutral-400"
                            preserveAspectRatio="none"
                            viewBox="0 0 100 60"
                          >
                            <polygon
                              fill="#a3a3a3"
                              points="10,60 30,10 50,60"
                            />
                            <polygon
                              fill="#737373"
                              points="45,60 65,20 85,60"
                            />
                            <polygon fill="#525252" points="60,60 80,5 95,60" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex justify-between items-end border-t border-neutral-100 pt-2 text-[8px] text-neutral-400">
                        <span>A better way forward.</span>
                        <span>1 / 12</span>
                      </div>
                    </div>
                    {/* Page navigator footer pill */}
                    <div className="mt-2 bg-white/90 border border-neutral-300 rounded-full px-2.5 py-0.5 text-[9px] flex items-center gap-2 text-neutral-600 shadow-xs">
                      <span>∧</span>
                      <span>1 / 12</span>
                      <span>∨</span>
                    </div>
                  </div>

                  {/* Right Tools Sidebar */}
                  <div className="col-span-3 bg-white border-l border-neutral-200 p-3 flex flex-col gap-1 text-[11px] text-neutral-600">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTool("/pdf-text-editor");
                      }}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-100 text-left font-medium text-neutral-900 border-0 bg-transparent cursor-pointer w-full"
                    >
                      <span>✎</span> Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTool("/merge");
                      }}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-100 text-left border-0 bg-transparent cursor-pointer w-full text-neutral-600"
                    >
                      <span>⧉</span> Merge
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTool("/split");
                      }}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-100 text-left border-0 bg-transparent cursor-pointer w-full text-neutral-600"
                    >
                      <span>✂</span> Split
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTool("/compress");
                      }}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-100 text-left border-0 bg-transparent cursor-pointer w-full text-neutral-600"
                    >
                      <span>⤓</span> Compress
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTool("/convert");
                      }}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-100 text-left border-0 bg-transparent cursor-pointer w-full text-neutral-600"
                    >
                      <span>⇄</span> Convert
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTool("/rotate");
                      }}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-100 text-left border-0 bg-transparent cursor-pointer w-full text-neutral-600"
                    >
                      <span>↻</span> Rotate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTool("/reorganize-pages");
                      }}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-100 text-left border-0 bg-transparent cursor-pointer w-full text-neutral-600"
                    >
                      <span>▦</span> Organise
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTool("/sign");
                      }}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-100 text-left border-0 bg-transparent cursor-pointer w-full text-neutral-600"
                    >
                      <span>🖋</span> Sign
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Copy */}
            <div className="lg:col-span-5">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 block mb-2">
                The Editor
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-normal text-neutral-950 tracking-tight leading-tight mb-4">
                Everything you need.
                <br />
                Nothing leaves your device.
              </h2>
              <p className="text-xs md:text-sm text-neutral-600 font-normal leading-relaxed mb-6">
                Open, edit and manage your PDFs with a clean, fast and intuitive
                interface. All processing happens locally on your device — no
                uploads, no accounts, no tracking.
              </p>
              {/* Signature yellow accent line */}
              <div className="w-10 h-0.5 bg-amber-400 mb-6" />

              <button
                onClick={handleOpenEditor}
                className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-black text-white text-xs font-medium px-4 py-2 rounded-full transition-all shadow-sm cursor-pointer border-0"
              >
                Launch Editor →
              </button>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section
          className="max-w-5xl mx-auto px-6 py-20 border-t border-neutral-200/60"
          data-purpose="privacy-section"
          id="privacy"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Privacy Text & Highlights */}
            <div>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 block mb-2">
                Privacy
              </span>
              <h2 className="font-serif text-4xl md:text-5xl font-normal text-neutral-950 tracking-tight leading-tight mb-4">
                Private by design.
              </h2>
              <p className="text-xs md:text-sm text-neutral-600 font-normal leading-relaxed mb-6">
                Your files stay on your device. We don't upload, store or track
                anything. Fold is built for people who value their privacy.
              </p>
              {/* Checkmark items */}
              <div className="space-y-2.5 text-xs font-medium text-neutral-800">
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-4 h-4 text-amber-500 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      fillRule="evenodd"
                    />
                  </svg>
                  <span>100% local processing</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-4 h-4 text-amber-500 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      fillRule="evenodd"
                    />
                  </svg>
                  <span>No accounts or logins</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-4 h-4 text-amber-500 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      fillRule="evenodd"
                    />
                  </svg>
                  <span>Your data, your control</span>
                </div>
              </div>
            </div>

            {/* Privacy Stippled Paper & Stamp Artwork */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 relative">
              {/* Stack of stippled textured papers */}
              <div className="relative w-48 h-56 flex items-center justify-center">
                {/* Background shadow sheet */}
                <div className="absolute w-44 h-52 bg-neutral-300 rounded transform rotate-6 opacity-60" />
                {/* Main PDF paper sheet with dog-ear yellow corner */}
                <div className="relative w-44 h-52 bg-white border border-neutral-300 rounded shadow-lg p-5 flex flex-col justify-start overflow-hidden">
                  {/* Folded yellow dog-ear corner */}
                  <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
                    <div className="w-0 h-0 border-t-[32px] border-t-amber-300 border-l-[32px] border-l-transparent" />
                  </div>
                  <div className="font-serif font-bold text-xl text-neutral-800 tracking-tight mb-3">
                    PDF
                  </div>
                  <div className="space-y-2 opacity-60">
                    <div className="w-full h-1 bg-neutral-300 rounded" />
                    <div className="w-10/12 h-1 bg-neutral-300 rounded" />
                    <div className="w-full h-1 bg-neutral-300 rounded" />
                    <div className="w-8/12 h-1 bg-neutral-300 rounded" />
                    <div className="w-9/12 h-1 bg-neutral-300 rounded" />
                    <div className="w-full h-1 bg-neutral-300 rounded" />
                    <div className="w-7/12 h-1 bg-neutral-300 rounded" />
                  </div>
                  {/* Halftone grain effect overlay on paper */}
                  <div className="absolute inset-0 stipple-bg opacity-30 pointer-events-none" />
                </div>
              </div>

              {/* Editorial Script Stamp */}
              <div className="text-left font-serif italic text-neutral-600 text-sm leading-relaxed">
                <p>Local files.</p>
                <p>Your device.</p>
                <p className="text-neutral-900 font-medium">Your rules.</p>
                <div className="w-8 h-0.5 bg-amber-400 mt-2" />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          className="max-w-5xl mx-auto px-6 py-20 border-t border-neutral-200/60"
          data-purpose="how-it-works-section"
          id="about"
        >
          {/* Section Header */}
          <div className="mb-14">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 block mb-2">
              How it works
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-neutral-950 tracking-tight leading-tight">
              Drop in. Make changes. Save.
            </h2>
          </div>

          {/* 3 Steps Connected */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex items-start gap-4 relative">
              <div className="w-8 h-8 rounded-full border border-neutral-400 text-neutral-900 font-mono text-xs flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div className="pr-6">
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Drop in
                </h3>
                <p className="text-xs text-neutral-500 leading-normal">
                  Open your PDF or drag and drop it into Fold.
                </p>
              </div>
              <div className="hidden md:block absolute right-0 top-3 text-neutral-300 text-sm">
                →
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 relative">
              <div className="w-8 h-8 rounded-full border border-neutral-400 text-neutral-900 font-mono text-xs flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div className="pr-6">
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Make changes
                </h3>
                <p className="text-xs text-neutral-500 leading-normal">
                  Use the tools to edit, merge, split or convert your file.
                </p>
              </div>
              <div className="hidden md:block absolute right-0 top-3 text-neutral-300 text-sm">
                →
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full border border-neutral-400 text-neutral-900 font-mono text-xs flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Save
                </h3>
                <p className="text-xs text-neutral-500 leading-normal">
                  Keep it on your device, or export to your preferred format.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Download Banner CTA */}
        <section
          className="max-w-5xl mx-auto px-6 pb-20"
          data-purpose="cta-banner"
          id="download"
        >
          <div className="bg-[#141414] text-white rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            {/* Banner Left: Logo + Typography */}
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-white fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18.2 8 12 11.8 5.8 8 12 4.2zM5.5 9.5l5.5 3.4v7.2L5.5 16.5V9.5zm7.5 10.6v-7.2l5.5-3.4v7l-5.5 3.6z" />
                </svg>
              </div>
              <div>
                <h3 className="font-serif text-xl md:text-2xl font-normal text-white tracking-tight">
                  Make PDFs yours again.
                </h3>
                <p className="text-xs text-neutral-400 font-normal">
                  Open Fold and take control of your files.
                </p>
              </div>
            </div>

            {/* Banner Right: Open / Download Button */}
            <div>
              <button
                onClick={handleOpenFold}
                className="inline-flex items-center gap-2 bg-white text-neutral-950 hover:bg-neutral-100 text-xs font-medium px-6 py-2.5 rounded-full transition-all shadow-sm hover:shadow cursor-pointer border-0 active-press"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <span>Open Fold</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Site Footer */}
      <footer
        className="max-w-6xl mx-auto px-6 py-10 border-t border-neutral-200/60 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-neutral-500"
        data-purpose="site-footer"
      >
        {/* Footer Brand */}
        <a
          aria-label="Fold Home"
          className="flex items-center gap-2 text-neutral-900 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          href="#"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18.2 8 12 11.8 5.8 8 12 4.2zM5.5 9.5l5.5 3.4v7.2L5.5 16.5V9.5zm7.5 10.6v-7.2l5.5-3.4v7l-5.5 3.6z" />
          </svg>
          <span className="font-serif text-xl font-medium tracking-tight">
            fold
          </span>
        </a>

        {/* Footer Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-neutral-600">
          <a
            className="hover:text-black transition-colors cursor-pointer"
            href="#tools"
            onClick={(e) => handleNavClick(e, "tools")}
          >
            Tools
          </a>
          <a
            className="hover:text-black transition-colors cursor-pointer"
            href="/open"
            onClick={(e) => {
              e.preventDefault();
              navigate("/open");
            }}
          >
            Platforms
          </a>
          <a
            className="hover:text-black transition-colors cursor-pointer"
            href="/docs"
            onClick={(e) => {
              e.preventDefault();
              navigate("/docs");
            }}
          >
            Docs
          </a>
          <a
            className="hover:text-black transition-colors cursor-pointer"
            href="/privacy"
            onClick={(e) => {
              e.preventDefault();
              navigate("/privacy");
            }}
          >
            Privacy Policy
          </a>
          <a
            className="hover:text-black transition-colors cursor-pointer"
            href="/terms"
            onClick={(e) => {
              e.preventDefault();
              navigate("/terms");
            }}
          >
            Terms of Service
          </a>
          <a
            className="hover:text-black transition-colors cursor-pointer"
            href="/editor"
            onClick={(e) => {
              e.preventDefault();
              navigate("/editor");
            }}
          >
            Editor
          </a>
        </div>

        {/* Built with badge */}
        <div className="flex items-center gap-1.5 text-neutral-500">
          <span>Built for your device.</span>
          <svg
            className="w-3.5 h-3.5 text-amber-400 fill-current"
            viewBox="0 0 16 16"
          >
            <path d="M3 1h7l4 4v9a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1zm6.5.5V5H13L9.5 1.5z" />
          </svg>
        </div>
      </footer>
    </div>
  );
}
