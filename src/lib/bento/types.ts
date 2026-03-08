export interface GridConfig {
  cols: number; // 1–12
  rows: number; // 1–12
  gap: number;  // Tailwind gap unit (0, 2, 3, 4, 6, 8)
}

export type BorderRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
export type ShadowLevel = "none" | "sm" | "md" | "lg" | "xl";

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

export type ContentBlock = TextBlock | ImageBlock | ButtonBlock;

// ─── Cell ─────────────────────────────────────────────────────────────────

export interface BentoCell {
  id: string;
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  label: string;
  bgColor?: string;
  bgImage?: string;
  blocks?: ContentBlock[];
  borderRadius?: BorderRadius;
}

export interface BentoConfig {
  grid: GridConfig;
  cells: BentoCell[];
}
