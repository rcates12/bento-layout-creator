# Lintel - bento/layout creator.

https://lintel.design/

A visual, browser-based tool for building **bento-style grid layouts** and exporting the result as production-ready code — Tailwind HTML, standalone HTML, or React JSX.

---

## What it does

Bento grids are popular in modern product pages, portfolio sites, and dashboards. This tool removes the guesswork: drag cells around, resize them, add content blocks, style everything visually, then copy the generated code straight into your project.

---

## Features

### Grid Builder
- Set any number of **columns and rows** (1–12 each) with live preview of additions/removals
- Configurable **gap** between cells (none → XL)
- **Drag cells** to new positions with a dot-handle
- **Resize cells** by dragging the corner handle or scrolling on a selected cell
- **Ghost tiles** on empty positions let you add cells by clicking

### Cell Editor (sidebar)
- **Content blocks** — add multiple stacked blocks per cell:
  - **Text** — font size, weight, tracking, leading, alignment, and colour
  - **Image** — fit (cover/contain), border radius, shadow, border width/colour, alt text
  - **Button** — label, variant (solid/outline/ghost), size, corner radius, background/text colours, full-width toggle
- Drag to **reorder blocks** within a cell via @dnd-kit sortable
- **Background colour** — 14 curated earth-tone swatches
- **Background image** — set a placeholder image or clear it
- **Border radius** — 7 presets from square to pill
- **Cell label** — internal name for your own reference
- **Duplicate cell** (or Ctrl+D) — finds the next available grid position automatically
- **Delete cell** (or Delete key)

### Presets
- 10 built-in layout presets (3-up, magazine, hero + cards, dashboard, etc.)
- One-click "Fill Regular" mode for uniform equal-cell grids

### Code Export
- **Tailwind HTML** — grid + cell classes, inline background styles
- **Standalone HTML** — complete `<!DOCTYPE html>` file with Tailwind CDN, ready to open in a browser
- **React JSX** — functional component with `className` props, ready to drop into any React project
- Syntax-highlighted output with a one-click Copy button

### UX
- **Undo / Redo** (Ctrl+Z / Ctrl+Y) with full history
- **Auto-save** — layout persists in `localStorage` across page refreshes
- **Light / Dark mode** toggle
- Full **keyboard navigation** (Delete to remove cell, Escape to deselect, Ctrl+D to duplicate)

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI Library | [React 19](https://react.dev) |
| Language | TypeScript 5 |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Component primitives | [shadcn/ui](https://ui.shadcn.com) (base-nova / [@base-ui/react](https://base-ui.com)) |
| Drag & Drop | [@dnd-kit](https://dndkit.com) |
| Icons | [lucide-react](https://lucide.dev) |
| Animations | [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) |

---

## Getting started

```bash
# clone
git clone https://github.com/rcates12/bento-layout-creator.git
cd bento-layout-creator

# install
npm install

# run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm start
```

---

## Project structure

```
src/
├── app/
│   ├── globals.css          # Design tokens, Tailwind theme, ISO-3D utilities
│   ├── layout.tsx           # Root layout, TooltipProvider
│   └── page.tsx             # Entry point → BentoEditor
├── components/
│   ├── bento/
│   │   ├── BentoEditor.tsx  # Top-level editor shell (state, undo/redo, layout)
│   │   ├── BentoGrid.tsx    # Canvas — drag/drop, resize, ghost tiles
│   │   ├── BentoCell.tsx    # Individual cell rendering + quick-add bar
│   │   ├── CellControls.tsx # Sidebar panel — all cell property editors
│   │   ├── GridControls.tsx # Sidebar panel — columns, rows, gap
│   │   ├── CodeOutput.tsx   # Syntax-highlighted code export panel
│   │   ├── PresetPicker.tsx # Collapsible preset grid
│   │   ├── ThemeToggle.tsx  # Light/dark toggle
│   │   ├── Tooltip.tsx      # Thin wrapper around shadcn Tooltip
│   │   └── StatusBanner.tsx # Info/warning inline banners
│   └── ui/                  # shadcn/ui components (button, input, select, etc.)
└── lib/
    └── bento/
        ├── types.ts          # All TypeScript types (BentoCell, ContentBlock, …)
        ├── theme.ts          # Earth-tone palette, defaults
        ├── presets.ts        # Built-in layout presets
        ├── generator.ts      # HTML / Standalone / JSX code generators
        ├── utils.ts          # Grid math, overlap detection, ID generation
        └── useHistoryReducer.ts # Undo/redo state management
```

---

## Design

The UI uses an **Isomorphic 3D** aesthetic — soft pastel gradient sidebar, floating glass-effect section cards, luminous accent colours, and subtle depth — with full light and dark mode support built on CSS custom properties.

Color tokens are defined in `globals.css` under `@theme` (light defaults) and `.dark` (dark overrides), with shadcn tokens mapped to the project palette to keep both systems in sync.

---

## Roadmap

- [ ] Deploy to Vercel with public URL
- [ ] Custom colour picker (hex input + eyedropper)
- [ ] Cell padding/alignment controls
- [ ] Export as CSS Grid (no Tailwind dependency)
- [ ] Shareable layout URLs (encoded in query string or short link)
- [ ] More preset categories (e-commerce, SaaS marketing, portfolio)

---

## License

MIT
