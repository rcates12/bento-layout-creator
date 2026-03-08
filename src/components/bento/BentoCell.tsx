"use client";

import { useRef, useEffect, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Type, Image as ImageIcon, MousePointerClick } from "lucide-react";
import type {
  BentoCell as BentoCellType,
  BorderRadius,
  ContentBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
} from "@/lib/bento/types";
import { DEFAULT_CELL_BG, PLACEHOLDER_IMAGE } from "@/lib/bento/theme";
import { generateId } from "@/lib/bento/utils";

// ─── Radius mapping ───────────────────────────────────────────────────────────

const RADIUS_CLASSES: Record<BorderRadius, string> = {
  none: "rounded-none",
  sm:   "rounded-sm",
  md:   "rounded-md",
  lg:   "rounded-lg",
  xl:   "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

// ─── Text property → Tailwind class maps ──────────────────────────────────────

const FONT_SIZE_CLASSES: Record<string, string> = {
  xs: "text-xs", sm: "text-sm", base: "text-base",
  lg: "text-lg", xl: "text-xl", "2xl": "text-2xl", "3xl": "text-3xl",
};
const FONT_WEIGHT_CLASSES: Record<string, string> = {
  normal: "font-normal", medium: "font-medium",
  semibold: "font-semibold", bold: "font-bold",
};
const TRACKING_CLASSES: Record<string, string> = {
  tighter: "tracking-tighter", tight: "tracking-tight", normal: "tracking-normal",
  wide: "tracking-wide", wider: "tracking-wider", widest: "tracking-widest",
};
const LEADING_CLASSES: Record<string, string> = {
  none: "leading-none", tight: "leading-tight", snug: "leading-snug",
  normal: "leading-normal", relaxed: "leading-relaxed", loose: "leading-loose",
};
const ALIGN_CLASSES: Record<string, string> = {
  left: "text-left", center: "text-center", right: "text-right",
};
const BTN_SIZE_CLASSES: Record<string, string> = {
  sm: "px-3 py-1 text-xs", md: "px-4 py-1.5 text-sm", lg: "px-5 py-2 text-base",
};

// ─── Block renderers ──────────────────────────────────────────────────────────

function RenderTextBlock({ block }: { block: TextBlock }) {
  const cls = [
    FONT_SIZE_CLASSES[block.fontSize ?? "sm"] ?? "text-sm",
    FONT_WEIGHT_CLASSES[block.fontWeight ?? "normal"] ?? "font-normal",
    TRACKING_CLASSES[block.tracking ?? "normal"] ?? "tracking-normal",
    LEADING_CLASSES[block.leading ?? "normal"] ?? "leading-normal",
    ALIGN_CLASSES[block.align ?? "left"] ?? "text-left",
  ].join(" ");

  return (
    <p
      className={cls}
      style={block.color ? { color: block.color } : { color: "rgba(255,255,255,0.85)" }}
    >
      {block.text || <span className="opacity-30 italic">Text block</span>}
    </p>
  );
}

const IMAGE_SHADOW_STYLES: Record<string, string> = {
  none: "none",
  sm:   "0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.5)",
  md:   "0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5)",
  lg:   "0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)",
  xl:   "0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.6)",
};

const IMAGE_RADIUS_MAP: Record<string, string> = {
  none: "0px", sm: "4px", md: "8px", lg: "10px",
  xl: "14px", "2xl": "18px", full: "9999px",
};

function RenderImageBlock({ block }: { block: ImageBlock }) {
  const borderRadius = block.borderRadius ? IMAGE_RADIUS_MAP[block.borderRadius] : "0px";
  const boxShadow = IMAGE_SHADOW_STYLES[block.shadow ?? "none"] ?? "none";
  const wrapperStyle: React.CSSProperties = { borderRadius, boxShadow };

  if (block.borderWidth && block.borderWidth > 0) {
    wrapperStyle.border = `${block.borderWidth}px solid ${block.borderColor ?? "#ffffff"}`;
  }

  return (
    <div className="w-full overflow-hidden" style={wrapperStyle}>
      <img
        src={block.src ?? PLACEHOLDER_IMAGE}
        alt={block.alt ?? ""}
        className={[
          "h-full w-full",
          block.fit === "contain" ? "object-contain" : "object-cover",
        ].join(" ")}
        style={{ minHeight: "60px", maxHeight: "160px" }}
        loading="lazy"
      />
    </div>
  );
}

function RenderButtonBlock({ block }: { block: ButtonBlock }) {
  const radiusClass = RADIUS_CLASSES[block.borderRadius ?? "lg"];
  const sizeClass = BTN_SIZE_CLASSES[block.size ?? "md"] ?? BTN_SIZE_CLASSES.md;
  let variantStyle: React.CSSProperties = {};
  let variantClass = "";

  if (block.variant === "outline") {
    variantClass = "border border-current bg-transparent";
    variantStyle = { color: block.bgColor ?? "#ffffff" };
  } else if (block.variant === "ghost") {
    variantClass = "bg-transparent";
    variantStyle = { color: block.bgColor ?? "#ffffff" };
  } else {
    variantClass = "border-0";
    variantStyle = {
      backgroundColor: block.bgColor ?? "#ffffff",
      color: block.textColor ?? "#000000",
    };
  }

  return (
    <div className={block.fullWidth ? "w-full" : "inline-flex"}>
      <button
        type="button"
        tabIndex={-1}
        className={[
          radiusClass, sizeClass, variantClass,
          "font-medium transition-opacity pointer-events-none",
          block.fullWidth ? "w-full justify-center" : "",
        ].join(" ")}
        style={variantStyle}
      >
        {block.label || "Button"}
      </button>
    </div>
  );
}

function RenderBlock({ block }: { block: ContentBlock }) {
  if (block.type === "text") return <RenderTextBlock block={block} />;
  if (block.type === "image") return <RenderImageBlock block={block} />;
  if (block.type === "button") return <RenderButtonBlock block={block} />;
  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BentoCellProps {
  cell: BentoCellType;
  index: number;
  isSelected: boolean;
  isDraggingActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onResizeStart: (e: React.PointerEvent) => void;
  onResizeMove: (e: React.PointerEvent) => void;
  onResizeEnd: (e: React.PointerEvent) => void;
  onScrollResize?: (colDelta: number, rowDelta: number) => void;
  onAddBlock?: (block: ContentBlock) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BentoCell({
  cell,
  index,
  isSelected,
  isDraggingActive,
  onClick,
  onDelete,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  onScrollResize,
  onAddBlock,
}: BentoCellProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: cell.id,
    data: { cell },
  });

  const cellRef = useRef<HTMLDivElement>(null);

  const mergedRef = useCallback(
    (el: HTMLDivElement | null) => {
      (cellRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      setNodeRef(el);
    },
    [setNodeRef],
  );

  // Non-passive wheel listener for scroll-to-resize (only active when selected)
  useEffect(() => {
    const el = cellRef.current;
    if (!el || !isSelected || !onScrollResize) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      if (absX > absY && absX > 5) {
        onScrollResize!(e.deltaX > 0 ? 1 : -1, 0);
      } else if (absY > 5) {
        onScrollResize!(0, e.deltaY > 0 ? 1 : -1);
      }
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [isSelected, onScrollResize]);

  const label = cell.label || `Cell ${index + 1}`;
  const radiusClass = RADIUS_CLASSES[cell.borderRadius ?? "2xl"];
  const hasBlocks = (cell.blocks?.length ?? 0) > 0;

  const cellStyle: React.CSSProperties = {
    gridColumn: `${cell.colStart} / span ${cell.colSpan}`,
    gridRow: `${cell.rowStart} / span ${cell.rowSpan}`,
    backgroundColor: cell.bgColor ?? DEFAULT_CELL_BG,
    opacity: isDragging ? 0.15 : 1,
    zIndex: isSelected ? 2 : 1,
    position: "relative",
  };

  if (cell.bgImage) {
    cellStyle.backgroundImage = `url(${cell.bgImage})`;
    cellStyle.backgroundSize = "cover";
    cellStyle.backgroundPosition = "center";
  }

  function handleAddBlock(type: ContentBlock["type"]) {
    if (!onAddBlock) return;
    if (type === "text") {
      onAddBlock({ id: generateId(), type: "text", text: "", fontSize: "sm", fontWeight: "normal" });
    } else if (type === "image") {
      onAddBlock({ id: generateId(), type: "image", src: PLACEHOLDER_IMAGE, fit: "cover" });
    } else if (type === "button") {
      onAddBlock({ id: generateId(), type: "button", label: "Click me", variant: "solid", size: "md" });
    }
  }

  return (
    <div
      ref={mergedRef}
      style={cellStyle}
      className={[
        "group relative flex flex-col overflow-hidden border",
        radiusClass,
        "touch-manipulation select-none",
        "transition-[border-color,box-shadow] duration-150",
        isSelected
          ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-canvas"
          : "border-white/[0.07] hover:border-white/[0.16]",
      ].join(" ")}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Select ${label}, column ${cell.colStart} row ${cell.rowStart}, spanning ${cell.colSpan} columns and ${cell.rowSpan} rows`}
      aria-pressed={isSelected}
    >
      {/* bgImage dim overlay so text stays readable */}
      {cell.bgImage && (
        <div className="pointer-events-none absolute inset-0 z-[1] bg-black/40" aria-hidden="true" />
      )}

      {/* Drag handle — top strip */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className="absolute inset-x-0 top-0 z-20 flex h-7 cursor-grab items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 active:cursor-grabbing"
        aria-label={`Drag to reposition ${label}`}
        role="button"
        tabIndex={0}
        title="Drag to move"
      >
        <svg width="20" height="8" viewBox="0 0 20 8" fill="currentColor" className="text-white/25" aria-hidden="true">
          <circle cx="2" cy="2" r="1.5" /><circle cx="7" cy="2" r="1.5" />
          <circle cx="12" cy="2" r="1.5" /><circle cx="17" cy="2" r="1.5" />
          <circle cx="2" cy="6" r="1.5" /><circle cx="7" cy="6" r="1.5" />
          <circle cx="12" cy="6" r="1.5" /><circle cx="17" cy="6" r="1.5" />
        </svg>
      </div>

      {/* Delete button — top-right */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        aria-label={`Delete ${label}`}
        title="Delete cell"
        className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/25 text-white/40 opacity-0 backdrop-blur-sm transition-[opacity,background-color,color] duration-150 group-hover:opacity-100 hover:bg-red-900/60 hover:text-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Cell content area */}
      <div className="relative z-[2] flex flex-1 flex-col gap-2 p-3 pt-7 pointer-events-none">
        {hasBlocks ? (
          <>
            {cell.blocks!.map((block) => (
              <RenderBlock key={block.id} block={block} />
            ))}
          </>
        ) : (
          <>
            <span
              className={[
                "text-sm font-medium leading-snug tracking-tight",
                "transition-colors duration-150",
                isSelected ? "text-white" : "text-white/75 group-hover:text-white/95",
              ].join(" ")}
            >
              {label}
            </span>
            <span className="font-mono text-[10px] text-white/20" aria-hidden="true">
              {cell.colSpan}×{cell.rowSpan}
            </span>
          </>
        )}
      </div>

      {/* Quick-add block bar — bottom-center, on hover */}
      {onAddBlock && (
        <div
          className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 flex items-center gap-0.5 rounded-full border border-white/20 bg-black/65 px-1.5 py-1.5 opacity-0 shadow-lg shadow-black/40 backdrop-blur-md transition-all duration-200 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            title="Add text block"
            aria-label="Add text block"
            onClick={(e) => { e.stopPropagation(); handleAddBlock("text"); }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-blue-300/70 transition-all duration-100 hover:bg-white/10 hover:text-blue-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <Type size={15} aria-hidden="true" />
          </button>
          <div className="h-4 w-px bg-white/15" aria-hidden="true" />
          <button
            type="button"
            title="Add image block"
            aria-label="Add image block"
            onClick={(e) => { e.stopPropagation(); handleAddBlock("image"); }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-emerald-300/70 transition-all duration-100 hover:bg-white/10 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <ImageIcon size={15} aria-hidden="true" />
          </button>
          <div className="h-4 w-px bg-white/15" aria-hidden="true" />
          <button
            type="button"
            title="Add button block"
            aria-label="Add button block"
            onClick={(e) => { e.stopPropagation(); handleAddBlock("button"); }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-amber-300/70 transition-all duration-100 hover:bg-white/10 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <MousePointerClick size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Resize handle — bottom-right */}
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          onResizeStart(e);
        }}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeEnd}
        title="Drag to resize"
        className="absolute bottom-2 right-2 z-20 flex h-5 w-5 cursor-se-resize items-end justify-end opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        aria-hidden="true"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-white/25">
          <circle cx="2" cy="8" r="1.5" />
          <circle cx="6" cy="8" r="1.5" />
          <circle cx="6" cy="4" r="1.5" />
        </svg>
      </div>

      {/* Grain texture */}
      <div
        className={`pointer-events-none absolute inset-0 z-10 ${radiusClass}`}
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "120px 120px",
          opacity: 0.04,
        }}
        aria-hidden="true"
      />
    </div>
  );
}

// ─── Drag Overlay ─────────────────────────────────────────────────────────────

export function BentoCellOverlay({
  cell,
  index,
}: {
  cell: BentoCellType;
  index: number;
}) {
  const label = cell.label || `Cell ${index + 1}`;
  const radiusClass = RADIUS_CLASSES[cell.borderRadius ?? "2xl"];
  const hasBlocks = (cell.blocks?.length ?? 0) > 0;

  const overlayStyle: React.CSSProperties = {
    backgroundColor: cell.bgColor ?? DEFAULT_CELL_BG,
  };
  if (cell.bgImage) {
    overlayStyle.backgroundImage = `url(${cell.bgImage})`;
    overlayStyle.backgroundSize = "cover";
    overlayStyle.backgroundPosition = "center";
  }

  return (
    <div
      style={overlayStyle}
      className={`relative flex flex-col gap-2 overflow-hidden border border-white/20 p-3 pt-7 shadow-2xl ring-2 ring-accent ring-offset-2 ring-offset-canvas ${radiusClass}`}
    >
      {cell.bgImage && (
        <div className="pointer-events-none absolute inset-0 bg-black/40" aria-hidden="true" />
      )}
      <div className="relative z-[1] flex flex-col gap-1.5">
        {hasBlocks ? (
          cell.blocks!.slice(0, 2).map((block) =>
            block.type === "text" ? (
              <p key={block.id} className="text-sm font-medium text-white/90 truncate">
                {block.text || "(text)"}
              </p>
            ) : block.type === "button" ? (
              <span key={block.id} className="text-xs text-white/60">
                [{block.label}]
              </span>
            ) : (
              <span key={block.id} className="text-xs text-white/60">[image]</span>
            ),
          )
        ) : (
          <span className="text-sm font-medium tracking-tight text-white/90">{label}</span>
        )}
      </div>
      <span className="relative z-[1] font-mono text-[10px] text-white/20" aria-hidden="true">
        {cell.colSpan}×{cell.rowSpan}
      </span>
    </div>
  );
}
