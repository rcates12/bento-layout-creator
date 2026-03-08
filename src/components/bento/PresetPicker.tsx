"use client";

import { useState } from "react";
import { PRESETS } from "@/lib/bento/presets";
import type { BentoConfig } from "@/lib/bento/types";
import { DEFAULT_CELL_BG } from "@/lib/bento/theme";
import { ChevronDown, LayoutTemplate } from "lucide-react";

interface PresetPickerProps {
  onApplyPreset: (config: BentoConfig) => void;
  onFillRegular: () => void;
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────

function PresetThumbnail({ config }: { config: BentoConfig }) {
  const { grid, cells } = config;
  const gap = 3; // visual gap in px for thumbnail

  return (
    <div
      className="relative w-full overflow-hidden rounded bg-canvas"
      style={{ aspectRatio: "4/3" }}
      aria-hidden="true"
    >
      {cells.map((cell) => {
        const left = ((cell.colStart - 1) / grid.cols) * 100;
        const top = ((cell.rowStart - 1) / grid.rows) * 100;
        const width = (cell.colSpan / grid.cols) * 100;
        const height = (cell.rowSpan / grid.rows) * 100;
        return (
          <div
            key={cell.id}
            style={{
              position: "absolute",
              left: `calc(${left}% + ${gap / 2}px)`,
              top: `calc(${top}% + ${gap / 2}px)`,
              width: `calc(${width}% - ${gap}px)`,
              height: `calc(${height}% - ${gap}px)`,
              backgroundColor: cell.bgColor ?? DEFAULT_CELL_BG,
              borderRadius: 3,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PresetPicker({ onApplyPreset, onFillRegular }: PresetPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <section aria-label="Layout presets" className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted transition-colors duration-150 hover:text-cream focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        <span className="flex items-center gap-1.5">
          <LayoutTemplate size={12} aria-hidden="true" />
          Presets
        </span>
        <ChevronDown
          size={12}
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.description}
              aria-label={`Apply ${preset.name} preset: ${preset.description}`}
              onClick={() => {
                if (preset.isRegular) {
                  onFillRegular();
                } else {
                  onApplyPreset(preset.config);
                }
                setOpen(false);
              }}
              className="flex flex-col gap-1 rounded-lg border border-rim bg-canvas/50 p-1.5 text-left transition-colors duration-150 hover:border-rim-hi hover:bg-surface-hi focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              {preset.isRegular ? (
                <div
                  className="w-full overflow-hidden rounded bg-canvas"
                  style={{ aspectRatio: "4/3" }}
                  aria-hidden="true"
                >
                  <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-[3px] p-[3px]">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-[2px] bg-muted/30"
                        style={{
                          backgroundColor:
                            i % 3 === 0
                              ? "#1e1b4b"
                              : i % 3 === 1
                                ? "#2e1065"
                                : "#0369a1",
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <PresetThumbnail config={preset.config} />
              )}
              <span className="truncate text-[10px] font-medium text-muted">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
