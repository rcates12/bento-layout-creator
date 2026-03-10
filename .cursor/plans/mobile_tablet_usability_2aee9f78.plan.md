---
name: Mobile/Tablet Usability
overview: Block phones (< 768px) with a branded "use a larger device" gate screen, and adapt the tool for genuine tablet usability through a collapsible sidebar, touch drag support, and larger touch targets.
todos:
  - id: mobile-gate
    content: Create MobileGate component shown below md breakpoint — branded block with logo, message, and "continue anyway" escape hatch
    status: completed
  - id: gate-in-layout
    content: Wire MobileGate into page.tsx or BentoEditor.tsx using CSS (block md:hidden / hidden md:flex) — no JS needed
    status: completed
  - id: sidebar-drawer
    content: Convert sidebar to a toggleable overlay drawer on tablet (md–lg) in BentoEditor.tsx, with header toggle button and backdrop dismiss
    status: completed
  - id: export-panel-width
    content: "Make export panel responsive: md:w-[480px] lg:w-[680px]"
    status: completed
  - id: header-collapse
    content: Collapse header button text labels to icons-only on tablet (below lg) to prevent overflow
    status: completed
  - id: touch-sensor
    content: Add TouchSensor to dnd-kit DndContext in BentoGrid.tsx with delay/tolerance activation constraint
    status: completed
  - id: touch-targets
    content: Increase touch targets to 44px minimum for drag handle, delete button, resize handle, and sidebar spinners
    status: completed
  - id: hover-to-selected
    content: Make hover-only cell controls (delete, quick-add bar, resize handle) visible when cell is selected in BentoCell.tsx
    status: completed
  - id: hover-none-css
    content: "Add @media (hover: none) rules in globals.css to always show controls on touch-primary devices"
    status: completed
  - id: canvas-overflow
    content: Add overflow-x-auto to canvas wrapper in BentoGrid.tsx so wide grids scroll instead of clipping on tablet
    status: completed
isProject: false
---

# Mobile & Tablet Usability Plan

## Strategy

- **Phone (< 768px `md`)**: Show a full-screen branded gate — the tool is not usable at this size. Include a polite message and a "continue anyway" escape hatch.
- **Tablet (768px – 1024px `lg`)**: Full tool, with a collapsible overlay sidebar, touch-enabled drag, larger hit targets, and selected-state control visibility.
- **Desktop (1024px+)**: No changes to current layout or behavior.

---

## 1. Mobile Gate Screen (new)

Create `**[src/components/bento/MobileGate.tsx](src/components/bento/MobileGate.tsx)`** — a self-contained full-screen component shown only below `md`.

Content:

- App logo / wordmark (matching the existing header style)
- Headline: e.g. *"Lintel works best on a larger screen"*
- Short body copy: e.g. *"This tool uses drag-and-drop and a multi-panel layout that needs at least a tablet-sized display to work well."*
- Primary CTA: *"Open on desktop"* — a `mailto:` or share-link option (optional, can be omitted)
- Escape hatch: a small muted *"Continue anyway →"* text link that `sessionStorage`-flags the dismissal so it doesn't re-appear on every page load within the same session

Visual style: matches the existing dark monochrome palette, uses the existing `--color-canvas` / `--color-accent` tokens, centered with the same `IBM Plex Mono` font. No new design language introduced.

### Wiring into the app

In `[src/app/page.tsx](src/app/page.tsx)`, wrap with CSS visibility — **no JS required for the gate itself**:

```tsx
<>
  {/* Shown only below md */}
  <div className="block md:hidden">
    <MobileGate />
  </div>
  {/* Shown only md and above */}
  <div className="hidden md:flex h-full">
    <BentoEditor />
  </div>
</>
```

The `sessionStorage` "continue anyway" flag is checked inside `MobileGate` to suppress its own display when the user has dismissed it.

---

## 2. Sidebar → Overlay Drawer (tablet)

In `[src/components/bento/BentoEditor.tsx](src/components/bento/BentoEditor.tsx)`:

- Add `isSidebarOpen: boolean` state, defaulting `true` on `lg+` and `false` on `md` via a `useEffect` + `window.matchMedia('(min-width: 1024px)')`.
- Below `lg:`, change `<aside>` from `relative` to `absolute left-0 z-40` with a `transition-transform`.
- Apply `translate-x-0` when open, `-translate-x-full` when closed — same pattern as the existing export panel.
- Add a **☰ Controls** toggle button in the header, `hidden lg:hidden` (visible only on tablet).
- Add a close `X` button at the top of the sidebar when in overlay mode.
- Tapping the semi-transparent backdrop closes it.

```
Tablet header: [☰] [Logo] ··· [Presets] [Undo/Redo] [Export] [Reset]
Desktop header: [Logo] ··· [Presets] [Help] [Undo/Redo] [Export] [Reset]  ← unchanged
```

---

## 3. Export Panel Width (tablet)

In `[src/components/bento/BentoEditor.tsx](src/components/bento/BentoEditor.tsx)`:

- Change `w-[680px]` → `w-full md:w-[480px] lg:w-[680px]`

---

## 4. Header Label Collapse (tablet)

Below `lg:`, show icons only on header buttons (text labels hidden):

- `<span className="hidden lg:inline">Export</span>` pattern on each labeled button
- This keeps the header single-row and uncluttered on tablet widths

---

## 5. Touch Drag Support

In `[src/components/bento/BentoGrid.tsx](src/components/bento/BentoGrid.tsx)`, add `TouchSensor` alongside `PointerSensor`:

```ts
useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
```

`delay: 200ms` prevents accidental drags during scrolls/taps. `tolerance: 8px` allows small finger movement without cancelling. The existing corner resize handle already uses Pointer Events API so it fires on touch too — it just needs a larger target (below).

---

## 6. Touch Target Sizes (44px minimum)

`**[BentoCell.tsx](src/components/bento/BentoCell.tsx)**`:

- Drag handle strip: `min-h-[44px]` via `@media (pointer: coarse)`
- Delete `×` button: `p-2` padding wrapper for adequate tap area
- Corner resize handle: `w-8 h-8` with a larger invisible pseudo-element tap target

`**[CellControls.tsx](src/components/bento/CellControls.tsx)**`:

- `SpinField` +/− buttons: `min-h-[2.75rem] min-w-[2.75rem]`
- Block drag handle and delete icons: `p-2` padding

---

## 7. Hover-Only Controls → Selection-Revealed

Currently delete, quick-add bar, and resize handle are `:hover`-gated and invisible on touch.

In `[BentoCell.tsx](src/components/bento/BentoCell.tsx)`:

- Controls already receive `isSelected` (derived from `selectedCellId === cell.id`)
- Change visibility class: `isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'`

In `[globals.css](src/app/globals.css)`:

- `@media (hover: none) { .hover-reveal { opacity: 1; } }` — fallback ensures any remaining hover-gated UI is always visible on touch-primary devices

---

## 8. Canvas Horizontal Scroll (tablet)

In the canvas wrapper in `[BentoEditor.tsx](src/components/bento/BentoEditor.tsx)`:

- Add `overflow-x-auto` so wide grids (e.g. 8+ columns) scroll horizontally rather than clipping or wrapping

---

## Files to Change

- `[src/app/page.tsx](src/app/page.tsx)` — wrap with mobile gate / tablet conditional rendering
- `[src/components/bento/MobileGate.tsx](src/components/bento/MobileGate.tsx)` — **new file**, branded block screen
- `[src/components/bento/BentoEditor.tsx](src/components/bento/BentoEditor.tsx)` — sidebar drawer, header collapse, export panel width
- `[src/components/bento/BentoGrid.tsx](src/components/bento/BentoGrid.tsx)` — `TouchSensor`, `overflow-x-auto`
- `[src/components/bento/BentoCell.tsx](src/components/bento/BentoCell.tsx)` — larger touch targets, selection-revealed controls
- `[src/components/bento/CellControls.tsx](src/components/bento/CellControls.tsx)` — touch target sizing
- `[src/app/globals.css](src/app/globals.css)` — `@media (hover: none)` rules, `@media (pointer: coarse)` sizing

