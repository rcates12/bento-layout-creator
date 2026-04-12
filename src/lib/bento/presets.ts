import type { BentoConfig } from "./types";

// ─── Custom preset storage ────────────────────────────────────────────────────

const CUSTOM_PRESETS_KEY = "bento-custom-presets-v1";

export function loadCustomPresets(): BentoPreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    return raw ? (JSON.parse(raw) as BentoPreset[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomPresets(presets: BentoPreset[]): void {
  try {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // ignore storage errors
  }
}

export interface BentoPreset {
  id: string;
  name: string;
  description: string;
  config: BentoConfig;
  isRegular?: boolean; // special: fills current grid with 1×1 cells
}

// ─── Preset Definitions ───────────────────────────────────────────────────────

export const PRESETS: BentoPreset[] = [
  // ── Row 1 ──────────────────────────────────────────────────────────────────
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Hero + stats + banner",
    config: {
      grid: { cols: 4, rows: 3, gap: 4 },
      cells: [
        { id: "p1-a", colStart: 1, rowStart: 1, colSpan: 2, rowSpan: 2, label: "Hero",    bgColor: "#1e1b4b" },
        { id: "p1-b", colStart: 3, rowStart: 1, colSpan: 1, rowSpan: 2, label: "Feature", bgColor: "#2e1065" },
        { id: "p1-c", colStart: 4, rowStart: 1, colSpan: 1, rowSpan: 1, label: "Stat",    bgColor: "#0369a1" },
        { id: "p1-d", colStart: 4, rowStart: 2, colSpan: 1, rowSpan: 1, label: "Stat",    bgColor: "#3730a3" },
        { id: "p1-e", colStart: 1, rowStart: 3, colSpan: 4, rowSpan: 1, label: "Banner",  bgColor: "#0f172a" },
      ],
    },
  },
  {
    id: "magazine",
    name: "Magazine",
    description: "Large story with sidebar",
    config: {
      grid: { cols: 4, rows: 3, gap: 4 },
      cells: [
        { id: "p2-a", colStart: 1, rowStart: 1, colSpan: 3, rowSpan: 2, label: "Cover",   bgColor: "#1e1b4b" },
        { id: "p2-b", colStart: 4, rowStart: 1, colSpan: 1, rowSpan: 3, label: "Sidebar", bgColor: "#0f172a" },
        { id: "p2-c", colStart: 1, rowStart: 3, colSpan: 2, rowSpan: 1, label: "Story",   bgColor: "#2e1065" },
        { id: "p2-d", colStart: 3, rowStart: 3, colSpan: 1, rowSpan: 1, label: "Tag",     bgColor: "#3730a3" },
      ],
    },
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Hero + tall column + grid",
    config: {
      grid: { cols: 3, rows: 4, gap: 4 },
      cells: [
        { id: "p3-a", colStart: 1, rowStart: 1, colSpan: 2, rowSpan: 2, label: "Hero",   bgColor: "#1e1b4b" },
        { id: "p3-b", colStart: 3, rowStart: 1, colSpan: 1, rowSpan: 3, label: "Tall",   bgColor: "#2e1065" },
        { id: "p3-c", colStart: 1, rowStart: 3, colSpan: 1, rowSpan: 1, label: "Card",   bgColor: "#0369a1" },
        { id: "p3-d", colStart: 2, rowStart: 3, colSpan: 1, rowSpan: 1, label: "Card",   bgColor: "#3730a3" },
        { id: "p3-e", colStart: 1, rowStart: 4, colSpan: 3, rowSpan: 1, label: "Footer", bgColor: "#0f172a" },
      ],
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Four equal cells",
    config: {
      grid: { cols: 2, rows: 2, gap: 4 },
      cells: [
        { id: "p4-a", colStart: 1, rowStart: 1, colSpan: 1, rowSpan: 1, label: "One",   bgColor: "#1e1b4b" },
        { id: "p4-b", colStart: 2, rowStart: 1, colSpan: 1, rowSpan: 1, label: "Two",   bgColor: "#2e1065" },
        { id: "p4-c", colStart: 1, rowStart: 2, colSpan: 1, rowSpan: 1, label: "Three", bgColor: "#0369a1" },
        { id: "p4-d", colStart: 2, rowStart: 2, colSpan: 1, rowSpan: 1, label: "Four",  bgColor: "#3730a3" },
      ],
    },
  },
  {
    id: "feature",
    name: "Feature",
    description: "Large left + stacked right",
    config: {
      grid: { cols: 3, rows: 3, gap: 4 },
      cells: [
        { id: "p5-a", colStart: 1, rowStart: 1, colSpan: 2, rowSpan: 2, label: "Main", bgColor: "#1e1b4b" },
        { id: "p5-b", colStart: 3, rowStart: 1, colSpan: 1, rowSpan: 1, label: "Stat", bgColor: "#2e1065" },
        { id: "p5-c", colStart: 3, rowStart: 2, colSpan: 1, rowSpan: 1, label: "Stat", bgColor: "#0369a1" },
        { id: "p5-d", colStart: 1, rowStart: 3, colSpan: 1, rowSpan: 1, label: "Card", bgColor: "#3730a3" },
        { id: "p5-e", colStart: 2, rowStart: 3, colSpan: 1, rowSpan: 1, label: "Card", bgColor: "#0f172a" },
        { id: "p5-f", colStart: 3, rowStart: 3, colSpan: 1, rowSpan: 1, label: "Card", bgColor: "#6d28d9" },
      ],
    },
  },
  {
    id: "regular",
    name: "Regular",
    description: "Uniform grid — fills current dimensions",
    config: {
      grid: { cols: 4, rows: 3, gap: 4 },
      cells: [], // populated dynamically by FILL_REGULAR action
    },
    isRegular: true,
  },

  // ── Row 2 ──────────────────────────────────────────────────────────────────
  {
    id: "split",
    name: "Split",
    description: "Two equal tall columns",
    config: {
      grid: { cols: 2, rows: 3, gap: 4 },
      cells: [
        { id: "p7-a", colStart: 1, rowStart: 1, colSpan: 1, rowSpan: 3, label: "Left",  bgColor: "#1e1b4b" },
        { id: "p7-b", colStart: 2, rowStart: 1, colSpan: 1, rowSpan: 3, label: "Right", bgColor: "#0f172a" },
      ],
    },
  },
  {
    id: "triptych",
    name: "Triptych",
    description: "Three equal columns",
    config: {
      grid: { cols: 3, rows: 2, gap: 4 },
      cells: [
        { id: "p8-a", colStart: 1, rowStart: 1, colSpan: 1, rowSpan: 2, label: "Col A", bgColor: "#1e1b4b" },
        { id: "p8-b", colStart: 2, rowStart: 1, colSpan: 1, rowSpan: 2, label: "Col B", bgColor: "#2e1065" },
        { id: "p8-c", colStart: 3, rowStart: 1, colSpan: 1, rowSpan: 2, label: "Col C", bgColor: "#0f172a" },
      ],
    },
  },
  {
    id: "spotlight",
    name: "Spotlight",
    description: "Large hero + small companions",
    config: {
      grid: { cols: 3, rows: 3, gap: 4 },
      cells: [
        { id: "p9-a", colStart: 1, rowStart: 1, colSpan: 2, rowSpan: 2, label: "Hero",  bgColor: "#1e1b4b" },
        { id: "p9-b", colStart: 3, rowStart: 1, colSpan: 1, rowSpan: 1, label: "Card",  bgColor: "#2e1065" },
        { id: "p9-c", colStart: 3, rowStart: 2, colSpan: 1, rowSpan: 1, label: "Card",  bgColor: "#3730a3" },
        { id: "p9-d", colStart: 1, rowStart: 3, colSpan: 1, rowSpan: 1, label: "Card",  bgColor: "#0369a1" },
        { id: "p9-e", colStart: 2, rowStart: 3, colSpan: 1, rowSpan: 1, label: "Card",  bgColor: "#0f172a" },
        { id: "p9-f", colStart: 3, rowStart: 3, colSpan: 1, rowSpan: 1, label: "Card",  bgColor: "#6d28d9" },
      ],
    },
  },
  {
    id: "asymmetric",
    name: "Asymmetric",
    description: "Tall left column + content blocks",
    config: {
      grid: { cols: 4, rows: 3, gap: 4 },
      cells: [
        { id: "pa-a", colStart: 1, rowStart: 1, colSpan: 1, rowSpan: 3, label: "Rail",  bgColor: "#0f172a" },
        { id: "pa-b", colStart: 2, rowStart: 1, colSpan: 3, rowSpan: 1, label: "Wide",  bgColor: "#1e1b4b" },
        { id: "pa-c", colStart: 2, rowStart: 2, colSpan: 1, rowSpan: 1, label: "Stat",  bgColor: "#2e1065" },
        { id: "pa-d", colStart: 3, rowStart: 2, colSpan: 1, rowSpan: 1, label: "Stat",  bgColor: "#3730a3" },
        { id: "pa-e", colStart: 4, rowStart: 2, colSpan: 1, rowSpan: 1, label: "Stat",  bgColor: "#0369a1" },
        { id: "pa-f", colStart: 2, rowStart: 3, colSpan: 2, rowSpan: 1, label: "Block", bgColor: "#1e1b4b" },
        { id: "pa-g", colStart: 4, rowStart: 3, colSpan: 1, rowSpan: 1, label: "Tag",   bgColor: "#6d28d9" },
      ],
    },
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Banner + two blocks + footer",
    config: {
      grid: { cols: 4, rows: 4, gap: 4 },
      cells: [
        { id: "pb-a", colStart: 1, rowStart: 1, colSpan: 4, rowSpan: 1, label: "Header", bgColor: "#0f172a" },
        { id: "pb-b", colStart: 1, rowStart: 2, colSpan: 2, rowSpan: 2, label: "Main",   bgColor: "#1e1b4b" },
        { id: "pb-c", colStart: 3, rowStart: 2, colSpan: 2, rowSpan: 2, label: "Side",   bgColor: "#2e1065" },
        { id: "pb-d", colStart: 1, rowStart: 4, colSpan: 4, rowSpan: 1, label: "Footer", bgColor: "#0f172a" },
      ],
    },
  },
  {
    id: "mosaic",
    name: "Mosaic",
    description: "Irregular mixed-size blocks",
    config: {
      grid: { cols: 4, rows: 3, gap: 4 },
      cells: [
        { id: "pc-a", colStart: 1, rowStart: 1, colSpan: 1, rowSpan: 2, label: "Tall",  bgColor: "#1e1b4b" },
        { id: "pc-b", colStart: 2, rowStart: 1, colSpan: 2, rowSpan: 1, label: "Wide",  bgColor: "#2e1065" },
        { id: "pc-c", colStart: 4, rowStart: 1, colSpan: 1, rowSpan: 2, label: "Tall",  bgColor: "#0f172a" },
        { id: "pc-d", colStart: 2, rowStart: 2, colSpan: 1, rowSpan: 1, label: "Card",  bgColor: "#3730a3" },
        { id: "pc-e", colStart: 3, rowStart: 2, colSpan: 1, rowSpan: 1, label: "Card",  bgColor: "#0369a1" },
        { id: "pc-f", colStart: 1, rowStart: 3, colSpan: 2, rowSpan: 1, label: "Block", bgColor: "#0369a1" },
        { id: "pc-g", colStart: 3, rowStart: 3, colSpan: 2, rowSpan: 1, label: "Block", bgColor: "#3730a3" },
      ],
    },
  },
];
