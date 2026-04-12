"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Undo2, Redo2, HelpCircle, Code2, X, Menu, RotateCcw, PanelLeftOpen, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "./Tooltip";
import type { BentoConfig, BentoCell, GridConfig, ContentBlock } from "@/lib/bento/types";
import { generateCode, generateStandaloneHTML, generateReactJSX } from "@/lib/bento/generator";
import {
  findNextPosition,
  generateId,
  clampCell,
  hasOverlap,
  findAdjacentCell,
  encodeConfig,
  decodeConfig,
} from "@/lib/bento/utils";
import { INITIAL_CELL_COLORS, EARTH_TONES } from "@/lib/bento/theme";
import { useHistoryReducer } from "@/lib/bento/useHistoryReducer";
import { loadCustomPresets, saveCustomPresets } from "@/lib/bento/presets";
import type { BentoPreset } from "@/lib/bento/presets";
import { GridControls } from "./GridControls";
import { BentoGrid } from "./BentoGrid";
import { CellControls } from "./CellControls";
import { CodeOutput } from "./CodeOutput";
import { PresetPicker } from "./PresetPicker";
import { StatusBanner } from "./StatusBanner";

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

  // URL hash takes priority over localStorage
  const hash = window.location.hash;
  if (hash.startsWith("#config=")) {
    const decoded = decodeConfig(hash.slice("#config=".length));
    if (decoded?.grid?.cols && Array.isArray(decoded?.cells)) {
      return { config: decoded, selectedCellId: null, selectedCellIds: [] };
    }
  }

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
          return { config, selectedCellId: null, selectedCellIds: [] };
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
      return { config: parsed.config, selectedCellId: null, selectedCellIds: [] };
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
  selectedCellIds: string[];
}

const INITIAL_STATE: BentoState = {
  selectedCellIds: [],
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
  | { type: "DUPLICATE_CELL"; payload: string }
  | { type: "SELECT_MULTI_CELL"; payload: string }
  | { type: "CLEAR_MULTI_SELECT" }
  | { type: "BULK_DELETE_CELLS" }
  | { type: "BULK_SET_BG_COLOR"; payload: string };

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
        selectedCellIds: state.selectedCellIds.filter((id) => placedIds.has(id)),
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
        selectedCellIds: state.selectedCellIds.filter((id) => id !== action.payload),
      };
    }

    case "SELECT_CELL": {
      return { ...state, selectedCellId: action.payload };
    }

    case "LOAD_PRESET": {
      return {
        config: action.payload,
        selectedCellId: null,
        selectedCellIds: [],
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
      return { ...state, config: { ...state.config, cells }, selectedCellId: null, selectedCellIds: [] };
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

    case "SELECT_MULTI_CELL": {
      const id = action.payload;
      const already = state.selectedCellIds.includes(id);
      return {
        ...state,
        selectedCellIds: already
          ? state.selectedCellIds.filter((x) => x !== id)
          : [...state.selectedCellIds, id],
      };
    }

    case "CLEAR_MULTI_SELECT": {
      return { ...state, selectedCellIds: [] };
    }

    case "BULK_DELETE_CELLS": {
      const toDelete = new Set(state.selectedCellIds);
      return {
        ...state,
        config: {
          ...state.config,
          cells: state.config.cells.filter((c) => !toDelete.has(c.id)),
        },
        selectedCellId: toDelete.has(state.selectedCellId ?? "") ? null : state.selectedCellId,
        selectedCellIds: [],
      };
    }

    case "BULK_SET_BG_COLOR": {
      const ids = new Set(state.selectedCellIds);
      return {
        ...state,
        config: {
          ...state.config,
          cells: state.config.cells.map((c) =>
            ids.has(c.id) ? { ...c, bgColor: action.payload } : c,
          ),
        },
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

  const { config, selectedCellId, selectedCellIds } = state;
  const selectedCell =
    config.cells.find((c) => c.id === selectedCellId) ?? null;
  const canAddCell = findNextPosition(config) !== null;

  // Grid control hover deltas (for column/row add/remove previews)
  const [colHoverDelta, setColHoverDelta] = useState<1 | -1 | null>(null);
  const [rowHoverDelta, setRowHoverDelta] = useState<1 | -1 | null>(null);

  // Feature 1: Reset confirm
  const [confirmReset, setConfirmReset] = useState(false);
  const confirmResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Feature 1: Keyboard delete confirm (ref only — no visual state needed)
  const confirmDeleteKbdRef = useRef(false);
  const confirmDeleteKbdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Feature 2: Style clipboard
  const styleClipboardRef = useRef<Partial<BentoCell>>({});
  const [hasStyleClipboard, setHasStyleClipboard] = useState(false);

  // Feature 5: Recent colors (up to 6, session-only)
  const recentColorsRef = useRef<string[]>([]);

  // Export panel visibility
  const [showExport, setShowExport] = useState(false);

  // Share URL feedback
  const [shareCopied, setShareCopied] = useState(false);

  // Import JSON modal state
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  // Grid ref for PNG export (passed to BentoGrid + CodeOutput)
  const gridRef = useRef<HTMLDivElement>(null);

  // Custom presets (Feature 3)
  const [customPresets, setCustomPresets] = useState<BentoPreset[]>(
    () => typeof window !== "undefined" ? loadCustomPresets() : [],
  );

  // Sidebar visibility (overlay drawer on tablet, always open on desktop)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialise sidebar open state based on screen width
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsSidebarOpen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Cleanup confirm timers on unmount
  useEffect(() => {
    return () => {
      if (confirmResetTimerRef.current) clearTimeout(confirmResetTimerRef.current);
      if (confirmDeleteKbdTimerRef.current) clearTimeout(confirmDeleteKbdTimerRef.current);
    };
  }, []);

  // Persist config to localStorage whenever it changes
  useEffect(() => {
    saveToStorage(config);
  }, [config]);

  // Sync config to URL hash (debounced 300ms, no history entry)
  useEffect(() => {
    const timer = setTimeout(() => {
      const encoded = encodeConfig(config);
      history.replaceState(null, "", `#config=${encoded}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [config]);

  // Share: copy current URL to clipboard
  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const el = document.createElement("textarea");
      el.value = window.location.href;
      el.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, []);

  // JSON Import handler
  const handleImport = useCallback(() => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importText);
      if (!parsed?.grid?.cols || !Array.isArray(parsed?.cells)) {
        setImportError("Invalid layout: must have grid and cells fields.");
        return;
      }
      dispatch({ type: "LOAD_PRESET", payload: parsed as BentoConfig });
      setShowImport(false);
      setImportText("");
    } catch {
      setImportError("Invalid JSON — please check for syntax errors.");
    }
  }, [importText, dispatch]);

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
        // Ctrl+E — toggle export panel
        if (e.key === "e") {
          e.preventDefault();
          setShowExport(prev => !prev);
          return;
        }
      }

      // Cell shortcuts (when no text input is focused)
      if (!inInput) {
        if (selectedCellIds.length > 1) {
          if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            dispatch({ type: "BULK_DELETE_CELLS" });
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            dispatch({ type: "CLEAR_MULTI_SELECT" });
            return;
          }
        } else if (selectedCellId) {
          if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            if (confirmDeleteKbdRef.current) {
              if (confirmDeleteKbdTimerRef.current) clearTimeout(confirmDeleteKbdTimerRef.current);
              confirmDeleteKbdRef.current = false;
              dispatch({ type: "REMOVE_CELL", payload: selectedCellId });
            } else {
              confirmDeleteKbdRef.current = true;
              confirmDeleteKbdTimerRef.current = setTimeout(() => {
                confirmDeleteKbdRef.current = false;
              }, 2000);
            }
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            dispatch({ type: "SELECT_CELL", payload: null });
            return;
          }
        }
        // Arrow keys — navigate to adjacent cell
        if (selectedCellId && (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "ArrowUp")) {
          e.preventDefault();
          const dirMap: Record<string, "right" | "left" | "down" | "up"> = {
            ArrowRight: "right",
            ArrowLeft: "left",
            ArrowDown: "down",
            ArrowUp: "up",
          };
          const nextId = findAdjacentCell(config.cells, selectedCellId, dirMap[e.key]);
          if (nextId) dispatch({ type: "SELECT_CELL", payload: nextId });
          return;
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, selectedCellId, selectedCellIds, dispatch, config.cells]);

  const generatedHTML = useMemo(() => generateCode(config), [config]);
  const generatedStandalone = useMemo(() => generateStandaloneHTML(config), [config]);
  const generatedJSX = useMemo(() => generateReactJSX(config), [config]);
  const generatedJSON = useMemo(() => JSON.stringify(config, null, 2), [config]);

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
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-rim bg-surface px-4">
        <div className="flex items-center gap-2">
          {/* Sidebar toggle — tablet only (hidden on desktop) */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label="Toggle controls panel"
            aria-expanded={isSidebarOpen}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hover/60 hover:text-cream/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <Menu size={16} aria-hidden="true" />
          </button>

          <svg
            width="26"
            height="26"
            viewBox="0 0 1200 1200"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="m1136 424.97v-299.21l-256.97-125.76-558.32 272.11v251.81l-257.16 125.53v298.97l514.6 251.58 558.1-272.58v-299.63l-208.03-101.77zm-514.6 0 471.52-230.11v202.82l-471.52 230.11zm-43.266 475.82-214.13 104.34v-204.14l214.13-104.58 257.63-125.58v203.06l-257.63 125.58zm514.82 0-471.56 229.92v-203.29l257.63-126.42 213.89-104.34z" />
          </svg>
          <h1 className="font-serif text-2xl font-normal tracking-wide text-cream">
            Lintel
          </h1>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-2">
          {/* Presets */}
          <PresetPicker
            onApplyPreset={(presetConfig) =>
              dispatch({ type: "LOAD_PRESET", payload: presetConfig })
            }
            onFillRegular={() => dispatch({ type: "FILL_REGULAR" })}
            customPresets={customPresets}
            currentConfig={config}
            onSavePreset={(preset) => {
              const next = [...customPresets, preset];
              setCustomPresets(next);
              saveCustomPresets(next);
            }}
            onDeleteCustomPreset={(id) => {
              const next = customPresets.filter((p) => p.id !== id);
              setCustomPresets(next);
              saveCustomPresets(next);
            }}
          />

          {/* Help */}
          <Tooltip
            content={
              <div className="flex flex-col gap-1 text-xs leading-relaxed">
                <p className="font-semibold text-cream mb-0.5">Keyboard shortcuts</p>
                <span>Click ghost tile <kbd className="rounded bg-rim px-1">+</kbd> to add a cell</span>
                <span>Drag dot-handle to move cells</span>
                <span>Drag corner handle to resize</span>
                <span><kbd className="rounded bg-rim px-1">Del</kbd> delete selected cell</span>
                <span><kbd className="rounded bg-rim px-1">Esc</kbd> deselect</span>
                <span><kbd className="rounded bg-rim px-1">Ctrl+D</kbd> duplicate</span>
                <span><kbd className="rounded bg-rim px-1">Ctrl+Z / Y</kbd> undo / redo</span>
                <span><kbd className="rounded bg-rim px-1">Ctrl+E</kbd> toggle export</span>
              </div>
            }
            side="bottom"
          >
            <Button
              variant="outline"
              size="icon"
              aria-label="Show keyboard shortcuts and tips"
              className="h-8 w-8 border-0 bg-[#696969] font-bold text-[#000000] hover:bg-[#575757]"
            >
              <HelpCircle size={15} aria-hidden="true" />
            </Button>
          </Tooltip>

          {/* Undo / Redo group */}
          <div className="flex overflow-hidden rounded-lg border border-rim/60 bg-surface-hi">
            <Tooltip content="Undo (Ctrl+Z)" side="bottom">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Undo last action (Ctrl+Z)"
                className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:bg-hover/60 hover:text-cream/90 disabled:opacity-30"
              >
                <Undo2 size={15} aria-hidden="true" />
              </button>
            </Tooltip>
            <div className="w-px bg-rim/60" />
            <Tooltip content="Redo (Ctrl+Y)" side="bottom">
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                aria-label="Redo last action (Ctrl+Y)"
                className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:bg-hover/60 hover:text-cream/90 disabled:opacity-30"
              >
                <Redo2 size={15} aria-hidden="true" />
              </button>
            </Tooltip>
          </div>

          {/* Share button */}
          <Tooltip content="Copy shareable URL to clipboard" side="bottom">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Copy shareable layout URL to clipboard"
              className="flex h-8 items-center gap-1.5 rounded-lg border border-rim/60 bg-surface-hi px-3 text-xs font-medium text-muted transition-colors hover:bg-hover/60 hover:text-cream/90"
            >
              {shareCopied ? (
                <Check size={14} aria-hidden="true" className="text-green-400" />
              ) : (
                <Share2 size={14} aria-hidden="true" />
              )}
              <span className="hidden lg:inline">{shareCopied ? "Copied!" : "Share"}</span>
            </button>
          </Tooltip>

          {/* Import JSON button */}
          <Tooltip content="Import layout from JSON" side="bottom">
            <button
              type="button"
              onClick={() => { setShowImport(true); setImportError(null); setImportText(""); }}
              aria-label="Import layout from JSON"
              className="flex h-8 items-center gap-1.5 rounded-lg border border-rim/60 bg-surface-hi px-3 text-xs font-medium text-muted transition-colors hover:bg-hover/60 hover:text-cream/90"
            >
              <span className="hidden lg:inline">Import</span>
              <span className="lg:hidden text-[11px]">↑</span>
            </button>
          </Tooltip>

          {/* Export panel toggle */}
          <Tooltip content="Toggle export panel (Ctrl+E)" side="bottom">
            <button
              type="button"
              onClick={() => setShowExport(prev => !prev)}
              aria-label="Toggle export panel (Ctrl+E)"
              aria-pressed={showExport}
              className={[
                "flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
                showExport
                  ? "border-accent/60 bg-accent/15 text-accent hover:bg-accent/20"
                  : "border-rim/60 bg-surface-hi text-muted hover:bg-hover/60 hover:text-cream/90",
              ].join(" ")}
            >
              <Code2 size={14} aria-hidden="true" />
              <span className="hidden lg:inline">Export</span>
            </button>
          </Tooltip>

          {/* Reset */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirmReset) {
                if (confirmResetTimerRef.current) clearTimeout(confirmResetTimerRef.current);
                setConfirmReset(false);
                dispatch({ type: "RESET" });
              } else {
                setConfirmReset(true);
                confirmResetTimerRef.current = setTimeout(() => setConfirmReset(false), 2000);
              }
            }}
            aria-label={confirmReset ? "Confirm reset layout" : "Reset layout to default"}
            className={
              confirmReset
                ? "h-8 border-0 bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                : "h-8 border-0 bg-[#696969] text-xs font-bold text-[#000000] hover:bg-[#575757]"
            }
          >
            {confirmReset ? (
              "Sure?"
            ) : (
              <>
                <RotateCcw size={13} className="lg:hidden" aria-hidden="true" />
                <span className="hidden lg:inline">Reset</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar backdrop — tablet only, shown when sidebar is open */}
        <div
          aria-hidden="true"
          onClick={() => setIsSidebarOpen(false)}
          className={[
            "absolute inset-0 z-30 bg-black/60 lg:hidden",
            "transition-opacity duration-300 ease-in-out",
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          ].join(" ")}
        />

        {/* Sidebar */}
        <aside
          className={[
            "flex w-[320px] shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-rim bg-surface",
            // Below lg: absolute overlay drawer
            "absolute inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out",
            // On desktop: static in-flow (override absolute positioning)
            "lg:relative lg:inset-auto lg:z-auto lg:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
          aria-label="Configuration panel"
        >
          {/* Sidebar header — close button on tablet */}
          <div className="lg:hidden flex h-10 shrink-0 items-center justify-between border-b border-rim px-4">
            <span className="text-xs font-semibold text-muted uppercase tracking-widest">Controls</span>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close controls panel"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover/60 hover:text-cream/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>

          {/* Grid settings panel */}
          <div className="px-4 py-4">
            <GridControls
              grid={config.grid}
              onUpdate={(partial) =>
                dispatch({ type: "UPDATE_GRID", payload: partial })
              }
              onColHoverDelta={setColHoverDelta}
              onRowHoverDelta={setRowHoverDelta}
            />
          </div>

          {/* Full-bleed divider */}
          <div className="shrink-0 h-px bg-rim" aria-hidden="true" />

          {/* Cell settings panel */}
          <div className="flex-1 px-4 py-4">
            {selectedCell ? (
              <CellControls
                cell={selectedCell}
                grid={config.grid}
                cells={config.cells}
                onUpdate={(updates) => {
                  if (updates.bgColor) {
                    const hex = updates.bgColor;
                    recentColorsRef.current = [hex, ...recentColorsRef.current.filter((c) => c !== hex)].slice(0, 6);
                  }
                  dispatch({
                    type: "UPDATE_CELL",
                    payload: { id: selectedCell.id, updates },
                  });
                }}
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
                onReorderBlocksFull={(blockIds) =>
                  dispatch({ type: "REORDER_BLOCKS_FULL", payload: { cellId: selectedCell.id, blockIds } })
                }
                onDuplicateCell={() =>
                  dispatch({ type: "DUPLICATE_CELL", payload: selectedCell.id })
                }
                canDuplicate={canAddCell}
                onCopyStyle={() => {
                  styleClipboardRef.current = {
                    bgColor: selectedCell.bgColor,
                    bgImage: selectedCell.bgImage,
                    borderRadius: selectedCell.borderRadius,
                  };
                  setHasStyleClipboard(true);
                }}
                onPasteStyle={() => {
                  if (Object.keys(styleClipboardRef.current).length > 0) {
                    dispatch({
                      type: "UPDATE_CELL",
                      payload: { id: selectedCell.id, updates: styleClipboardRef.current },
                    });
                  }
                }}
                hasStyleClipboard={hasStyleClipboard}
                recentColors={recentColorsRef.current}
              />
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[13px] font-semibold text-cream">Cell</p>
                <StatusBanner variant="info">
                  Click a cell on the canvas to edit its properties
                </StatusBanner>
              </div>
            )}
          </div>

          {/* Sidebar footer */}
          <div className="shrink-0 h-px bg-rim" aria-hidden="true" />
          <div className="shrink-0 px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] text-sand/40">© {new Date().getFullYear()} Lintel</span>
            <span className="text-[11px] text-sand/40">v0.1.0</span>
          </div>
        </aside>

        {/* Main */}
        <main
          id="main-content"
          className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden"
        >
          {/* Canvas area — always full width beneath the overlay */}
          <div className="flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-auto p-5">
            {selectedCell && (selectedCell.blocks?.length ?? 0) > 0 && !isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden mb-3 flex w-full items-center justify-between gap-2 rounded-lg border border-purple-500/50 bg-purple-500/15 px-4 py-3 text-sm font-medium text-purple-300 shadow-sm shadow-purple-900/20 active:scale-[0.98] active:bg-purple-500/25 transition-all shrink-0"
              >
                <span className="flex items-center gap-2.5">
                  {/* Pulsing dot indicator */}
                  <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-400" />
                  </span>
                  <PanelLeftOpen size={15} aria-hidden="true" />
                  Edit block styles
                </span>
                <span className="rounded-md bg-purple-500/25 px-2 py-0.5 text-xs font-semibold tracking-wide uppercase text-purple-200">
                  Open Controls →
                </span>
              </button>
            )}
            {/* Bulk action bar — shown when 2+ cells are multi-selected */}
            {selectedCellIds.length > 1 && (
              <div className="mb-3 flex shrink-0 items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
                <span className="text-xs font-semibold text-amber-300">{selectedCellIds.length} cells selected</span>
                <div className="flex-1" />
                <label className="flex items-center gap-1.5 text-xs text-amber-300/80">
                  <span>Color:</span>
                  <input
                    type="color"
                    defaultValue="#1e1b4b"
                    onChange={(e) => dispatch({ type: "BULK_SET_BG_COLOR", payload: e.target.value })}
                    className="h-6 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label="Bulk background color"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "BULK_DELETE_CELLS" })}
                  className="rounded-lg border border-red-500/40 bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/25"
                >
                  Delete all
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "CLEAR_MULTI_SELECT" })}
                  aria-label="Clear multi-selection"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-amber-300/60 transition-colors hover:bg-amber-500/15 hover:text-amber-300"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            )}

            <BentoGrid
              config={config}
              selectedCellId={selectedCellId}
              selectedCellIds={selectedCellIds}
              colHoverDelta={colHoverDelta}
              rowHoverDelta={rowHoverDelta}
              gridRef={gridRef}
              onSelectCell={(id) =>
                dispatch({ type: "SELECT_CELL", payload: id })
              }
              onMultiSelectCell={(id) =>
                dispatch({ type: "SELECT_MULTI_CELL", payload: id })
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
              onAddBlock={(cellId, block) => {
                dispatch({ type: "ADD_BLOCK", payload: { cellId, block } });
                setIsSidebarOpen(true);
              }}
              canAddCell={canAddCell}
            />
          </div>

          {/* Import JSON modal */}
          {showImport && (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={(e) => { if (e.target === e.currentTarget) setShowImport(false); }}
            >
              <div className="w-full max-w-lg rounded-xl border border-rim bg-surface shadow-2xl shadow-black/60">
                <div className="flex items-center justify-between border-b border-rim px-4 py-3">
                  <span className="text-sm font-semibold text-cream">Import JSON</span>
                  <button
                    type="button"
                    onClick={() => setShowImport(false)}
                    aria-label="Close import dialog"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover/60 hover:text-cream/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
                <div className="flex flex-col gap-3 p-4">
                  <p className="text-xs text-muted">Paste a Lintel JSON config below. This will replace your current layout.</p>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={'{\n  "grid": { "cols": 4, "rows": 3, "gap": 4 },\n  "cells": [...]\n}'}
                    rows={8}
                    className="w-full resize-y rounded-lg border border-rim bg-canvas px-3 py-2 font-mono text-xs text-cream placeholder:text-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                    aria-label="JSON input"
                  />
                  {importError && (
                    <StatusBanner variant="error" aria-live="assertive">{importError}</StatusBanner>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImport(false)}
                      className="rounded-lg border border-rim/60 bg-surface-hi px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-hover/60 hover:text-cream/90"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleImport}
                      className="rounded-lg border-0 bg-accent px-3 py-1.5 text-xs font-semibold text-canvas transition-colors hover:bg-accent/90"
                    >
                      Import
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dim backdrop — sits between canvas and export panel */}
          <div
            aria-hidden="true"
            onClick={() => setShowExport(false)}
            className={[
              "absolute inset-0 z-10 bg-black/65",
              "transition-opacity duration-300 ease-in-out",
              showExport ? "opacity-100" : "opacity-0 pointer-events-none",
            ].join(" ")}
          />

          {/* Export panel — overlay, always in DOM so transition plays */}
          <aside
            aria-label="Export panel"
            aria-hidden={!showExport}
            className={[
              "absolute inset-y-0 right-0 z-20 flex w-full md:w-[480px] lg:w-[680px] flex-col overflow-hidden border-l border-rim bg-surface",
              "shadow-[-8px_0_32px_rgba(0,0,0,0.45)]",
              "transition-transform duration-300 ease-in-out",
              showExport ? "translate-x-0" : "translate-x-full pointer-events-none",
            ].join(" ")}
          >
            {/* Panel header */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-rim px-4">
              <div className="flex items-center gap-2">
                <Code2 size={15} className="text-muted" aria-hidden="true" />
                <span className="text-sm font-medium text-cream">Export</span>
              </div>
              <button
                type="button"
                onClick={() => setShowExport(false)}
                aria-label="Close export panel"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover/60 hover:text-cream/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            {/* Code output */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <CodeOutput
                htmlCode={generatedHTML}
                standaloneCode={generatedStandalone}
                jsxCode={generatedJSX}
                jsonCode={generatedJSON}
                gridRef={gridRef}
                panelMode
              />
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
