"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Tooltip } from "./Tooltip";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("bento-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("bento-theme", "light");
    }
  }

  return (
    <Tooltip content={isDark ? "Switch to light mode" : "Switch to dark mode"} side="bottom">
      <button
        type="button"
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-rim bg-surface text-muted transition-colors duration-150 hover:border-rim-hi hover:bg-surface-hi hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas"
      >
        {isDark ? (
          <Sun size={14} aria-hidden="true" />
        ) : (
          <Moon size={14} aria-hidden="true" />
        )}
      </button>
    </Tooltip>
  );
}
