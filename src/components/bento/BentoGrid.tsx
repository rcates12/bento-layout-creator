"use client";

import { useRef, useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragMoveEvent, DragEndEvent } from "@dnd-kit/core";

import { BentoCell, BentoCellOverlay } from "./BentoCell";
import { StatusBanner } from "./StatusBanner";
import { Button } from "@/components/ui/button";
import type { BentoCell as BentoCellType, BentoConfig, ContentBlock } from "@/lib/bento/types";
import { GAP_PX, getEmptyPositions, hasOverlap } from "@/lib/bento/utils";
import { pointerToGridPosition } from "@/lib/bento/gridCollision";

// ─── Ghost tile ───────────────────────────────────────────────────────────────

function GhostTile({
  col,
  row,
  onAdd,
}: {
  col: number;
  row: number;
  onAdd: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onAdd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label={`Add cell at column ${col}, row ${row}`}
      style={{ gridColumn: col, gridRow: row }}
      className={[
        "h-full w-full flex items-center justify-center rounded-xl border border-dashed",
        "transition-all duration-150 outline-none cursor-pointer",
        "focus-visible:border-white/50 focus-visible:bg-white/10 focus-visible:opacity-100",
        hovered
          ? "border-white/40 bg-white/5 opacity-100"
          : "border-white/15 opacity-0",
      ].join(" ")}
    >
      {hovered && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      )}
    </button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResizeState {
  cellId: string;
  startX: number;
  startY: number;
  startColSpan: number;
  startRowSpan: number;
  currentColSpan: number;
  currentRowSpan: number;
}

interface DragPreview {
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  isValid: boolean;
}

interface BentoGridProps {
  config: BentoConfig;
  selectedCellId: string | null;
  selectedCellIds?: string[];
  onSelectCell: (id: string | null) => void;
  onMultiSelectCell?: (id: string) => void;
  onAddCell: () => void;
  onAddCellAt: (col: number, row: number) => void;
  onMoveCell: (id: string, colStart: number, rowStart: number) => void;
  onUpdateCell: (id: string, updates: Partial<BentoCellType>) => void;
  onDeleteCell: (id: string) => void;
  onAddBlock: (cellId: string, block: ContentBlock) => void;
  canAddCell: boolean;
  colHoverDelta?: 1 | -1 | null;
  rowHoverDelta?: 1 | -1 | null;
  gridRef?: React.RefObject<HTMLDivElement | null>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BentoGrid({
  config,
  selectedCellId,
  selectedCellIds = [],
  onSelectCell,
  onMultiSelectCell,
  onAddCell,
  onAddCellAt,
  onMoveCell,
  onUpdateCell,
  onDeleteCell,
  onAddBlock,
  canAddCell,
  colHoverDelta,
  rowHoverDelta,
  gridRef: externalGridRef,
}: BentoGridProps) {
  const { grid, cells } = config;
  const gapPx = GAP_PX[grid.gap] ?? grid.gap * 4;
  const internalGridRef = useRef<HTMLDivElement>(null);
  const gridRef = externalGridRef ?? internalGridRef;

  // Drag state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);

  // Resize state
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  // Empty grid positions for ghost tiles
  const emptyPositions = useMemo(() => getEmptyPositions(config), [config]);

  // dnd-kit sensors — pointer requires 6px movement; touch uses 200ms press-and-hold
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  // Active dragging cell (for DragOverlay)
  const activeDragCell = activeDragId
    ? cells.find((c) => c.id === activeDragId) ?? null
    : null;
  const activeDragIndex = activeDragId
    ? cells.findIndex((c) => c.id === activeDragId)
    : -1;

  // Preview grid dimensions (expand by 1 when hovering add button)
  const previewCols = grid.cols + (colHoverDelta === 1 ? 1 : 0);
  const previewRows = grid.rows + (rowHoverDelta === 1 ? 1 : 0);

  // ─── Drag handlers ──────────────────────────────────────────────────────────

  function handleDragStart({ active }: { active: { id: string | number } }) {
    setActiveDragId(String(active.id));
  }

  function handleDragMove({ active, delta }: DragMoveEvent) {
    if (!gridRef.current) return;
    const cellId = String(active.id);
    const cell = cells.find((c) => c.id === cellId);
    if (!cell) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const initialRect = active.rect.current.initial;
    if (!initialRect) return;

    const currentX = initialRect.left + initialRect.width / 2 + delta.x;
    const currentY = initialRect.top + initialRect.height / 2 + delta.y;

    const { colStart: rawCol, rowStart: rawRow } = pointerToGridPosition(
      { x: currentX, y: currentY },
      gridRect,
      grid,
      gapPx,
    );

    const newCol = Math.max(1, Math.min(rawCol, grid.cols - cell.colSpan + 1));
    const newRow = Math.max(1, Math.min(rawRow, grid.rows - cell.rowSpan + 1));

    const proposed: BentoCellType = { ...cell, colStart: newCol, rowStart: newRow };
    const otherCells = cells.filter((c) => c.id !== cellId);
    const conflicting = otherCells.filter((c) => hasOverlap(proposed, [c]));

    const isValid = conflicting.length === 0 || conflicting.length === 1;

    setDragPreview({
      colStart: newCol,
      rowStart: newRow,
      colSpan: cell.colSpan,
      rowSpan: cell.rowSpan,
      isValid,
    });
  }

  function handleDragEnd({ active }: DragEndEvent) {
    const cellId = String(active.id);
    if (dragPreview && dragPreview.isValid) {
      onMoveCell(cellId, dragPreview.colStart, dragPreview.rowStart);
    }
    setActiveDragId(null);
    setDragPreview(null);
  }

  function handleDragCancel() {
    setActiveDragId(null);
    setDragPreview(null);
  }

  // ─── Resize handlers ─────────────────────────────────────────────────────────

  function handleResizeStart(e: React.PointerEvent, cellId: string) {
    const cell = cells.find((c) => c.id === cellId);
    if (!cell) return;
    setResizeState({
      cellId,
      startX: e.clientX,
      startY: e.clientY,
      startColSpan: cell.colSpan,
      startRowSpan: cell.rowSpan,
      currentColSpan: cell.colSpan,
      currentRowSpan: cell.rowSpan,
    });
  }

  function handleResizeMove(e: React.PointerEvent) {
    if (!resizeState || !gridRef.current) return;
    const cell = cells.find((c) => c.id === resizeState.cellId);
    if (!cell) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const cellW = (gridRect.width - (grid.cols - 1) * gapPx) / grid.cols;
    const cellH = (gridRect.height - (grid.rows - 1) * gapPx) / grid.rows;

    const deltaX = e.clientX - resizeState.startX;
    const deltaY = e.clientY - resizeState.startY;

    const newColSpan = Math.max(
      1,
      Math.min(
        grid.cols - cell.colStart + 1,
        resizeState.startColSpan + Math.round(deltaX / (cellW + gapPx)),
      ),
    );
    const newRowSpan = Math.max(
      1,
      Math.min(
        grid.rows - cell.rowStart + 1,
        resizeState.startRowSpan + Math.round(deltaY / (cellH + gapPx)),
      ),
    );

    const proposed: BentoCellType = {
      ...cell,
      colSpan: newColSpan,
      rowSpan: newRowSpan,
    };
    const otherCells = cells.filter((c) => c.id !== resizeState.cellId);

    if (!hasOverlap(proposed, otherCells)) {
      setResizeState((prev) =>
        prev ? { ...prev, currentColSpan: newColSpan, currentRowSpan: newRowSpan } : null,
      );
    }
  }

  function handleResizeEnd(_e: React.PointerEvent) {
    if (!resizeState) return;
    onUpdateCell(resizeState.cellId, {
      colSpan: resizeState.currentColSpan,
      rowSpan: resizeState.currentRowSpan,
    });
    setResizeState(null);
  }

  function getEffectiveCell(cell: BentoCellType): BentoCellType {
    if (resizeState?.cellId === cell.id) {
      return {
        ...cell,
        colSpan: resizeState.currentColSpan,
        rowSpan: resizeState.currentRowSpan,
      };
    }
    return cell;
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex w-full flex-col gap-4">
        {/* Canvas */}
        <div
          className="grain-texture dot-bg w-full overflow-hidden rounded-2xl border border-rim bg-canvas p-4 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) onSelectCell(null);
          }}
        >
          {cells.length === 0 ? (
            /* Empty state */
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-rim"
                aria-hidden="true"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-ghost"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-cream">No cells yet</p>
                <p className="mt-1 text-xs text-muted">
                  Click a ghost tile or use the button below to add your first cell
                </p>
              </div>
              <Button
                onClick={onAddCell}
                className="mt-1 border-transparent bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)] hover:opacity-90 hover:shadow-[0_4px_18px_rgba(124,58,237,0.5)]"
              >
                Add First Cell
              </Button>
            </div>
          ) : (
            <div
              ref={gridRef}
              role="grid"
              aria-label="Bento layout preview"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${previewCols}, 1fr)`,
                gridTemplateRows: `repeat(${previewRows}, minmax(80px, 1fr))`,
                gap: `${gapPx}px`,
                minHeight: "360px",
                position: "relative",
              }}
            >
              {/* Ghost tiles for empty positions */}
              {emptyPositions.map(({ col, row }) => (
                <GhostTile
                  key={`ghost-${col}-${row}`}
                  col={col}
                  row={row}
                  onAdd={() => onAddCellAt(col, row)}
                />
              ))}

              {/* Col/row add preview — ghost stripe for new column or row */}
              {colHoverDelta === 1 && (
                <div
                  aria-hidden="true"
                  style={{
                    gridColumn: grid.cols + 1,
                    gridRow: `1 / -1`,
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                  className="animate-pulse rounded-xl border-2 border-dashed border-accent/50 bg-accent/8"
                />
              )}
              {colHoverDelta === -1 && grid.cols > 1 && (
                <div
                  aria-hidden="true"
                  style={{
                    gridColumn: grid.cols,
                    gridRow: `1 / -1`,
                    zIndex: 6,
                    pointerEvents: "none",
                  }}
                  className="rounded-xl bg-red-500/15 ring-2 ring-inset ring-red-500/30"
                />
              )}
              {rowHoverDelta === 1 && (
                <div
                  aria-hidden="true"
                  style={{
                    gridColumn: `1 / span ${grid.cols}`,
                    gridRow: grid.rows + 1,
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                  className="animate-pulse rounded-xl border-2 border-dashed border-accent/50 bg-accent/8"
                />
              )}
              {rowHoverDelta === -1 && grid.rows > 1 && (
                <div
                  aria-hidden="true"
                  style={{
                    gridColumn: `1 / span ${grid.cols}`,
                    gridRow: grid.rows,
                    zIndex: 6,
                    pointerEvents: "none",
                  }}
                  className="rounded-xl bg-red-500/15 ring-2 ring-inset ring-red-500/30"
                />
              )}

              {/* Drop zone preview */}
              {activeDragId && dragPreview && (
                <div
                  aria-hidden="true"
                  style={{
                    gridColumn: `${dragPreview.colStart} / span ${dragPreview.colSpan}`,
                    gridRow: `${dragPreview.rowStart} / span ${dragPreview.rowSpan}`,
                    zIndex: 5,
                    pointerEvents: "none",
                  }}
                  className={[
                    "rounded-2xl border-2 transition-colors duration-75",
                    dragPreview.isValid
                      ? "border-accent/60 bg-accent/10"
                      : "border-red-500/50 bg-red-500/10",
                  ].join(" ")}
                />
              )}

              {/* Cells */}
              {cells.map((cell, index) => {
                let hudLabel: string | undefined;
                if (resizeState?.cellId === cell.id) {
                  hudLabel = `${resizeState.currentColSpan}×${resizeState.currentRowSpan}`;
                } else if (activeDragId === cell.id && dragPreview) {
                  hudLabel = `${dragPreview.colSpan}×${dragPreview.rowSpan}`;
                }
                return (
                  <BentoCell
                    key={cell.id}
                    cell={getEffectiveCell(cell)}
                    index={index}
                    isSelected={selectedCellId === cell.id}
                    isMultiSelected={selectedCellIds.includes(cell.id)}
                    isDraggingActive={activeDragId === cell.id}
                    hudLabel={hudLabel}
                    onClick={(e) => {
                      if (e.shiftKey && onMultiSelectCell) {
                        onMultiSelectCell(cell.id);
                      } else {
                        onSelectCell(selectedCellId === cell.id ? null : cell.id);
                      }
                    }}
                    onDelete={() => onDeleteCell(cell.id)}
                    onAddBlock={(block) => {
                      onSelectCell(cell.id);
                      onAddBlock(cell.id, block);
                    }}
                    onResizeStart={(e) => handleResizeStart(e, cell.id)}
                    onResizeMove={handleResizeMove}
                    onResizeEnd={handleResizeEnd}
                    onScrollResize={(colDelta, rowDelta) => {
                      const effective = getEffectiveCell(cell);
                      const newColSpan = Math.max(
                        1,
                        Math.min(grid.cols - effective.colStart + 1, effective.colSpan + colDelta),
                      );
                      const newRowSpan = Math.max(
                        1,
                        Math.min(grid.rows - effective.rowStart + 1, effective.rowSpan + rowDelta),
                      );
                      onUpdateCell(cell.id, { colSpan: newColSpan, rowSpan: newRowSpan });
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Canvas hint bar */}
        <p className="text-center text-[11px] text-muted/50">
          Click ghost tile to add · Drag handle to move · Corner handle to resize · Scroll on selected cell to resize
        </p>

        {/* Add cell button */}
        {cells.length > 0 && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onAddCell}
              disabled={!canAddCell}
              aria-label="Add a new cell to the grid"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Add Cell
            </Button>

            {!canAddCell && (
              <StatusBanner variant="warning">
                Grid is full — expand rows or columns to add more cells
              </StatusBanner>
            )}
          </div>
        )}
      </div>

      {/* Drag overlay — floats at cursor during drag */}
      <DragOverlay dropAnimation={null}>
        {activeDragCell ? (
          <BentoCellOverlay
            cell={activeDragCell}
            index={activeDragIndex}
            hudLabel={dragPreview ? `${dragPreview.colSpan}×${dragPreview.rowSpan}` : undefined}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
