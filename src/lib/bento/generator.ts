import type {
  BentoConfig,
  BentoCell,
  BorderRadius,
  ContentBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function indent(str: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return str.split("\n").map((line) => pad + line).join("\n");
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
  return `<p class="${cls}"${colorStyle}>${block.text || ""}</p>`;
}

function renderImageBlockHTML(block: ImageBlock): string {
  const fitClass = block.fit === "contain" ? "object-contain" : "object-cover";
  const alt = block.alt ? ` alt="${block.alt}"` : ' alt=""';
  return `<img src="${block.src ?? ""}" class="w-full ${fitClass}" style="min-height:60px;max-height:160px"${alt} loading="lazy" />`;
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
  return `<button type="button" class="${radiusClass} ${sizeClass} ${variantClass}${widthClass}"${inlineStyle}>${block.label || "Button"}</button>`;
}

function renderBlockHTML(block: ContentBlock): string {
  if (block.type === "text") return renderTextBlockHTML(block);
  if (block.type === "image") return renderImageBlockHTML(block);
  if (block.type === "button") return renderButtonBlockHTML(block);
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
  return `<p className="${cls}"${colorStyle}>${block.text || ""}</p>`;
}

function renderImageBlockJSX(block: ImageBlock): string {
  const fitClass = block.fit === "contain" ? "object-contain" : "object-cover";
  const alt = block.alt ? ` alt="${block.alt}"` : ' alt=""';
  return `<img src="${block.src ?? ""}" className="w-full ${fitClass}" style={{ minHeight: "60px", maxHeight: "160px" }}${alt} loading="lazy" />`;
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
  return `<button type="button" className="${radiusClass} ${sizeClass} ${variantClass}${widthClass}"${styleStr}>${block.label || "Button"}</button>`;
}

function renderBlockJSX(block: ContentBlock): string {
  if (block.type === "text") return renderTextBlockJSX(block);
  if (block.type === "image") return renderImageBlockJSX(block);
  if (block.type === "button") return renderButtonBlockJSX(block);
  return "";
}

// ─── Cell HTML output ─────────────────────────────────────────────────────────

function cellClasses(cell: BentoCell): string {
  const radius = RADIUS_CLASS[cell.borderRadius ?? "2xl"];
  return [
    `col-start-${cell.colStart}`,
    `col-span-${cell.colSpan}`,
    `row-start-${cell.rowStart}`,
    `row-span-${cell.rowSpan}`,
    "p-3 flex flex-col gap-2",
    radius,
  ].join(" ");
}

function cellStyleAttr(cell: BentoCell): string {
  const parts: string[] = [];
  if (cell.bgColor) parts.push(`background-color: ${cell.bgColor}`);
  if (cell.bgImage) parts.push(`background-image: url(${cell.bgImage}); background-size: cover; background-position: center`);
  return parts.length ? ` style="${parts.join("; ")}"` : "";
}

function cellStyleObj(cell: BentoCell): string {
  const parts: string[] = [];
  if (cell.bgColor) parts.push(`backgroundColor: "${cell.bgColor}"`);
  if (cell.bgImage) parts.push(`backgroundImage: "url(${cell.bgImage})", backgroundSize: "cover", backgroundPosition: "center"`);
  return parts.length ? ` style={{ ${parts.join(", ")} }}` : "";
}

function cellInnerHTML(cell: BentoCell): string {
  const blocks = cell.blocks ?? [];
  if (blocks.length === 0) return cell.label || "Cell";
  return blocks.map(renderBlockHTML).join("\n");
}

function cellInnerJSX(cell: BentoCell): string {
  const blocks = cell.blocks ?? [];
  if (blocks.length === 0) return cell.label || "Cell";
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

export function generateStandaloneHTML(config: BentoConfig): string {
  const inner = generateCode(config);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bento Layout</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
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
