"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { Toggle } from "@/components/ui/toggle";

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
      <Toggle
        pressed={isDark}
        onPressedChange={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        size="default"
        className="h-8 w-8 border border-rim bg-transparent text-muted hover:border-rim-hi hover:bg-surface-hi hover:text-cream data-[state=on]:bg-surface-hi data-[state=on]:text-cream"
      >
        {isDark ? (
          <Sun size={14} aria-hidden="true" />
        ) : (
          <Moon size={14} aria-hidden="true" />
        )}
      </Toggle>
    </Tooltip>
  );
}
