# Bento Creator — SPEC

> This file is the **single source of truth** for the tool's design.
> Every task begins by reading this document.

---

## Goal

A visual bento layout builder that lets users:
1. Configure a CSS grid (columns, rows, gap)
2. Add and position cells with explicit column/row placement and span
3. Export clean, copy-ready HTML markup with Tailwind CSS class names

---

## Tech Stack

- Next.js 15 (App Router)
- TypeScript (strict)
- Tailwind CSS v4
- No external state library — `useReducer` only
- No backend, no CMS, no data fetching — 100% client-side

---

## Phase 1 — Core Layout Builder

### Grid Configuration

| Property | Type   | Range  | Tailwind output        |
|----------|--------|--------|------------------------|
| cols     | number | 1–12   | `grid-cols-{n}`        |
| rows     | number | 1–12   | `grid-rows-{n}`        |
| gap      | number | 0,2–8  | `gap-{n}`              |

### Cell Configuration

| Property  | Type   | Constraints                          |
|-----------|--------|--------------------------------------|
| colStart  | number | 1 to (cols − colSpan + 1)            |
| rowStart  | number | 1 to (rows − rowSpan + 1)            |
| colSpan   | number | 1 to (cols − colStart + 1)           |
| rowSpan   | number | 1 to (rows − rowStart + 1)           |
| label     | string | Displayed inside the cell            |

### Operations

- Add cell — placed at the next available grid position (top-left scan)
- Select cell — click on a cell to select; sidebar shows CellControls
- Update cell — edit position/span/label via sidebar inputs
- Delete cell — removes the selected cell
- Reset — returns to the default 5-cell bento layout
- Grid update — clamping applied to all cells when grid shrinks

### Code Output

- Generated HTML uses explicit Tailwind class names:
  - `col-start-{n}`, `col-span-{n}`, `row-start-{n}`, `row-span-{n}`
  - Container: `grid grid-cols-{n} grid-rows-{n} gap-{n}`
- Preview uses inline CSS (not Tailwind) to avoid Tailwind v4 purge issues
- Copy-to-clipboard with visual feedback

---

## Phase 2 — Cell Content (planned)

- Background color or image per cell
- Text content (heading, body, label)
- Button element
- Icon support

---

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Bento Creator  [Phase 1]              [Reset]       │ Header
├──────────────────┬──────────────────────────────────────────┤
│  Grid            │                                          │
│  Cols / Rows     │   [Visual bento grid preview]            │
│  Gap             │                                          │
│                  │   [+ Add Cell]  (or "Grid is full")      │
│  ───────────     ├──────────────────────────────────────────┤
│  Cell            │   ┌─ Generated HTML + Tailwind ─────┐   │
│  (selected)      │   │ <div class="grid ...">           │   │
│  Label           │   │   <div class="col-span-2 ...">  │   │
│  Col Start/Span  │   │   </div>                         │   │
│  Row Start/Span  │   └──────────────────────[Copy Code]─┘   │
│  [Delete Cell]   │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

---

## Type Contracts

```typescript
interface GridConfig {
  cols: number;   // 1–12
  rows: number;   // 1–12
  gap: number;    // Tailwind gap unit
}

interface BentoCell {
  id: string;
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  label: string;
}

interface BentoConfig {
  grid: GridConfig;
  cells: BentoCell[];
}
```

---

## Design Principles

- Dark-first UI (zinc-950 background)
- All interactive elements have visible `focus-visible:ring-*` states
- No `transition: all` — explicit property lists only
- `prefers-reduced-motion` respected via global CSS
- Semantic HTML: cells are `<button>`, inputs have `<label>`, icon buttons have `aria-label`
- Preview uses inline CSS; generated code uses Tailwind class strings
