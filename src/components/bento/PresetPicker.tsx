"use client";

import { useState, useRef, useEffect } from "react";
import { LayoutTemplate, X } from "lucide-react";
import { PRESETS } from "@/lib/bento/presets";
import type { BentoConfig, BentoCell } from "@/lib/bento/types";
import { Button } from "@/components/ui/button";

interface PresetPickerProps {
  onApplyPreset: (config: BentoConfig) => void;
  onFillRegular: () => void;
}

// ─── SVG Wireframe Thumbnail ──────────────────────────────────────────────────
// Cells rendered as stroked SVG rects. `currentColor` inherits from the parent
// button so hover/focus state drives the stroke brightness automatically.

const VW = 60;
const VH = 40;
const PAD = 2;
const GAP = 1.5;

function PresetThumbnail({
  config,
  isRegular,
}: {
  config: BentoConfig;
  isRegular?: boolean;
}) {
  const cols = isRegular ? 3 : config.grid.cols;
  const rows = isRegular ? 2 : config.grid.rows;
  const cellW = (VW - PAD * 2) / cols;
  const cellH = (VH - PAD * 2) / rows;

  const cells: Pick<BentoCell, "id" | "colStart" | "rowStart" | "colSpan" | "rowSpan">[] =
    isRegular
      ? Array.from({ length: 6 }, (_, i) => ({
          id: `r${i}`,
          colStart: (i % 3) + 1,
          rowStart: Math.floor(i / 3) + 1,
          colSpan: 1,
          rowSpan: 1,
        }))
      : config.cells;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {cells.map((cell) => {
        const x = PAD + (cell.colStart - 1) * cellW + GAP / 2;
        const y = PAD + (cell.rowStart - 1) * cellH + GAP / 2;
        const w = cell.colSpan * cellW - GAP;
        const h = cell.rowSpan * cellH - GAP;
        return (
          <rect
            key={cell.id}
            x={x}
            y={y}
            width={w}
            height={h}
            rx={1.5}
            fill="currentColor"
            fillOpacity={0.07}
            stroke="currentColor"
            strokeWidth={0.9}
          />
        );
      })}
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PresetPicker({ onApplyPreset, onFillRegular }: PresetPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dismiss on outside click
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // Dismiss on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function applyAndClose(preset: (typeof PRESETS)[number]) {
    if (preset.isRegular) {
      onFillRegular();
    } else {
      onApplyPreset(preset.config);
    }
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger ──────────────────────────────────────────────────────── */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Toggle layout presets panel"
        className="h-8 gap-1.5 border-0 bg-[#696969] text-xs font-bold text-[#000000] hover:bg-[#575757]"
      >
        <LayoutTemplate size={13} aria-hidden="true" />
        Presets
      </Button>

      {/* ── Floating Panel ────────────────────────────────────────────────── */}
      {open && (
        <div
          role="dialog"
          aria-label="Layout presets"
          className="absolute right-0 top-[calc(100%+8px)] z-50 flex w-[280px] flex-col overflow-hidden rounded-xl border border-rim bg-surface shadow-2xl shadow-black/60"
          style={{ maxHeight: 360 }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-rim px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Presets
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close presets panel"
              className="flex h-5 w-5 items-center justify-center rounded text-muted/50 transition-colors hover:bg-hover hover:text-cream/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rim-hi"
            >
              <X size={11} aria-hidden="true" />
            </button>
          </div>

          {/* Scrollable grid */}
          <div className="grid grid-cols-2 gap-2 overflow-y-auto p-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-label={`Apply ${preset.name} preset: ${preset.description}`}
                onClick={() => applyAndClose(preset)}
                className="group flex flex-col gap-2 rounded-lg border border-rim/40 bg-canvas p-2 text-muted/40 transition-all duration-150 hover:border-rim-hi hover:text-muted/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rim-hi active:scale-[0.97]"
              >
                {/* Thumbnail */}
                <div
                  className="relative w-full overflow-hidden rounded"
                  style={{ aspectRatio: "3 / 2" }}
                >
                  <PresetThumbnail config={preset.config} isRegular={preset.isRegular} />
                </div>

                {/* Label */}
                <span className="w-full truncate text-center text-[10px] font-medium text-muted transition-colors group-hover:text-cream/70">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
