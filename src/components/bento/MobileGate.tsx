"use client";

import { useState, useEffect } from "react";

const SESSION_KEY = "lintel-mobile-gate-dismissed";

export function MobileGate() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setDismissed(true);
    }
  }, []);

  function handleContinue() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas px-8 text-center md:hidden">
      {/* Decorative background dots */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-rim) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative flex flex-col items-center gap-6 max-w-xs">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <svg
            width="28"
            height="28"
            viewBox="0 0 1200 1200"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="m1136 424.97v-299.21l-256.97-125.76-558.32 272.11v251.81l-257.16 125.53v298.97l514.6 251.58 558.1-272.58v-299.63l-208.03-101.77zm-514.6 0 471.52-230.11v202.82l-471.52 230.11zm-43.266 475.82-214.13 104.34v-204.14l214.13-104.58 257.63-125.58v203.06l-257.63 125.58zm514.82 0-471.56 229.92v-203.29l257.63-126.42 213.89-104.34z" />
          </svg>
          <span className="font-serif text-3xl font-normal tracking-wide text-cream">
            Lintel
          </span>
        </div>

        {/* Divider */}
        <div className="h-px w-16 bg-rim" aria-hidden="true" />

        {/* Message */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-cream">
            Best on a larger screen
          </h1>
          <p className="text-sm leading-relaxed text-muted">
            Lintel uses drag-and-drop and a multi-panel layout that works best
            on a tablet or desktop display.
          </p>
        </div>

        {/* Device hint icon row */}
        <div className="flex items-end gap-4 text-muted/40" aria-hidden="true">
          {/* Tablet icon */}
          <svg width="36" height="28" viewBox="0 0 36 28" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="34" height="26" rx="3" />
            <circle cx="18" cy="23.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          {/* Desktop icon */}
          <svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="38" height="24" rx="2" />
            <path d="M14 29h12M20 25v4" strokeLinecap="round" />
          </svg>
        </div>

        {/* Escape hatch */}
        <button
          type="button"
          onClick={handleContinue}
          className="text-xs text-muted/50 underline underline-offset-4 transition-colors hover:text-muted focus-visible:outline-none focus-visible:text-muted"
        >
          Continue anyway →
        </button>
      </div>
    </div>
  );
}
