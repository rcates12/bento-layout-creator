"use client";

import { Columns2, Rows2, Expand } from "lucide-react";
import type { GridConfig } from "@/lib/bento/types";
import { Tooltip } from "./Tooltip";

interface GridControlsProps {
  grid: GridConfig;
  onUpdate: (partial: Partial<GridConfig>) => void;
  onColHoverDelta?: (delta: 1 | -1 | null) => void;
  onRowHoverDelta?: (delta: 1 | -1 | null) => void;
}

const GAP_OPTIONS = [
  { value: 0, label: "None — 0px" },
  { value: 2, label: "XS — 8px" },
  { value: 3, label: "SM — 12px" },
  { value: 4, label: "MD — 16px" },
  { value: 6, label: "LG — 24px" },
  { value: 8, label: "XL — 32px" },
];


interface NumberInputProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  decreaseTooltip?: string;
  increaseTooltip?: string;
  onChange: (value: number) => void;
  onDecreaseHover?: (hovering: boolean) => void;
  onIncreaseHover?: (hovering: boolean) => void;
}

function NumberInput({
  id,
  label,
  icon,
  value,
  min,
  max,
  decreaseTooltip,
  increaseTooltip,
  onChange,
  onDecreaseHover,
  onIncreaseHover,
}: NumberInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted"
      >
        <span className="text-muted/70" aria-hidden="true">{icon}</span>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Tooltip content={decreaseTooltip ?? `Remove ${label.toLowerCase()}`} side="bottom">
          <button
            type="button"
            aria-label={`Decrease ${label}`}
            onClick={() => value > min && onChange(value - 1)}
            onMouseEnter={() => onDecreaseHover?.(true)}
            onMouseLeave={() => onDecreaseHover?.(false)}
            disabled={value <= min}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-rim bg-surface-hi text-muted transition-colors duration-150 hover:border-rim-hi hover:bg-hover hover:text-cream disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </button>
        </Tooltip>

        <input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10);
            if (!isNaN(parsed) && parsed >= min && parsed <= max)
              onChange(parsed);
          }}
          spellCheck={false}
          autoComplete="off"
          className="h-7 w-full rounded-md border border-rim bg-surface-hi/80 px-2 text-center text-sm font-medium tabular-nums text-cream [appearance:textfield] transition-colors duration-150 focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <Tooltip content={increaseTooltip ?? `Add ${label.toLowerCase()}`} side="bottom">
          <button
            type="button"
            aria-label={`Increase ${label}`}
            onClick={() => value < max && onChange(value + 1)}
            onMouseEnter={() => onIncreaseHover?.(true)}
            onMouseLeave={() => onIncreaseHover?.(false)}
            disabled={value >= max}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-rim bg-surface-hi text-muted transition-colors duration-150 hover:border-rim-hi hover:bg-hover hover:text-cream disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

export function GridControls({
  grid,
  onUpdate,
  onColHoverDelta,
  onRowHoverDelta,
}: GridControlsProps) {
  return (
    <section aria-label="Grid settings" className="flex flex-col gap-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        Grid
      </h2>

      <NumberInput
        id="grid-cols"
        label="Columns"
        icon={<Columns2 size={12} />}
        value={grid.cols}
        min={1}
        max={12}
        decreaseTooltip="Remove a column from the right"
        increaseTooltip="Add a column to the right"
        onChange={(cols) => onUpdate({ cols })}
        onDecreaseHover={(h) => onColHoverDelta?.(h ? -1 : null)}
        onIncreaseHover={(h) => onColHoverDelta?.(h ? 1 : null)}
      />

      <NumberInput
        id="grid-rows"
        label="Rows"
        icon={<Rows2 size={12} />}
        value={grid.rows}
        min={1}
        max={12}
        decreaseTooltip="Remove a row from the bottom"
        increaseTooltip="Add a row to the bottom"
        onChange={(rows) => onUpdate({ rows })}
        onDecreaseHover={(h) => onRowHoverDelta?.(h ? -1 : null)}
        onIncreaseHover={(h) => onRowHoverDelta?.(h ? 1 : null)}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="grid-gap"
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted"
        >
          <span className="text-muted/70" aria-hidden="true">
            <Expand size={12} />
          </span>
          Gap
        </label>
        <Tooltip content="Space between cells" side="right" className="w-full">
          <select
            id="grid-gap"
            value={grid.gap}
            onChange={(e) => onUpdate({ gap: Number(e.target.value) })}
            className="h-8 w-full rounded-md border border-rim bg-surface-hi px-2 text-sm text-cream transition-colors duration-150 focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/40"
          >
            {GAP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Tooltip>
      </div>

    </section>
  );
}
