# Workflow (Ralph Loop) + Anti-Context-Rot Rules

> Read this file before every task. It defines how work gets done on this project.

---

## Part 1 — Ralph Loop (must follow for every task)

### 1) READ
- `docs/SPEC.md`
- `docs/DECISIONS.md`
- `docs/STATE.md`
- Relevant source files

### 2) PLAN (5–10 bullets)
- What files you will touch
- What types/interfaces you will add or change
- Risks / edge cases

### 3) IMPLEMENT
- Smallest change that compiles + passes `npm run build`
- No unrelated refactors
- No new dependencies without a DECISIONS.md entry

### 4) VERIFY
- `npm run build` exits 0 (no TypeScript errors)
- `npm run dev` — manually verify the feature in the browser
- Check: no console errors, no visual regressions

### 5) HANDOFF SUMMARY (required)

Every completed task must end with this summary format:

```
## Handoff — <task title>

### What changed
- <file>: <one-line description>
- <file>: <one-line description>

### Types added/changed
- <interface or type change, or "none">

### Decisions made
- <decision> (also logged in DECISIONS.md)

### How to build
- npm run build

### How to test (browser steps)
1. npm run dev
2. <specific test step>
3. <specific test step>

### Known issues
- <issue or "none">

### Next suggested tasks
1. <next logical task>
2. <next logical task>
```

---

## Part 2 — Task Packet Template

Copy/paste this into the start of every task prompt:

```
Task: <short name>

Read first:
- docs/SPEC.md
- docs/DECISIONS.md
- docs/STATE.md

Goal (definition of done):
- <clear measurable outcome>

Files to inspect:
- <list>

Constraints:
- Next.js 15 App Router, TypeScript strict
- No new npm dependencies without DECISIONS.md entry
- Keep changes minimal — only what the task requires
- Do not rename existing types or reducer action types
- Do not refactor unrelated code
- Verify: npm run build exits 0

Acceptance tests:
1) npm run build exits 0
2) Feature works in browser (npm run dev)
3) No console errors
4) No visual regressions

Output required:
- Handoff summary format (see Part 1, step 5)
- Updated docs/STATE.md if milestone status changed
```

---

## Part 3 — Six Anti-Context-Rot Rules

### Rule 1 — Single source of truth
`docs/SPEC.md` is the canonical description of what the tool does. If SPEC.md and code disagree, SPEC.md wins — update the code, or add a DECISIONS.md entry explaining the deviation.

### Rule 2 — Type registry
All shared interfaces live in `src/lib/bento/types.ts`. No inline type for BentoCell, GridConfig, or BentoConfig may be invented in a component file. Add to types.ts first.

### Rule 3 — Small PR rule
One feature slice per task. Do not bundle unrelated changes. Log follow-up items in the handoff summary — do not fix them now.

### Rule 4 — Verification required
Every task ends with `npm run build` succeeding. The task is not done until the build is clean.

### Rule 5 — Decision log
Every notable choice gets a dated entry in `docs/DECISIONS.md`. "Notable" = anything a future reader would wonder "why did they do it this way?"

### Rule 6 — Guardrails in prompts
Every task prompt must include:
- **Do not refactor** code outside the task scope
- **Do not rename** existing type names or reducer action types
- **Minimal changes** — only what the task requires, nothing more

---

## Part 4 — Parallel Lanes

When running multiple tasks, each stays inside its lane:

| Lane | Scope              | Files                                          |
|------|--------------------|------------------------------------------------|
| A — Core logic   | Types, generator, utils | `src/lib/bento/*`                    |
| B — State        | Reducer, initial state  | `BentoEditor.tsx` (reducer only)     |
| C — UI           | Components only         | `src/components/bento/*`             |
| D — App shell    | Layout, page, CSS       | `src/app/*`                          |
| E — Docs         | Workflow docs           | `docs/*`                             |

**Rule:** Parallel agents must stay inside their lane. If a task must touch the reducer AND a component, schedule it sequentially — not in parallel.

---

## Quick Reference

| Document             | Purpose                                 | When to update       |
|----------------------|-----------------------------------------|----------------------|
| `docs/SPEC.md`       | What the tool does (canonical)          | When features change |
| `docs/DECISIONS.md`  | Why we made each choice                 | Every task (if new decision) |
| `docs/WORKFLOW.md`   | How we work (this file)                 | Rarely               |
| `docs/STATE.md`      | Current milestone + known issues        | Every handoff        |
| `src/lib/bento/types.ts` | Shared type registry                | When types change    |
