export interface CellColor {
  name: string;
  hex: string;
}

// Modern palette — rich darks, mids, and light pastels that work on any canvas
export const EARTH_TONES: CellColor[] = [
  // Dark & moody
  { name: "Ink",       hex: "#18181b" },   // zinc-900
  { name: "Navy",      hex: "#0f172a" },   // slate-950
  { name: "Indigo",    hex: "#1e1b4b" },   // indigo-950
  { name: "Violet",    hex: "#2e1065" },   // violet-950
  // Mid tones
  { name: "Slate",     hex: "#334155" },   // slate-700
  { name: "Indigo 700",hex: "#3730a3" },   // indigo-700
  { name: "Violet 700",hex: "#6d28d9" },   // violet-700
  { name: "Sky",       hex: "#0369a1" },   // sky-700
  // Light & airy (great for light-mode bento)
  { name: "Pearl",     hex: "#f8fafc" },   // slate-50
  { name: "Lavender",  hex: "#ede9fe" },   // violet-100
  { name: "Ice",       hex: "#f0f9ff" },   // sky-50
  { name: "Mint",      hex: "#f0fdf4" },   // green-50
];

export const DEFAULT_CELL_BG = "#000000";

// Neutral placeholder that works on both light and dark canvas
export const PLACEHOLDER_IMAGE = "https://placehold.co/800x600/18181b/a1a1aa?text=+";

export const INITIAL_CELL_COLORS: Record<string, string> = {
  "cell-a": "#000000",
  "cell-b": "#000000",
  "cell-c": "#000000",
  "cell-d": "#000000",
  "cell-e": "#000000",
};
