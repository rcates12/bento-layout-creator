"use client";

import { useState, useRef, useEffect } from "react";
import { LayoutTemplate, X } from "lucide-react";
import { PRESETS } from "@/lib/bento/presets";
import type { BentoPreset } from "@/lib/bento/presets";
import type { BentoConfig, BentoCell } from "@/lib/bento/types";
import { generateId } from "@/lib/bento/utils";
import { Button } from "@/components/ui/button";

interface PresetPickerProps {
  onApplyPreset: (config: BentoConfig) => void;
  onFillRegular: () => void;
  customPresets?: BentoPreset[];
  currentConfig?: BentoConfig;
  onSavePreset?: (preset: BentoPreset) => void;
  onDeleteCustomPreset?: (id: string) => void;
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

export function PresetPicker({
  onApplyPreset,
  onFillRegular,
  customPresets = [],
  currentConfig,
  onSavePreset,
  onDeleteCustomPreset,
}: PresetPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Save-as-preset inline form state
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");

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

  function handleSavePreset() {
    if (!saveName.trim() || !currentConfig || !onSavePreset) return;
    onSavePreset({
      id: `custom-${generateId()}`,
      name: saveName.trim(),
      description: "Custom preset",
      config: currentConfig,
    });
    setSaveName("");
    setShowSaveForm(false);
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
          style={{ maxHeight: 480 }}
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

          {/* Save as preset button / form */}
          {onSavePreset && (
            <div className="shrink-0 border-b border-rim/50 px-3 py-2.5">
              {showSaveForm ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Preset name…"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSavePreset();
                      if (e.key === "Escape") { setShowSaveForm(false); setSaveName(""); }
                    }}
                    className="min-w-0 flex-1 rounded-md border border-rim bg-canvas px-2 py-1 text-xs text-cream placeholder:text-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                    aria-label="New preset name"
                  />
                  <button
                    type="button"
                    onClick={handleSavePreset}
                    disabled={!saveName.trim()}
                    className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-canvas disabled:opacity-40 hover:bg-accent/90"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowSaveForm(false); setSaveName(""); }}
                    aria-label="Cancel save"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted/50 hover:bg-hover hover:text-cream/80"
                  >
                    <X size={11} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSaveForm(true)}
                  className="w-full rounded-md border border-dashed border-rim/50 py-1.5 text-[11px] font-medium text-muted/60 transition-colors hover:border-rim-hi hover:text-cream/70"
                >
                  + Save current layout as preset…
                </button>
              )}
            </div>
          )}

          <div className="overflow-y-auto">
            {/* My Presets section */}
            {customPresets.length > 0 && (
              <>
                <div className="px-3 pb-1 pt-2.5">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted/50">
                    My Presets
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 px-3 pb-2">
                  {customPresets.map((preset) => (
                    <div key={preset.id} className="relative">
                      <button
                        type="button"
                        aria-label={`Apply custom preset: ${preset.name}`}
                        onClick={() => { onApplyPreset(preset.config); setOpen(false); }}
                        className="group flex w-full flex-col gap-2 rounded-lg border border-rim/40 bg-canvas p-2 text-muted/40 transition-all duration-150 hover:border-rim-hi hover:text-muted/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rim-hi active:scale-[0.97]"
                      >
                        <div className="relative w-full overflow-hidden rounded" style={{ aspectRatio: "3 / 2" }}>
                          <PresetThumbnail config={preset.config} />
                        </div>
                        <span className="w-full truncate text-center text-[10px] font-medium text-muted transition-colors group-hover:text-cream/70">
                          {preset.name}
                        </span>
                      </button>
                      {onDeleteCustomPreset && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDeleteCustomPreset(preset.id); }}
                          aria-label={`Delete custom preset ${preset.name}`}
                          className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded bg-black/40 text-white/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-900/60 hover:text-white"
                        >
                          <X size={8} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mx-3 mb-1 h-px bg-rim/50" aria-hidden="true" />
              </>
            )}

            {/* Built-in presets */}
            {customPresets.length > 0 && (
              <div className="px-3 pb-1 pt-2">
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted/50">
                  Built-in
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 p-3">
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
        </div>
      )}
    </div>
  );
}
