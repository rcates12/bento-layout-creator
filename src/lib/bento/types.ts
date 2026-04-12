export interface GridConfig {
  cols: number; // 1–12
  rows: number; // 1–12
  gap: number;  // Tailwind gap unit (0, 2, 3, 4, 6, 8)
}

export type BorderRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
export type ShadowLevel = "none" | "sm" | "md" | "lg" | "xl";

// ─── Gradient ──────────────────────────────────────────────────────────────

export interface GradientConfig {
  type: "linear";
  angle: number;    // 0–360 degrees
  stops: [string, string]; // two hex colors
}

// ─── Cell animation ────────────────────────────────────────────────────────

export type CellAnimation = "none" | "fade-in" | "slide-up" | "slide-right" | "pop";

// ─── Content block types ───────────────────────────────────────────────────

export type FontSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
export type FontWeight = "normal" | "medium" | "semibold" | "bold";
export type LetterSpacing = "tighter" | "tight" | "normal" | "wide" | "wider" | "widest";
export type LineHeight = "none" | "tight" | "snug" | "normal" | "relaxed" | "loose";
export type TextAlign = "left" | "center" | "right";

export interface TextBlock {
  id: string;
  type: "text";
  text: string;
  fontSize?: FontSize;
  fontWeight?: FontWeight;
  color?: string;
  tracking?: LetterSpacing;
  leading?: LineHeight;
  align?: TextAlign;
}

export interface ImageBlock {
  id: string;
  type: "image";
  src?: string;
  alt?: string;
  fit?: "cover" | "contain";
  borderRadius?: BorderRadius;
  shadow?: ShadowLevel;
  borderWidth?: number; // 0–4 px
  borderColor?: string;
}

export interface ButtonBlock {
  id: string;
  type: "button";
  label: string;
  variant?: "solid" | "outline" | "ghost";
  bgColor?: string;
  textColor?: string;
  size?: "sm" | "md" | "lg";
  borderRadius?: BorderRadius;
  fullWidth?: boolean;
}

export interface StatBlock {
  id: string;
  type: "stat";
  value: string;       // e.g. "42K"
  label?: string;      // e.g. "Monthly Users"
  prefix?: string;     // e.g. "$"
  suffix?: string;     // e.g. "%"
  valueColor?: string;
  labelColor?: string;
}

export type ContentBlock = TextBlock | ImageBlock | ButtonBlock | StatBlock;

// ─── Cell ─────────────────────────────────────────────────────────────────

export interface BentoCell {
  id: string;
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  label: string;
  bgColor?: string;
  bgGradient?: GradientConfig;
  bgImage?: string;
  blocks?: ContentBlock[];
  borderRadius?: BorderRadius;
  borderWidth?: number;  // 0–4 px
  borderColor?: string;  // hex
  shadow?: ShadowLevel;
  padding?: "none" | "sm" | "md" | "lg";
  contentAlign?: "start" | "center" | "end";
  animation?: CellAnimation;
}

export interface BentoConfig {
  grid: GridConfig;
  cells: BentoCell[];
}
