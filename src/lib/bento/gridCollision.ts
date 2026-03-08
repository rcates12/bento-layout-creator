import type { GridConfig } from "./types";

export function pointerToGridPosition(
  pointer: { x: number; y: number },
  gridRect: DOMRect,
  grid: GridConfig,
  gapPx: number,
): { colStart: number; rowStart: number } {
  const usableWidth = gridRect.width - (grid.cols - 1) * gapPx;
  const usableHeight = gridRect.height - (grid.rows - 1) * gapPx;
  const cellW = usableWidth / grid.cols;
  const cellH = usableHeight / grid.rows;

  const relX = pointer.x - gridRect.left;
  const relY = pointer.y - gridRect.top;

  // Each "slot" is cellW + gapPx wide (except the last column has no trailing gap)
  const col = Math.max(1, Math.min(grid.cols, Math.floor(relX / (cellW + gapPx)) + 1));
  const row = Math.max(1, Math.min(grid.rows, Math.floor(relY / (cellH + gapPx)) + 1));

  return { colStart: col, rowStart: row };
}
