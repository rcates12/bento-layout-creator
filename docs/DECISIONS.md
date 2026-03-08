# Decisions Log

> Every notable technical choice is recorded here with date and rationale.
> New entries go at the **top** of the log.

---

## 2026-03-07 — Phase 2 Interactions + Design

### DndContext lives in BentoGrid (not BentoEditor)
**Rationale:** BentoGrid owns `gridRef` for measuring grid dimensions, which is essential for custom pointer-to-grid-position collision detection. Placing `DndContext` inside BentoGrid keeps all drag-related logic (sensors, drag move, drag end, drop preview, DragOverlay) cohesive. BentoGrid exposes `onMoveCell` as a prop; BentoEditor dispatches `MOVE_CELL` in response.

### @dnd-kit/core over react-beautiful-dnd or react-dnd
**Rationale:** `@dnd-kit/core` is the only modern accessible React DnD library that makes no DOM reordering assumptions. Our layout uses explicit CSS grid placement (`grid-column: start / span`), not DOM order — dnd-kit's sensor model and manual collision detection are a natural fit. `react-beautiful-dnd` is deprecated; `react-dnd` uses HTML5 DnD which has accessibility and touch limitations.

### Custom grid collision detector (`lib/bento/gridCollision.ts`)
**Rationale:** dnd-kit's built-in collision strategies (`rectIntersection`, `closestCenter`) are designed for lists of equally-sized items. Bento grid cells have explicit placements and variable spans. We compute grid position from the dragged cell's center-point coordinates relative to the grid container's `getBoundingClientRect`, accounting for cell width, row height, and gap.

### Drop animation disabled on DragOverlay
**Rationale:** `DragOverlay dropAnimation={null}` was set because the default dnd-kit drop animation causes a jarring snap back to the DOM position before the React state update re-renders the cell. Since the reducer commits the new position synchronously on drag end, no animation is needed.

### Swap-on-conflict for MOVE_CELL (not full reflow)
**Rationale:** When a dragged cell lands on exactly one other cell, and both cells fit in each other's original positions, the two cells swap. If the target position is occupied by multiple cells, or the swap would violate grid bounds, the drop is rejected (state unchanged). Full auto-reflow (cascading push) is deferred because it creates unpredictable cascading movements that disorient users of intentional bento layouts.

### Resize handles use custom pointer events (no library)
**Rationale:** Resize requires knowing the grid's pixel dimensions at the time of the drag, which is only available via `gridRef.current.getBoundingClientRect()` inside `BentoGrid`. Using `element.setPointerCapture(e.pointerId)` routes all subsequent pointer events to the handle element even when the pointer leaves it — no third-party resize library needed.

### Overlap prevention in UPDATE_CELL reducer (not just UI)
**Rationale:** Validation in the reducer is the single authoritative place — it catches overlap regardless of whether the update came from the sidebar, a keyboard shortcut, or a future programmatic API. The UI additionally disables the +/− buttons when the next value would cause overlap, giving immediate feedback before the user commits.

### Gen X Soft Club warm earth tone palette
**Rationale:** The aesthetic — warm charcoals, organic earth tones, 70s minimalism, Helvetica-inspired tight tracking — gives the tool a distinctive identity that contrasts with the cold zinc/blue developer-tool default. CSS custom properties are registered in `@theme inline` so Tailwind v4 generates `bg-canvas`, `text-cream`, `border-rim`, etc. as first-class utilities.

### Grain texture via inline SVG data URL (no image asset)
**Rationale:** SVG `feTurbulence` noise filter expressed as a base64-inline `background-image` requires no HTTP request, no public asset, and no image optimization pipeline. Applied as a `::after` pseudo-element at ~3.5% opacity — visible on close inspection, invisible in screenshots.

### Ghost tiles only for empty positions
**Rationale:** Computing `getEmptyPositions()` (scanning all grid slots for vacancy) and rendering ghost tiles only there keeps the DOM lean and prevents ghost tiles from visually competing with actual cells. CSS z-index (ghost = 0, cell = 1) ensures cells always render above any adjacent ghost.

---

## 2026-03-07 — Initial Architecture

### Inline CSS for preview, Tailwind class strings in generated output
**Rationale:** Tailwind v4 scans source files at build time to generate the stylesheet. Class names constructed dynamically at runtime (e.g. `grid-cols-${cols}`) are not present in source and therefore not included in the output CSS. Using inline CSS (`grid-template-columns: repeat(N, 1fr)`) for the live preview sidesteps this entirely. The generated code output is just a string — it is never applied to the preview DOM — so it can safely contain any Tailwind class name the user's own project will resolve.

### `useReducer` over Zustand or Context + useState
**Rationale:** The state shape is a single `BentoState` object with one collection (`cells[]`) and one UI flag (`selectedCellId`). `useReducer` is sufficient, avoids a dependency, and keeps all state transitions as named, testable actions. Zustand would be appropriate if Phase 2 adds significantly more state surface (undo/redo, persistence, multi-panel coordination).

### Pure generator function (`lib/bento/generator.ts`)
**Rationale:** Keeping `generateCode()` as a zero-dependency pure function (no React imports, no hooks) makes it independently testable and reusable. The component layer (`CodeOutput`) simply calls it and renders the result. This separation also makes it trivial to add a server-side code generation API in Phase 2 if needed.

### Cell constraints enforced in reducer (clampCell)
**Rationale:** When the grid shrinks (e.g. cols 4 → 3), cells that previously fit may now overflow. Applying `clampCell` inside the `UPDATE_GRID` reducer action ensures the state is always consistent regardless of where the update originates. No component needs to guard against out-of-bounds values.

### Grid positioned cells (explicit colStart/rowStart) over CSS auto-flow
**Rationale:** The tool's purpose is to let users specify exact placement. CSS auto-flow would reorder cells unpredictably as the grid changes. All cells use explicit `grid-column: start / span` placement in both the preview (inline CSS) and generated code (Tailwind `col-start-*` / `col-span-*` classes).

### `findNextPosition` scans top-left to bottom-right
**Rationale:** Simple and predictable. When the user clicks "Add Cell", the new cell appears at the first unoccupied slot reading left-to-right, top-to-bottom — matching how users naturally read a grid. No randomness, no layout engine complexity for Phase 1.

### No Builder CMS, no ISR, no server data fetching
**Rationale:** This tool has no content managed externally. It is a 100% client-side utility. Server Components are used only as a thin shell (no data fetching). Adding persistence (localStorage, DB) is deferred to a later phase.

### Dark-first UI design
**Rationale:** Bento layout tools are developer/designer tools used in focused sessions. Dark UIs reduce eye strain and put visual focus on the bento grid preview itself. The zinc-950 background provides a neutral canvas that makes the grid cells (zinc-800/900) stand out clearly.

### `@media (prefers-reduced-motion)` in global CSS
**Rationale:** Applying `transition-duration: 0.01ms` globally for reduced-motion users is simpler and more reliable than adding per-component guards. One place to maintain. This satisfies the Vercel Web Interface Guidelines requirement without per-component complexity.
