import type {
  BentoConfig,
  BentoCell,
  BorderRadius,
  ContentBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  StatBlock,
} from "./types";

// ─── Mappings ─────────────────────────────────────────────────────────────────

const GAP_CLASS: Record<number, string> = {
  0: "gap-0", 2: "gap-2", 3: "gap-3", 4: "gap-4", 6: "gap-6", 8: "gap-8",
};

const RADIUS_CLASS: Record<BorderRadius, string> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md",
  lg: "rounded-lg", xl: "rounded-xl", "2xl": "rounded-2xl", full: "rounded-full",
};

const FONT_SIZE_CLASS: Record<string, string> = {
  xs: "text-xs", sm: "text-sm", base: "text-base",
  lg: "text-lg", xl: "text-xl", "2xl": "text-2xl", "3xl": "text-3xl",
};

const FONT_WEIGHT_CLASS: Record<string, string> = {
  normal: "font-normal", medium: "font-medium",
  semibold: "font-semibold", bold: "font-bold",
};

const TRACKING_CLASS: Record<string, string> = {
  tighter: "tracking-tighter", tight: "tracking-tight", normal: "tracking-normal",
  wide: "tracking-wide", wider: "tracking-wider", widest: "tracking-widest",
};

const LEADING_CLASS: Record<string, string> = {
  none: "leading-none", tight: "leading-tight", snug: "leading-snug",
  normal: "leading-normal", relaxed: "leading-relaxed", loose: "leading-loose",
};

const ALIGN_CLASS: Record<string, string> = {
  left: "text-left", center: "text-center", right: "text-right",
};

const BTN_SIZE_CLASS: Record<string, string> = {
  sm: "px-3 py-1 text-xs", md: "px-4 py-1.5 text-sm", lg: "px-5 py-2 text-base",
};

const BTN_RADIUS_CLASS: Record<BorderRadius, string> = RADIUS_CLASS;

const SHADOW_CLASS: Record<string, string> = {
  none: "",
  sm:   "shadow-sm",
  md:   "shadow-md",
  lg:   "shadow-lg",
  xl:   "shadow-xl",
};

const PADDING_CLASS: Record<string, string> = {
  none: "p-0", sm: "p-2", md: "p-3", lg: "p-5",
};

const ALIGN_CLASS_CONTENT: Record<string, string> = {
  start: "justify-start", center: "justify-center", end: "justify-end",
};

const ANIM_CLASS: Record<string, string> = {
  none: "",
  "fade-in":    "bento-anim-fade-in",
  "slide-up":   "bento-anim-slide-up",
  "slide-right":"bento-anim-slide-right",
  pop:          "bento-anim-pop",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function indent(str: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return str.split("\n").map((line) => pad + line).join("\n");
}

/** Escapes special HTML characters in user-supplied strings for safe generated HTML output. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Escapes user text for safe embedding in JSX text content.
 * JSX supports HTML entities, and curly braces must also be escaped
 * to avoid being interpreted as JS expression delimiters.
 */
function escapeJsxText(str: string): string {
  return escapeHtml(str)
    .replace(/\{/g, "&#x7B;")
    .replace(/\}/g, "&#x7D;");
}

/**
 * Validates that a URL is safe for use in CSS url() or HTML src attributes.
 * Only allows http/https/data URLs; rejects javascript: and other schemes.
 */
function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^(https?:|data:image\/)/i.test(trimmed)) return trimmed;
  return "";
}

function sortedCells(config: BentoConfig): BentoCell[] {
  return [...config.cells].sort((a, b) => {
    if (a.rowStart !== b.rowStart) return a.rowStart - b.rowStart;
    return a.colStart - b.colStart;
  });
}

// ─── Block HTML renderers ─────────────────────────────────────────────────────

function renderTextBlockHTML(block: TextBlock): string {
  const cls = [
    FONT_SIZE_CLASS[block.fontSize ?? "sm"] ?? "text-sm",
    FONT_WEIGHT_CLASS[block.fontWeight ?? "normal"] ?? "font-normal",
    TRACKING_CLASS[block.tracking ?? "normal"] ?? "tracking-normal",
    LEADING_CLASS[block.leading ?? "normal"] ?? "leading-normal",
    ALIGN_CLASS[block.align ?? "left"] ?? "text-left",
  ].join(" ");
  const colorStyle = block.color ? ` style="color: ${block.color}"` : "";
  return `<p class="${cls}"${colorStyle}>${escapeHtml(block.text || "")}</p>`;
}

function renderImageBlockHTML(block: ImageBlock): string {
  const fitClass = block.fit === "contain" ? "object-contain" : "object-cover";
  const safeSrc = sanitizeUrl(block.src ?? "");
  const alt = block.alt ? ` alt="${escapeHtml(block.alt)}"` : ' alt=""';
  return `<img src="${escapeHtml(safeSrc)}" class="w-full ${fitClass}" style="min-height:60px;max-height:160px"${alt} loading="lazy" />`;
}

function renderButtonBlockHTML(block: ButtonBlock): string {
  const radiusClass = BTN_RADIUS_CLASS[block.borderRadius ?? "lg"];
  const sizeClass = BTN_SIZE_CLASS[block.size ?? "md"] ?? BTN_SIZE_CLASS.md;
  let variantClass = "";
  let inlineStyle = "";

  if (block.variant === "outline") {
    variantClass = "border border-current bg-transparent font-medium";
    inlineStyle = ` style="color:${block.bgColor ?? "#fff"}"`;
  } else if (block.variant === "ghost") {
    variantClass = "bg-transparent font-medium";
    inlineStyle = ` style="color:${block.bgColor ?? "#fff"}"`;
  } else {
    variantClass = "border-0 font-medium";
    inlineStyle = ` style="background-color:${block.bgColor ?? "#fff"};color:${block.textColor ?? "#000"}"`;
  }

  const widthClass = block.fullWidth ? " w-full" : "";
  return `<button type="button" class="${radiusClass} ${sizeClass} ${variantClass}${widthClass}"${inlineStyle}>${escapeHtml(block.label || "Button")}</button>`;
}

function renderStatBlockHTML(block: StatBlock): string {
  const valueStyle = block.valueColor ? ` style="color:${block.valueColor}"` : "";
  const labelStyle = block.labelColor ? ` style="color:${block.labelColor}"` : "";
  const value = `${escapeHtml(block.prefix ?? "")}${escapeHtml(block.value)}${escapeHtml(block.suffix ?? "")}`;
  const label = block.label ? `\n  <span class="text-xs font-medium"${labelStyle}>${escapeHtml(block.label)}</span>` : "";
  return `<div class="flex flex-col gap-0.5">\n  <span class="text-3xl font-bold leading-none tracking-tight"${valueStyle}>${value}</span>${label}\n</div>`;
}

function renderBlockHTML(block: ContentBlock): string {
  if (block.type === "text") return renderTextBlockHTML(block);
  if (block.type === "image") return renderImageBlockHTML(block);
  if (block.type === "button") return renderButtonBlockHTML(block);
  if (block.type === "stat") return renderStatBlockHTML(block);
  return "";
}

// ─── Block JSX renderers ──────────────────────────────────────────────────────

function renderTextBlockJSX(block: TextBlock): string {
  const cls = [
    FONT_SIZE_CLASS[block.fontSize ?? "sm"] ?? "text-sm",
    FONT_WEIGHT_CLASS[block.fontWeight ?? "normal"] ?? "font-normal",
    TRACKING_CLASS[block.tracking ?? "normal"] ?? "tracking-normal",
    LEADING_CLASS[block.leading ?? "normal"] ?? "leading-normal",
    ALIGN_CLASS[block.align ?? "left"] ?? "text-left",
  ].join(" ");
  const colorStyle = block.color ? ` style={{ color: "${block.color}" }}` : "";
  return `<p className="${cls}"${colorStyle}>${escapeJsxText(block.text || "")}</p>`;
}

function renderImageBlockJSX(block: ImageBlock): string {
  const fitClass = block.fit === "contain" ? "object-contain" : "object-cover";
  const safeSrc = sanitizeUrl(block.src ?? "");
  const alt = block.alt ? ` alt="${escapeHtml(block.alt)}"` : ' alt=""';
  return `<img src="${escapeHtml(safeSrc)}" className="w-full ${fitClass}" style={{ minHeight: "60px", maxHeight: "160px" }}${alt} loading="lazy" />`;
}

function renderButtonBlockJSX(block: ButtonBlock): string {
  const radiusClass = BTN_RADIUS_CLASS[block.borderRadius ?? "lg"];
  const sizeClass = BTN_SIZE_CLASS[block.size ?? "md"] ?? BTN_SIZE_CLASS.md;
  let variantClass = "";
  let styleStr = "";

  if (block.variant === "outline") {
    variantClass = "border border-current bg-transparent font-medium";
    styleStr = ` style={{ color: "${block.bgColor ?? "#fff"}" }}`;
  } else if (block.variant === "ghost") {
    variantClass = "bg-transparent font-medium";
    styleStr = ` style={{ color: "${block.bgColor ?? "#fff"}" }}`;
  } else {
    variantClass = "border-0 font-medium";
    styleStr = ` style={{ backgroundColor: "${block.bgColor ?? "#fff"}", color: "${block.textColor ?? "#000"}" }}`;
  }

  const widthClass = block.fullWidth ? " w-full" : "";
  return `<button type="button" className="${radiusClass} ${sizeClass} ${variantClass}${widthClass}"${styleStr}>${escapeJsxText(block.label || "Button")}</button>`;
}

function renderStatBlockJSX(block: StatBlock): string {
  const valueStyle = block.valueColor ? ` style={{ color: "${block.valueColor}" }}` : "";
  const labelStyle = block.labelColor ? ` style={{ color: "${block.labelColor}" }}` : "";
  const value = `${escapeJsxText(block.prefix ?? "")}${escapeJsxText(block.value)}${escapeJsxText(block.suffix ?? "")}`;
  const label = block.label ? `\n  <span className="text-xs font-medium"${labelStyle}>${escapeJsxText(block.label)}</span>` : "";
  return `<div className="flex flex-col gap-0.5">\n  <span className="text-3xl font-bold leading-none tracking-tight"${valueStyle}>${value}</span>${label}\n</div>`;
}

function renderBlockJSX(block: ContentBlock): string {
  if (block.type === "text") return renderTextBlockJSX(block);
  if (block.type === "image") return renderImageBlockJSX(block);
  if (block.type === "button") return renderButtonBlockJSX(block);
  if (block.type === "stat") return renderStatBlockJSX(block);
  return "";
}

// ─── Cell HTML output ─────────────────────────────────────────────────────────

function cellClasses(cell: BentoCell): string {
  const radius = RADIUS_CLASS[cell.borderRadius ?? "2xl"];
  const padding = PADDING_CLASS[cell.padding ?? "md"] ?? "p-3";
  const align = ALIGN_CLASS_CONTENT[cell.contentAlign ?? "start"] ?? "justify-start";
  const shadow = SHADOW_CLASS[cell.shadow ?? "none"] ?? "";
  const anim = ANIM_CLASS[cell.animation ?? "none"] ?? "";
  return [
    `col-start-${cell.colStart}`,
    `col-span-${cell.colSpan}`,
    `row-start-${cell.rowStart}`,
    `row-span-${cell.rowSpan}`,
    padding, "flex flex-col gap-2", align,
    radius,
    shadow,
    anim,
  ].filter(Boolean).join(" ");
}

function cellStyleAttr(cell: BentoCell): string {
  const parts: string[] = [];
  if (cell.bgGradient) {
    parts.push(`background: linear-gradient(${cell.bgGradient.angle}deg, ${cell.bgGradient.stops[0]}, ${cell.bgGradient.stops[1]})`);
  } else if (cell.bgColor) {
    parts.push(`background-color: ${cell.bgColor}`);
  }
  if (!cell.bgGradient && cell.bgImage) {
    const safeBgImage = sanitizeUrl(cell.bgImage);
    if (safeBgImage) parts.push(`background-image: url(${escapeHtml(safeBgImage)}); background-size: cover; background-position: center`);
  }
  if (cell.borderWidth && cell.borderWidth > 0) {
    parts.push(`border: ${cell.borderWidth}px solid ${cell.borderColor ?? "#ffffff"}`);
  }
  return parts.length ? ` style="${parts.join("; ")}"` : "";
}

function cellStyleObj(cell: BentoCell): string {
  const parts: string[] = [];
  if (cell.bgGradient) {
    parts.push(`backgroundImage: "linear-gradient(${cell.bgGradient.angle}deg, ${cell.bgGradient.stops[0]}, ${cell.bgGradient.stops[1]})"`);
  } else if (cell.bgColor) {
    parts.push(`backgroundColor: "${cell.bgColor}"`);
  }
  if (!cell.bgGradient && cell.bgImage) {
    const safeBgImage = sanitizeUrl(cell.bgImage);
    if (safeBgImage) parts.push(`backgroundImage: "url(${escapeHtml(safeBgImage)})", backgroundSize: "cover", backgroundPosition: "center"`);
  }
  if (cell.borderWidth && cell.borderWidth > 0) {
    parts.push(`border: "${cell.borderWidth}px solid ${cell.borderColor ?? "#ffffff"}"`);
  }
  return parts.length ? ` style={{ ${parts.join(", ")} }}` : "";
}

function cellInnerHTML(cell: BentoCell): string {
  const blocks = cell.blocks ?? [];
  if (blocks.length === 0) return escapeHtml(cell.label || "Cell");
  return blocks.map(renderBlockHTML).join("\n");
}

function cellInnerJSX(cell: BentoCell): string {
  const blocks = cell.blocks ?? [];
  if (blocks.length === 0) return escapeJsxText(cell.label || "Cell");
  return blocks.map(renderBlockJSX).join("\n");
}

// ─── Tailwind HTML ─────────────────────────────────────────────────────────────

export function generateCode(config: BentoConfig): string {
  const { grid } = config;
  const gapClass = GAP_CLASS[grid.gap] ?? `gap-${grid.gap}`;
  const containerClass = `grid grid-cols-${grid.cols} grid-rows-${grid.rows} ${gapClass}`;

  if (config.cells.length === 0) {
    return `<div class="${containerClass}">\n  <!-- Add cells to your bento grid -->\n</div>`;
  }

  const cellLines = sortedCells(config).map((cell) => {
    const inner = cellInnerHTML(cell);
    const hasMultiLine = inner.includes("\n");
    const styleAttr = cellStyleAttr(cell);
    const classes = cellClasses(cell);
    if (hasMultiLine) {
      return `<div class="${classes}"${styleAttr}>\n${indent(inner, 2)}\n</div>`;
    }
    return `<div class="${classes}"${styleAttr}>\n  ${inner}\n</div>`;
  });

  const innerContent = cellLines.map((l) => indent(l, 2)).join("\n");
  return `<div class="${containerClass}">\n${innerContent}\n</div>`;
}

// ─── Standalone HTML ───────────────────────────────────────────────────────────

const ANIMATION_KEYFRAMES = `  <style>
    @keyframes bento-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes bento-slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes bento-slide-right { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes bento-pop { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
    .bento-anim-fade-in     { animation: bento-fade-in    0.4s ease-out both; }
    .bento-anim-slide-up    { animation: bento-slide-up   0.4s ease-out both; }
    .bento-anim-slide-right { animation: bento-slide-right 0.4s ease-out both; }
    .bento-anim-pop         { animation: bento-pop        0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; } }
  </style>`;

function hasAnimations(config: BentoConfig): boolean {
  return config.cells.some((c) => c.animation && c.animation !== "none");
}

export function generateStandaloneHTML(config: BentoConfig): string {
  const inner = generateCode(config);
  const animStyles = hasAnimations(config) ? `\n${ANIMATION_KEYFRAMES}` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bento Layout</title>
  <script src="https://cdn.tailwindcss.com"><\/script>${animStyles}
</head>
<body class="min-h-screen bg-gray-900 p-8">
${indent(inner, 2)}
</body>
</html>`;
}

// ─── React JSX ────────────────────────────────────────────────────────────────

export function generateReactJSX(config: BentoConfig): string {
  const { grid } = config;
  const gapClass = GAP_CLASS[grid.gap] ?? `gap-${grid.gap}`;
  const containerClassName = `grid grid-cols-${grid.cols} grid-rows-${grid.rows} ${gapClass}`;

  if (config.cells.length === 0) {
    return `export function BentoLayout() {\n  return (\n    <div className="${containerClassName}">\n      {/* Add cells to your bento grid */}\n    </div>\n  );\n}`;
  }

  const cellLines = sortedCells(config).map((cell) => {
    const inner = cellInnerJSX(cell);
    const hasMultiLine = inner.includes("\n");
    const styleStr = cellStyleObj(cell);
    const classStr = `className="${cellClasses(cell)}"`;
    if (hasMultiLine) {
      return `<div ${classStr}${styleStr}>\n${indent(inner, 2)}\n</div>`;
    }
    return `<div ${classStr}${styleStr}>\n  ${inner}\n</div>`;
  });

  const innerContent = cellLines.map((l) => indent(l, 6)).join("\n");
  return `export function BentoLayout() {\n  return (\n    <div className="${containerClassName}">\n${innerContent}\n    </div>\n  );\n}`;
}
