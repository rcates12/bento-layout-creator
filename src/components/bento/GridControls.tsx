"use client";

import { Columns2, Rows2, Expand } from "lucide-react";
import type { GridConfig } from "@/lib/bento/types";
import { Tooltip } from "./Tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs font-medium text-muted"
      >
        <span className="text-muted/70" aria-hidden="true">{icon}</span>
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Tooltip content={decreaseTooltip ?? `Remove ${label.toLowerCase()}`} side="bottom">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Decrease ${label}`}
            onClick={() => value > min && onChange(value - 1)}
            onMouseEnter={() => onDecreaseHover?.(true)}
            onMouseLeave={() => onDecreaseHover?.(false)}
            disabled={value <= min}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </Button>
        </Tooltip>

        <Input
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
          className="h-7 w-full text-center text-sm font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <Tooltip content={increaseTooltip ?? `Add ${label.toLowerCase()}`} side="bottom">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Increase ${label}`}
            onClick={() => value < max && onChange(value + 1)}
            onMouseEnter={() => onIncreaseHover?.(true)}
            onMouseLeave={() => onIncreaseHover?.(false)}
            disabled={value >= max}
          >
            <svg
              width="12"
              height="12"
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
          </Button>
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
    <section aria-label="Grid settings" className="flex flex-col gap-3">
      <h2 className="text-[13px] font-semibold text-cream">
        Grid
      </h2>

      <NumberInput
        id="grid-cols"
        label="Columns"
        icon={<Columns2 size={15} />}
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
        icon={<Rows2 size={15} />}
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
        <Label
          htmlFor="grid-gap"
          className="flex items-center gap-1.5 text-xs font-medium text-muted"
        >
          <span className="text-muted/60" aria-hidden="true">
            <Expand size={15} />
          </span>
          Gap
        </Label>
        <Tooltip content="Space between cells" side="right" className="w-full">
          <Select
            value={String(grid.gap)}
            onValueChange={(v) => v !== null && onUpdate({ gap: Number(v) })}
          >
            <SelectTrigger id="grid-gap" className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GAP_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Tooltip>
      </div>

    </section>
  );
}
