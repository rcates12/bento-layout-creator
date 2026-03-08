"use client";

import { useState, useEffect, useMemo } from "react";
import { Undo2, Redo2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { BentoConfig, BentoCell, GridConfig, ContentBlock } from "@/lib/bento/types";
import { generateCode, generateStandaloneHTML, generateReactJSX } from "@/lib/bento/generator";
import {
  findNextPosition,
  generateId,
  clampCell,
  hasOverlap,
} from "@/lib/bento/utils";
import { INITIAL_CELL_COLORS, EARTH_TONES } from "@/lib/bento/theme";
import { useHistoryReducer } from "@/lib/bento/useHistoryReducer";
import { GridControls } from "./GridControls";
import { BentoGrid } from "./BentoGrid";
import { CellControls } from "./CellControls";
import { CodeOutput } from "./CodeOutput";
import { PresetPicker } from "./PresetPicker";
import { StatusBanner } from "./StatusBanner";
import { ThemeToggle } from "./ThemeToggle";

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "bento-layout-v2";
const STORAGE_VERSION = 2;

interface StoredData {
  version: number;
  config: BentoConfig;
}

// Migrate a cell from v1 format (content.title/body) to v2 blocks array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateCell(raw: any): BentoCell {
  const cell = { ...raw } as BentoCell & { content?: { title?: string; body?: string } };
  if (cell.content) {
    const blocks: ContentBlock[] = [];
    if (cell.content.title) {
      blocks.push({ id: `block-${Date.now()}-t`, type: "text", text: cell.content.title, fontWeight: "semibold", fontSize: "base" });
    }
    if (cell.content.body) {
      blocks.push({ id: `block-${Date.now()}-b`, type: "text", text: cell.content.body, fontSize: "sm" });
    }
    if (blocks.length) cell.blocks = blocks;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (cell as any).content;
  }
  return cell;
}

function loadFromStorage(): BentoState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Try to migrate from v1 key
      const rawV1 = localStorage.getItem("bento-layout-v1");
      if (rawV1) {
        const parsed = JSON.parse(rawV1);
        if (parsed?.config?.grid?.cols && Array.isArray(parsed?.config?.cells)) {
          const config: BentoConfig = {
            ...parsed.config,
            cells: parsed.config.cells.map(migrateCell),
          };
          return { config, selectedCellId: null };
        }
      }
      return null;
    }
    const parsed: StoredData = JSON.parse(raw);
    if (
      parsed?.version === STORAGE_VERSION &&
      parsed?.config?.grid?.cols &&
      Array.isArray(parsed?.config?.cells)
    ) {
      return { config: parsed.config, selectedCellId: null };
    }
  } catch {
    // ignore corrupt data
  }
  return null;
}

function saveToStorage(config: BentoConfig): void {
  try {
    const data: StoredData = { version: STORAGE_VERSION, config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors (private browsing etc.)
  }
}

// ─── State ────────────────────────────────────────────────────────────────────

interface BentoState {
  config: BentoConfig;
  selectedCellId: string | null;
}

const INITIAL_STATE: BentoState = {
  config: {
    grid: { cols: 4, rows: 3, gap: 4 },
    cells: [
      {
        id: "cell-a",
        colStart: 1,
        rowStart: 1,
        colSpan: 2,
        rowSpan: 2,
        label: "Hero",
        bgColor: INITIAL_CELL_COLORS["cell-a"],
      },
      {
        id: "cell-b",
        colStart: 3,
        rowStart: 1,
        colSpan: 1,
        rowSpan: 2,
        label: "Feature",
        bgColor: INITIAL_CELL_COLORS["cell-b"],
      },
      {
        id: "cell-c",
        colStart: 4,
        rowStart: 1,
        colSpan: 1,
        rowSpan: 1,
        label: "Stat",
        bgColor: INITIAL_CELL_COLORS["cell-c"],
      },
      {
        id: "cell-d",
        colStart: 4,
        rowStart: 2,
        colSpan: 1,
        rowSpan: 1,
        label: "Stat",
        bgColor: INITIAL_CELL_COLORS["cell-d"],
      },
      {
        id: "cell-e",
        colStart: 1,
        rowStart: 3,
        colSpan: 4,
        rowSpan: 1,
        label: "Banner",
        bgColor: INITIAL_CELL_COLORS["cell-e"],
      },
    ],
  },
  selectedCellId: null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

type BentoAction =
  | { type: "UPDATE_GRID"; payload: Partial<GridConfig> }
  | { type: "ADD_CELL" }
  | { type: "ADD_CELL_AT"; payload: { colStart: number; rowStart: number } }
  | { type: "UPDATE_CELL"; payload: { id: string; updates: Partial<BentoCell> } }
  | { type: "MOVE_CELL"; payload: { id: string; colStart: number; rowStart: number } }
  | { type: "REMOVE_CELL"; payload: string }
  | { type: "SELECT_CELL"; payload: string | null }
  | { type: "LOAD_PRESET"; payload: BentoConfig }
  | { type: "FILL_REGULAR" }
  | { type: "RESET" }
  | { type: "ADD_BLOCK"; payload: { cellId: string; block: ContentBlock } }
  | { type: "UPDATE_BLOCK"; payload: { cellId: string; blockId: string; updates: Partial<ContentBlock> } }
  | { type: "REMOVE_BLOCK"; payload: { cellId: string; blockId: string } }
  | { type: "REORDER_BLOCK"; payload: { cellId: string; blockId: string; direction: "up" | "down" } }
  | { type: "REORDER_BLOCKS_FULL"; payload: { cellId: string; blockIds: string[] } }
  | { type: "SET_BG_IMAGE"; payload: { cellId: string; src: string | null } }
  | { type: "DUPLICATE_CELL"; payload: string };

function bentoReducer(state: BentoState, action: BentoAction): BentoState {
  switch (action.type) {
    case "UPDATE_GRID": {
      const newGrid = { ...state.config.grid, ...action.payload };

      // Clamp each cell to the new grid bounds
      const clamped = state.config.cells.map((cell) => clampCell(cell, newGrid));

      // Resolve overlaps introduced by clamping: process cells in order,
      // relocating displaced cells to the next available empty slot (or dropping them).
      const placed: BentoCell[] = [];
      for (const cell of clamped) {
        if (!hasOverlap(cell, placed)) {
          placed.push(cell);
          continue;
        }
        // Try to relocate to next empty position while keeping the original span
        const pos = findNextPosition({ grid: newGrid, cells: placed });
        if (pos) {
          const relocated = clampCell(
            { ...cell, colStart: pos.colStart, rowStart: pos.rowStart },
            newGrid,
          );
          if (!hasOverlap(relocated, placed)) {
            placed.push(relocated);
            continue;
          }
          // Fall back to smallest possible size at that position
          const small = clampCell(
            { ...cell, colStart: pos.colStart, rowStart: pos.rowStart, colSpan: 1, rowSpan: 1 },
            newGrid,
          );
          if (!hasOverlap(small, placed)) {
            placed.push(small);
            continue;
          }
        }
        // No valid position: drop the cell silently
      }

      const placedIds = new Set(placed.map((c) => c.id));
      return {
        ...state,
        config: { grid: newGrid, cells: placed },
        selectedCellId: placedIds.has(state.selectedCellId ?? "") ? state.selectedCellId : null,
      };
    }

    case "ADD_CELL": {
      const position = findNextPosition(state.config);
      if (!position) return state;
      const newCell: BentoCell = {
        id: generateId(),
        ...position,
        colSpan: 1,
        rowSpan: 1,
        label: `Cell ${state.config.cells.length + 1}`,
      };
      return {
        ...state,
        config: { ...state.config, cells: [...state.config.cells, newCell] },
        selectedCellId: newCell.id,
      };
    }

    case "ADD_CELL_AT": {
      const { colStart, rowStart } = action.payload;
      const newCell: BentoCell = {
        id: generateId(),
        colStart,
        rowStart,
        colSpan: 1,
        rowSpan: 1,
        label: `Cell ${state.config.cells.length + 1}`,
      };
      return {
        ...state,
        config: { ...state.config, cells: [...state.config.cells, newCell] },
        selectedCellId: newCell.id,
      };
    }

    case "UPDATE_CELL": {
      const current = state.config.cells.find(
        (c) => c.id === action.payload.id,
      );
      if (!current) return state;
      const proposed = clampCell(
        { ...current, ...action.payload.updates },
        state.config.grid,
      );
      const others = state.config.cells.filter((c) => c.id !== proposed.id);
      if (hasOverlap(proposed, others)) return state;
      const updatedCells = state.config.cells.map((c) =>
        c.id === action.payload.id ? proposed : c,
      );
      return { ...state, config: { ...state.config, cells: updatedCells } };
    }

    case "MOVE_CELL": {
      const { id, colStart, rowStart } = action.payload;
      const moving = state.config.cells.find((c) => c.id === id);
      if (!moving) return state;

      const proposed = clampCell(
        { ...moving, colStart, rowStart },
        state.config.grid,
      );

      if (
        proposed.colStart === moving.colStart &&
        proposed.rowStart === moving.rowStart
      )
        return state;

      const otherCells = state.config.cells.filter((c) => c.id !== id);
      const conflicting = otherCells.filter((c) => hasOverlap(proposed, [c]));

      if (conflicting.length === 0) {
        return {
          ...state,
          config: {
            ...state.config,
            cells: state.config.cells.map((c) =>
              c.id === id ? proposed : c,
            ),
          },
        };
      }

      if (conflicting.length === 1) {
        const other = conflicting[0];
        const swapped = clampCell(
          { ...other, colStart: moving.colStart, rowStart: moving.rowStart },
          state.config.grid,
        );

        if (
          swapped.colSpan < other.colSpan ||
          swapped.rowSpan < other.rowSpan
        )
          return state;

        const remaining = otherCells.filter((c) => c.id !== other.id);
        if (hasOverlap(swapped, remaining)) return state;

        return {
          ...state,
          config: {
            ...state.config,
            cells: state.config.cells.map((c) => {
              if (c.id === id) return proposed;
              if (c.id === other.id) return swapped;
              return c;
            }),
          },
        };
      }

      return state;
    }

    case "REMOVE_CELL": {
      return {
        ...state,
        config: {
          ...state.config,
          cells: state.config.cells.filter((c) => c.id !== action.payload),
        },
        selectedCellId:
          state.selectedCellId === action.payload
            ? null
            : state.selectedCellId,
      };
    }

    case "SELECT_CELL": {
      return { ...state, selectedCellId: action.payload };
    }

    case "LOAD_PRESET": {
      return {
        config: action.payload,
        selectedCellId: null,
      };
    }

    case "FILL_REGULAR": {
      const { grid } = state.config;
      const cells: BentoCell[] = [];
      let n = 0;
      for (let row = 1; row <= grid.rows; row++) {
        for (let col = 1; col <= grid.cols; col++) {
          n++;
          cells.push({
            id: generateId(),
            colStart: col,
            rowStart: row,
            colSpan: 1,
            rowSpan: 1,
            label: `Cell ${n}`,
            bgColor: EARTH_TONES[(n - 1) % EARTH_TONES.length].hex,
          });
        }
      }
      return { ...state, config: { ...state.config, cells }, selectedCellId: null };
    }

    case "RESET": {
      return INITIAL_STATE;
    }

    case "ADD_BLOCK": {
      const { cellId, block } = action.payload;
      return {
        ...state,
        config: {
          ...state.config,
          cells: state.config.cells.map((c) =>
            c.id === cellId
              ? { ...c, blocks: [...(c.blocks ?? []), block] }
              : c,
          ),
        },
      };
    }

    case "UPDATE_BLOCK": {
      const { cellId, blockId, updates } = action.payload;
      return {
        ...state,
        config: {
          ...state.config,
          cells: state.config.cells.map((c) =>
            c.id === cellId
              ? {
                  ...c,
                  blocks: (c.blocks ?? []).map((b) =>
                    b.id === blockId ? ({ ...b, ...updates } as ContentBlock) : b,
                  ),
                }
              : c,
          ),
        },
      };
    }

    case "REMOVE_BLOCK": {
      const { cellId, blockId } = action.payload;
      return {
        ...state,
        config: {
          ...state.config,
          cells: state.config.cells.map((c) =>
            c.id === cellId
              ? { ...c, blocks: (c.blocks ?? []).filter((b) => b.id !== blockId) }
              : c,
          ),
        },
      };
    }

    case "SET_BG_IMAGE": {
      const { cellId, src } = action.payload;
      return {
        ...state,
        config: {
          ...state.config,
          cells: state.config.cells.map((c) =>
            c.id === cellId
              ? { ...c, bgImage: src ?? undefined }
              : c,
          ),
        },
      };
    }

    case "REORDER_BLOCK": {
      const { cellId, blockId, direction } = action.payload;
      return {
        ...state,
        config: {
          ...state.config,
          cells: state.config.cells.map((c) => {
            if (c.id !== cellId) return c;
            const blocks = [...(c.blocks ?? [])];
            const idx = blocks.findIndex((b) => b.id === blockId);
            if (idx === -1) return c;
            const swapIdx = direction === "up" ? idx - 1 : idx + 1;
            if (swapIdx < 0 || swapIdx >= blocks.length) return c;
            [blocks[idx], blocks[swapIdx]] = [blocks[swapIdx], blocks[idx]];
            return { ...c, blocks };
          }),
        },
      };
    }

    case "REORDER_BLOCKS_FULL": {
      const { cellId, blockIds } = action.payload;
      return {
        ...state,
        config: {
          ...state.config,
          cells: state.config.cells.map((c) => {
            if (c.id !== cellId) return c;
            const blocks = c.blocks ?? [];
            const map = new Map(blocks.map((b) => [b.id, b]));
            const reordered = blockIds.map((id) => map.get(id)).filter(Boolean) as ContentBlock[];
            return { ...c, blocks: reordered };
          }),
        },
      };
    }

    case "DUPLICATE_CELL": {
      const source = state.config.cells.find((c) => c.id === action.payload);
      if (!source) return state;
      const pos = findNextPosition(state.config);
      if (!pos) return state;
      const newCell: BentoCell = {
        ...source,
        id: generateId(),
        colStart: pos.colStart,
        rowStart: pos.rowStart,
        colSpan: 1,
        rowSpan: 1,
      };
      return {
        ...state,
        config: { ...state.config, cells: [...state.config.cells, newCell] },
        selectedCellId: newCell.id,
      };
    }

    default:
      return state;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BentoEditor() {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useHistoryReducer(
    bentoReducer,
    INITIAL_STATE,
    ["SELECT_CELL"],
    loadFromStorage,
  );

  const { config, selectedCellId } = state;
  const selectedCell =
    config.cells.find((c) => c.id === selectedCellId) ?? null;
  const canAddCell = findNextPosition(config) !== null;

  // Grid control hover deltas (for column/row add/remove previews)
  const [colHoverDelta, setColHoverDelta] = useState<1 | -1 | null>(null);
  const [rowHoverDelta, setRowHoverDelta] = useState<1 | -1 | null>(null);

  // How-to section collapsed state (persisted)
  const [howToOpen, setHowToOpen] = useState(false);

  // Persist config to localStorage whenever it changes
  useEffect(() => {
    saveToStorage(config);
  }, [config]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      const inInput = (e.target as HTMLElement).closest("input, textarea, select") !== null;

      // Undo / Redo (always active)
      if (mod) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
          return;
        }
        if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          e.preventDefault();
          redo();
          return;
        }
        // Ctrl+D — duplicate selected cell
        if (e.key === "d" && selectedCellId) {
          e.preventDefault();
          dispatch({ type: "DUPLICATE_CELL", payload: selectedCellId });
          return;
        }
      }

      // Cell shortcuts only when a cell is selected and focus is not in a text field
      if (selectedCellId && !inInput) {
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          dispatch({ type: "REMOVE_CELL", payload: selectedCellId });
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          dispatch({ type: "SELECT_CELL", payload: null });
          return;
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, selectedCellId, dispatch]);

  const generatedHTML = useMemo(() => generateCode(config), [config]);
  const generatedStandalone = useMemo(() => generateStandaloneHTML(config), [config]);
  const generatedJSX = useMemo(() => generateReactJSX(config), [config]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-canvas focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-rim/60 bg-surface/90 backdrop-blur-md px-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-[0_2px_10px_rgba(124,58,237,0.45)]"
            aria-hidden="true"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-canvas"
            >
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-cream">
            Bento Creator
          </h1>
          <span className="hidden rounded-full border border-accent/20 bg-accent/8 px-2 py-0.5 text-[10px] font-medium text-accent dark:text-accent-hi sm:inline">
            Phase 4
          </span>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-2">
          {/* Undo button */}
          <Button
            variant="outline"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo last action (Ctrl+Z)"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} aria-hidden="true" />
          </Button>

          {/* Redo button */}
          <Button
            variant="outline"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo last action (Ctrl+Y)"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={14} aria-hidden="true" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-5 bg-rim-hi/70 dark:bg-rim-hi/40" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: "RESET" })}
            aria-label="Reset layout to default"
          >
            Reset
          </Button>

          <Separator orientation="vertical" className="mx-1 h-5 bg-rim-hi/70 dark:bg-rim-hi/40" />

          <ThemeToggle />
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside
          className="flex w-72 shrink-0 flex-col gap-5 overflow-x-hidden overflow-y-auto border-r border-rim/60 iso-sidebar p-4"
          aria-label="Configuration panel"
        >
          {/* How to use — collapsible */}
          <section aria-label="How to use">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHowToOpen((v) => !v)}
              aria-expanded={howToOpen}
              className="w-full justify-between px-0 text-[11px] font-semibold uppercase tracking-wider text-muted hover:bg-transparent hover:text-cream"
            >
              <span>How to use</span>
              <ChevronDown
                size={12}
                aria-hidden="true"
                className={`transition-transform duration-200 ${howToOpen ? "rotate-180" : ""}`}
              />
            </Button>
            {howToOpen && (
              <ul className="mt-2 flex flex-col gap-1.5">
                {[
                  "Pick a preset or build from scratch",
                  "Use +/− buttons to add or remove columns and rows",
                  "Click a ghost tile (+) on the canvas to add a cell",
                  "Hover a cell to see the quick-add bar — add text, image, or button blocks directly",
                  "Drag the dot-handle at the top of a cell to move it",
                  "Drag the corner handle or scroll on a selected cell to resize",
                  "Click a cell to edit its properties in the sidebar",
                  "Use ↑ / ↓ arrows in a content block card to reorder blocks",
                  "Press Delete to remove the selected cell (when not typing)",
                  "Press Escape to deselect the current cell",
                  "Press Ctrl+D to duplicate the selected cell",
                  "Use Ctrl+Z / Ctrl+Y to undo and redo",
                  "Your layout is auto-saved in the browser",
                  "Copy the generated code from the Export panel below",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-1.5">
                    <span className="mt-[3px] shrink-0 text-accent" aria-hidden="true">·</span>
                    <span className="text-[11px] leading-relaxed text-muted/80">{tip}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Separator className="bg-rim-hi/70 dark:bg-rim-hi/40" />

          {/* Presets */}
          <PresetPicker
            onApplyPreset={(presetConfig) =>
              dispatch({ type: "LOAD_PRESET", payload: presetConfig })
            }
            onFillRegular={() => dispatch({ type: "FILL_REGULAR" })}
          />

          <Separator className="bg-rim-hi/70 dark:bg-rim-hi/40" />

          {/* Grid settings */}
          <GridControls
            grid={config.grid}
            onUpdate={(partial) =>
              dispatch({ type: "UPDATE_GRID", payload: partial })
            }
            onColHoverDelta={setColHoverDelta}
            onRowHoverDelta={setRowHoverDelta}
          />

          <Separator className="bg-rim-hi/70 dark:bg-rim-hi/40" />

          {/* Cell settings */}
          {selectedCell ? (
            <CellControls
              cell={selectedCell}
              grid={config.grid}
              cells={config.cells}
              onUpdate={(updates) =>
                dispatch({
                  type: "UPDATE_CELL",
                  payload: { id: selectedCell.id, updates },
                })
              }
              onDelete={() =>
                dispatch({ type: "REMOVE_CELL", payload: selectedCell.id })
              }
              onAddBlock={(block) =>
                dispatch({ type: "ADD_BLOCK", payload: { cellId: selectedCell.id, block } })
              }
              onUpdateBlock={(blockId, updates) =>
                dispatch({ type: "UPDATE_BLOCK", payload: { cellId: selectedCell.id, blockId, updates } })
              }
              onRemoveBlock={(blockId) =>
                dispatch({ type: "REMOVE_BLOCK", payload: { cellId: selectedCell.id, blockId } })
              }
              onSetBgImage={(src) =>
                dispatch({ type: "SET_BG_IMAGE", payload: { cellId: selectedCell.id, src } })
              }
              onReorderBlock={(blockId, direction) =>
                dispatch({ type: "REORDER_BLOCK", payload: { cellId: selectedCell.id, blockId, direction } })
              }
              onReorderBlocksFull={(blockIds) =>
                dispatch({ type: "REORDER_BLOCKS_FULL", payload: { cellId: selectedCell.id, blockIds } })
              }
              onDuplicateCell={() =>
                dispatch({ type: "DUPLICATE_CELL", payload: selectedCell.id })
              }
              canDuplicate={canAddCell}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Cell
              </p>
              <StatusBanner variant="info">
                Click a cell on the canvas to edit its properties
              </StatusBanner>
            </div>
          )}
        </aside>

        {/* Main */}
        <main
          id="main-content"
          className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-5"
        >
          <BentoGrid
            config={config}
            selectedCellId={selectedCellId}
            colHoverDelta={colHoverDelta}
            rowHoverDelta={rowHoverDelta}
            onSelectCell={(id) =>
              dispatch({ type: "SELECT_CELL", payload: id })
            }
            onAddCell={() => dispatch({ type: "ADD_CELL" })}
            onAddCellAt={(col, row) =>
              dispatch({
                type: "ADD_CELL_AT",
                payload: { colStart: col, rowStart: row },
              })
            }
            onMoveCell={(id, colStart, rowStart) =>
              dispatch({ type: "MOVE_CELL", payload: { id, colStart, rowStart } })
            }
            onUpdateCell={(id, updates) =>
              dispatch({ type: "UPDATE_CELL", payload: { id, updates } })
            }
            onDeleteCell={(id) =>
              dispatch({ type: "REMOVE_CELL", payload: id })
            }
            onAddBlock={(cellId, block) =>
              dispatch({ type: "ADD_BLOCK", payload: { cellId, block } })
            }
            canAddCell={canAddCell}
          />

          <CodeOutput
            htmlCode={generatedHTML}
            standaloneCode={generatedStandalone}
            jsxCode={generatedJSX}
          />
        </main>
      </div>
    </div>
  );
}
