import type { BentoCell, BentoConfig } from "./types";

export function isCellOccupied(
  col: number,
  row: number,
  cells: BentoCell[],
  excludeId?: string,
): boolean {
  return cells.some(
    (cell) =>
      cell.id !== excludeId &&
      col >= cell.colStart &&
      col < cell.colStart + cell.colSpan &&
      row >= cell.rowStart &&
      row < cell.rowStart + cell.rowSpan,
  );
}

export function hasOverlap(
  proposed: BentoCell,
  cells: BentoCell[],
): boolean {
  return cells.some(
    (c) =>
      c.id !== proposed.id &&
      proposed.colStart < c.colStart + c.colSpan &&
      proposed.colStart + proposed.colSpan > c.colStart &&
      proposed.rowStart < c.rowStart + c.rowSpan &&
      proposed.rowStart + proposed.rowSpan > c.rowStart,
  );
}

export function findNextPosition(
  config: BentoConfig,
): { colStart: number; rowStart: number } | null {
  const { grid, cells } = config;
  for (let row = 1; row <= grid.rows; row++) {
    for (let col = 1; col <= grid.cols; col++) {
      if (!isCellOccupied(col, row, cells)) {
        return { colStart: col, rowStart: row };
      }
    }
  }
  return null;
}

export function getEmptyPositions(
  config: BentoConfig,
): Array<{ col: number; row: number }> {
  const { grid, cells } = config;
  const empty: Array<{ col: number; row: number }> = [];
  for (let row = 1; row <= grid.rows; row++) {
    for (let col = 1; col <= grid.cols; col++) {
      if (!isCellOccupied(col, row, cells)) {
        empty.push({ col, row });
      }
    }
  }
  return empty;
}

export function clampCell(
  cell: BentoCell,
  grid: { cols: number; rows: number },
): BentoCell {
  const colStart = Math.max(1, Math.min(cell.colStart, grid.cols));
  const rowStart = Math.max(1, Math.min(cell.rowStart, grid.rows));
  const colSpan = Math.max(1, Math.min(cell.colSpan, grid.cols - colStart + 1));
  const rowSpan = Math.max(1, Math.min(cell.rowSpan, grid.rows - rowStart + 1));
  return { ...cell, colStart, rowStart, colSpan, rowSpan };
}

export function generateId(): string {
  return `cell-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function findAdjacentCell(
  cells: BentoCell[],
  selectedId: string,
  direction: "left" | "right" | "up" | "down",
): string | null {
  const selected = cells.find((c) => c.id === selectedId);
  if (!selected) return null;

  let candidates: BentoCell[];

  switch (direction) {
    case "right":
      candidates = cells
        .filter((c) => c.colStart > selected.colStart)
        .sort((a, b) =>
          a.colStart !== b.colStart
            ? a.colStart - b.colStart
            : Math.abs(a.rowStart - selected.rowStart) - Math.abs(b.rowStart - selected.rowStart),
        );
      break;
    case "left":
      candidates = cells
        .filter((c) => c.colStart < selected.colStart)
        .sort((a, b) =>
          a.colStart !== b.colStart
            ? b.colStart - a.colStart
            : Math.abs(a.rowStart - selected.rowStart) - Math.abs(b.rowStart - selected.rowStart),
        );
      break;
    case "down":
      candidates = cells
        .filter((c) => c.rowStart > selected.rowStart)
        .sort((a, b) =>
          a.rowStart !== b.rowStart
            ? a.rowStart - b.rowStart
            : Math.abs(a.colStart - selected.colStart) - Math.abs(b.colStart - selected.colStart),
        );
      break;
    case "up":
      candidates = cells
        .filter((c) => c.rowStart < selected.rowStart)
        .sort((a, b) =>
          a.rowStart !== b.rowStart
            ? b.rowStart - a.rowStart
            : Math.abs(a.colStart - selected.colStart) - Math.abs(b.colStart - selected.colStart),
        );
      break;
    default:
      candidates = [];
  }

  return candidates[0]?.id ?? null;
}

export const GAP_PX: Record<number, number> = {
  0: 0,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
};
