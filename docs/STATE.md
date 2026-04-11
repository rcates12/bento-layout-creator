# Bento Creator — Project State

> Updated at every handoff. Gives a snapshot of where the project stands.

---

## Current Milestone

**Milestone 3 — Plan C: Sharing & Productivity** (COMPLETE)

| Task                                                              | Status |
|-------------------------------------------------------------------|--------|
| `encodeConfig`/`decodeConfig` in `utils.ts`                      | Done   |
| URL hash sync (debounced `history.replaceState`)                  | Done   |
| Share button (copies URL, "Copied!" feedback)                     | Done   |
| JSON export tab in `CodeOutput`                                   | Done   |
| Import JSON modal + validation + `StatusBanner` errors            | Done   |
| `loadCustomPresets`/`saveCustomPresets` in `presets.ts`          | Done   |
| Custom presets section in `PresetPicker` (save + delete)          | Done   |
| `html-to-image` installed + dynamic import                        | Done   |
| `gridRef` forwarded from `BentoEditor` → `BentoGrid`             | Done   |
| PNG download with 1×/2×/3× pixel ratio selector in `CodeOutput`  | Done   |
| `selectedCellIds: string[]` added to `BentoState`                | Done   |
| `SELECT_MULTI_CELL`, `CLEAR_MULTI_SELECT`, `BULK_DELETE_CELLS`, `BULK_SET_BG_COLOR` actions | Done |
| Shift-click multi-select in `BentoCell` (amber ring)             | Done   |
| Bulk action bar (color picker + delete + dismiss)                 | Done   |
| Delete/Escape keyboard shortcuts for multi-select                 | Done   |
| `npm run build` passes (0 errors)                                 | Done   |

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

---

## Older Milestones

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
      BentoEditor.tsx   — "use client"; useReducer state (all actions), full layout,
                          URL hash sync, Share button, Import JSON modal, bulk action bar
      BentoGrid.tsx     — DndContext, drag handlers, resize handlers, ghost tiles,
                          drop preview, BentoCell orchestration, gridRef forwarding
      BentoCell.tsx     — Draggable cell with drag handle, delete button, resize handle,
                          multi-select amber ring, shift-click support
      GridControls.tsx  — cols/rows/gap inputs, earth-tone styled
      CellControls.tsx  — position/span/label/color picker/delete, overlap-aware
      CodeOutput.tsx    — syntax-highlighted output + copy + JSON tab + PNG export
      PresetPicker.tsx  — built-in presets + custom preset save/delete
  lib/
    bento/
      types.ts          — BentoConfig, GridConfig, BentoCell (+ bgColor)
      generator.ts      — generateCode(config): string (pure, no React)
      utils.ts          — clampCell, findNextPosition, hasOverlap,
                          getEmptyPositions, generateId, GAP_PX,
                          encodeConfig, decodeConfig
      theme.ts          — EARTH_TONES palette, DEFAULT_CELL_BG, INITIAL_CELL_COLORS
      gridCollision.ts  — pointerToGridPosition(pointer, gridRect, grid, gapPx)
      presets.ts        — PRESETS, BentoPreset type, loadCustomPresets, saveCustomPresets
docs/
  SPEC.md             — canonical feature spec (updated with Phase 2)
  DECISIONS.md        — all decisions logged
  STATE.md            — this file
  WORKFLOW.md         — Ralph Loop + anti-context-rot rules
```

## Dependencies

| Package | Version | Reason |
|---------|---------|--------|
| `@dnd-kit/core` | latest | Accessible drag-to-move with custom grid collision |
| `@dnd-kit/utilities` | latest | CSS transform utilities for DragOverlay |
| `html-to-image` | latest | PNG/image export from DOM element (dynamically imported) |

## Known Issues

- `grid-rows-{n}` not in Tailwind v4 defaults beyond 6 — users may need to extend their config for rows > 6 in generated code
- Drag activation requires 6px pointer movement — intentional to avoid accidental drags on click
- PNG export of cells with `bgImage` (external URLs) may be blocked by CORS in some browsers
- URL hash grows large for complex configs with many blocks — no compression applied (by design, see DECISIONS.md)
- Multi-select amber ring and primary selection ring can coexist visually if a cell is both selected and multi-selected (low priority)

## Next Up (Milestone 4)

1. Undo/redo support for multi-select bulk operations (currently skipped in history)
2. Multi-select drag — move all selected cells together
3. Per-cell SVG/icon support
4. Export presets as downloadable JSON files
5. Keyboard navigation between cells (arrow keys)
