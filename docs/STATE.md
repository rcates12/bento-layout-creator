# Bento Creator — Project State

> Updated at every handoff. Gives a snapshot of where the project stands.

---

## Current Milestone

**Milestone 3 — Plan B: Content & Styling** (COMPLETE)

| Task                                                         | Status |
|--------------------------------------------------------------|--------|
| `GradientConfig` type + `bgGradient` on `BentoCell`         | Done   |
| Gradient toggle + color pickers + angle input in CellControls| Done   |
| Gradient preview in BentoCell + BentoCellOverlay             | Done   |
| Gradient output in generator (HTML + JSX)                    | Done   |
| `borderWidth`, `borderColor`, `shadow` on `BentoCell`       | Done   |
| Border/shadow controls in CellControls (reuse existing pickers)| Done |
| Border/shadow preview in BentoCell + BentoCellOverlay        | Done   |
| Border/shadow output in generator                            | Done   |
| `StatBlock` type + added to `ContentBlock` union             | Done   |
| `RenderStatBlock` in BentoCell + quick-add bar icon          | Done   |
| `StatBlockEditor` in CellControls + BLOCK_TYPE_META entry    | Done   |
| Stat block HTML/JSX renderers in generator                   | Done   |
| `padding` + `contentAlign` on `BentoCell`                   | Done   |
| Padding/align pill-toggle controls in CellControls           | Done   |
| Dynamic padding + alignment in BentoCell + overlay           | Done   |
| Dynamic padding/align in generator `cellClasses()`          | Done   |
| `CellAnimation` type + `animation` on `BentoCell`           | Done   |
| Four `@keyframes` + animation classes in `globals.css`       | Done   |
| Animation class applied in BentoCell preview                 | Done   |
| Animation pill-toggle selector in CellControls               | Done   |
| Animation class emitted in generator; keyframes in standalone| Done   |
| `npm run build` passes (0 errors, 0 warnings)               | Done   |

---

## Previous Milestones

**Milestone 2 — Interactions + Design Identity** (COMPLETE)

| Task                                                         | Status |
|--------------------------------------------------------------|--------|
| `hasOverlap()` in utils.ts + UPDATE_CELL validation          | Done   |
| Gen X Soft Club theme tokens in `globals.css` + `@theme`     | Done   |
| SVG `feTurbulence` grain texture on grid canvas + cells      | Done   |
| `bgColor` field on `BentoCell` type                          | Done   |
| Earth-tone color palette picker in `CellControls`            | Done   |
| `lib/bento/theme.ts` — EARTH_TONES constants                 | Done   |
| `lib/bento/gridCollision.ts` — pointer → grid position       | Done   |
| Install `@dnd-kit/core` + `@dnd-kit/utilities`               | Done   |
| `DndContext` + `useDraggable` in `BentoCell`                 | Done   |
| `MOVE_CELL` reducer with swap-on-conflict logic              | Done   |
| `ADD_CELL_AT` reducer for ghost tile clicks                  | Done   |
| Drag handle strip + delete button + resize handle on cells   | Done   |
| Ghost tiles for empty grid positions                         | Done   |
| Drop zone preview (caramel = valid, red = conflict)          | Done   |
| Drag overlay (`DragOverlay`) floating cell during drag       | Done   |
| Resize handle with pointer capture + live preview            | Done   |
| Overlap-aware +/− buttons in `CellControls`                  | Done   |
| All components re-themed (warm earth palette)                | Done   |
| `npm run build` passes (0 errors, 0 warnings)                | Done   |

---

## Previous Milestones

- Milestone 0 — Repository created (COMPLETE)
- Milestone 1 — Scaffold + Core Builder (COMPLETE)

---

## Dev Commands

```
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build + type check
npm run start    # Start production server
```

## File Map

```
src/
  app/
    globals.css         — Gen X Soft Club theme tokens, grain texture, reduced-motion
    layout.tsx          — root layout, metadata, Geist font
    page.tsx            — Server Component shell → <BentoEditor />
  components/
    bento/
      BentoEditor.tsx   — "use client"; useReducer state (all actions), full layout
      BentoGrid.tsx     — DndContext, drag handlers, resize handlers, ghost tiles,
                          drop preview, BentoCell orchestration
      BentoCell.tsx     — Draggable cell with drag handle, delete button,
                          resize handle, grain texture overlay
      GridControls.tsx  — cols/rows/gap inputs, earth-tone styled
      CellControls.tsx  — position/span/label/color picker/delete, overlap-aware
      CodeOutput.tsx    — syntax-highlighted output + copy-to-clipboard
  lib/
    bento/
      types.ts          — BentoConfig, GridConfig, BentoCell (+ bgGradient, borderWidth, borderColor,
                          shadow, padding, contentAlign, animation); GradientConfig, CellAnimation,
                          StatBlock types; StatBlock added to ContentBlock union
      generator.ts      — generateCode(config): string (pure, no React)
      utils.ts          — clampCell, findNextPosition, hasOverlap,
                          getEmptyPositions, generateId, GAP_PX
      theme.ts          — EARTH_TONES palette, DEFAULT_CELL_BG, INITIAL_CELL_COLORS
      gridCollision.ts  — pointerToGridPosition(pointer, gridRect, grid, gapPx)
docs/
  SPEC.md             — canonical feature spec (updated with Phase 2)
  DECISIONS.md        — all decisions logged
  STATE.md            — this file
  WORKFLOW.md         — Ralph Loop + anti-context-rot rules
```

## Dependency Added

| Package | Version | Reason |
|---------|---------|--------|
| `@dnd-kit/core` | latest | Accessible drag-to-move with custom grid collision |
| `@dnd-kit/utilities` | latest | CSS transform utilities for DragOverlay |

## Known Issues

- Cell labels are plain text only (Phase 3: rich content — images, text blocks, buttons)
- No undo/redo support
- No localStorage persistence (state resets on page refresh)
- `grid-rows-{n}` not in Tailwind v4 defaults beyond 6 — users may need to extend their config for rows > 6 in generated code
- Drag activation requires 6px pointer movement — intentional to avoid accidental drags on click

## Next Up (Milestone 4)

1. Per-cell rich content: heading, body text, button
2. Per-cell background image (URL input)
3. Export as complete standalone HTML file (with Tailwind CDN link)
4. localStorage persistence + auto-save
5. Undo/redo history (wrapping reducer with history stack)
6. Layout template presets (start from 5–6 predefined bento patterns)
