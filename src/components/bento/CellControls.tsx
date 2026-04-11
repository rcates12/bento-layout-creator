"use client";

"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Type,
  Image as ImageIcon,
  MousePointerClick,
  ChevronDown,
  Trash2,
  ImageOff,
  GripVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Paintbrush,
  LayoutGrid,
  Layers,
  TrendingUp,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import type {
  BentoCell,
  GridConfig,
  BorderRadius,
  ShadowLevel,
  ContentBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  StatBlock,
  FontSize,
  FontWeight,
  LetterSpacing,
  LineHeight,
  TextAlign,
  GradientConfig,
  CellAnimation,
} from "@/lib/bento/types";
import { EARTH_TONES, DEFAULT_CELL_BG, PLACEHOLDER_IMAGE } from "@/lib/bento/theme";
import { hasOverlap } from "@/lib/bento/utils";
import { generateId } from "@/lib/bento/utils";
import { Tooltip } from "./Tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup as ShadToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-xs font-semibold text-muted gap-0">
      {children}
    </Label>
  );
}

function Divider() {
  return <Separator className="bg-rim-hi/60 dark:bg-rim-hi/30" />;
}

function CollapsibleSection({
  icon: Icon,
  title,
  defaultOpen = true,
  children,
}: {
  icon: React.ElementType;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-rim bg-surface-hi/40 dark:bg-canvas/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/8"
      >
        <Icon size={14} className="shrink-0 text-zinc-500" aria-hidden="true" />
        <span className="flex-1 text-xs font-semibold text-cream">{title}</span>
        <ChevronDown
          size={12}
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-rim/60 px-3 py-3 flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  );
}

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-xs text-muted">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function MiniSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger size="sm" className="h-7 w-full text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MiniInput({
  value,
  placeholder,
  onChange,
  multiline,
}: {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  if (multiline) {
    return (
      <Textarea
        rows={2}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className="min-h-0 resize-none text-xs"
      />
    );
  }
  return (
    <Input
      type="text"
      value={value}
      placeholder={placeholder}
      autoComplete="off"
      onChange={(e) => onChange(e.target.value)}
      className="h-7 text-xs"
    />
  );
}

// Unified pill-style toggle — used for Fit, Style, Alignment and other single-select options
function PillToggle({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string; title?: string; icon?: React.ReactNode }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex w-full overflow-hidden rounded-lg border border-rim/70 bg-surface-hi">
      {options.map((o, i) => {
        const isOn = value === o.value;
        return (
          <Tooltip key={o.value} content={o.title ?? o.label} side="bottom" className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={isOn}
              aria-label={o.title ?? o.label}
              className={[
                "flex w-full items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-colors focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-accent/50",
                i > 0 ? "border-l border-rim/70" : "",
                isOn
                  ? "bg-accent/20 text-accent-hi"
                  : "text-muted hover:bg-accent/10 hover:text-cream/90",
              ].join(" ")}
            >
              {o.icon ?? o.label}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

// ─── Spin field ───────────────────────────────────────────────────────────────

interface SpinFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  decreaseDisabled: boolean;
  increaseDisabled: boolean;
  onChange: (value: number) => void;
}

function SpinField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  decreaseDisabled,
  increaseDisabled,
  onChange,
}: SpinFieldProps) {
  function stepped(v: number, delta: number): number {
    return Math.round((v + delta) / step) * step;
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="min-w-0 shrink-0 text-xs font-medium text-muted">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-xs"
          aria-label={`Decrease ${label}`}
          onClick={() => !decreaseDisabled && onChange(stepped(value, -step))}
          disabled={decreaseDisabled}
          className="bento-spin-btn"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        </Button>
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          autoComplete="off"
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v >= min && v <= max) onChange(Math.round(v / step) * step);
          }}
          className="h-6 w-10 text-center text-xs font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button
          variant="outline"
          size="icon-xs"
          aria-label={`Increase ${label}`}
          onClick={() => !increaseDisabled && onChange(stepped(value, step))}
          disabled={increaseDisabled}
          className="bento-spin-btn"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </Button>
      </div>
    </div>
  );
}

// ─── Border radius picker ─────────────────────────────────────────────────────

const RADIUS_OPTIONS: { value: BorderRadius; label: string; css: string }[] = [
  { value: "none", label: "None",  css: "0px" },
  { value: "sm",   label: "SM",   css: "4px" },
  { value: "md",   label: "MD",   css: "8px" },
  { value: "lg",   label: "LG",   css: "10px" },
  { value: "xl",   label: "XL",   css: "14px" },
  { value: "2xl",  label: "2XL",  css: "18px" },
  { value: "full", label: "Pill", css: "999px" },
];

function RadiusPicker({ value, onChange }: { value: BorderRadius; onChange: (v: BorderRadius) => void }) {
  return (
    <ShadToggleGroup
      value={[value]}
      onValueChange={(vals) => { const v = vals[0]; if (v) onChange(v as BorderRadius); }}
      className="flex gap-1 flex-wrap w-full"
      spacing={4}
    >
      {RADIUS_OPTIONS.map((opt) => (
        <Tooltip key={opt.value} content={opt.label} side="bottom">
          <ToggleGroupItem
            value={opt.value}
            aria-label={`Set border radius to ${opt.label}`}
            className="h-7 w-7 shrink-0 border border-rim bg-surface-hi text-muted hover:bg-hover/60 hover:border-rim-hi hover:text-cream/90 data-[state=on]:border-accent/40 data-[state=on]:bg-accent/15 data-[state=on]:text-accent-hi"
            style={{ borderRadius: opt.css }}
          >
            <div
              className="h-3 w-3 border border-current"
              style={{ borderRadius: opt.css === "999px" ? "999px" : `calc(${opt.css} * 0.6)` }}
              aria-hidden="true"
            />
          </ToggleGroupItem>
        </Tooltip>
      ))}
    </ShadToggleGroup>
  );
}

// ─── Color picker ─────────────────────────────────────────────────────────────

const QUICK_COLORS: { name: string; hex: string }[] = [
  { name: "White", hex: "#ffffff" },
  { name: "Ink", hex: "#18181b" },
  { name: "Indigo", hex: "#1e1b4b" },
  { name: "Violet", hex: "#6d28d9" },
  { name: "Sky", hex: "#0369a1" },
  { name: "Mint", hex: "#f0fdf4" },
  { name: "Pearl", hex: "#f8fafc" },
  { name: "Lavender", hex: "#ede9fe" },
];

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const [hexInput, setHexInput] = useState(value);

  // Keep local input in sync when value changes externally (e.g. swatch click)
  useEffect(() => {
    setHexInput(value);
  }, [value]);

  function handleHexInput(raw: string) {
    const v = raw.startsWith("#") ? raw : `#${raw}`;
    setHexInput(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
  }

  const isPreset = QUICK_COLORS.some((c) => c.hex.toLowerCase() === value.toLowerCase()) ||
    EARTH_TONES.some((c) => c.hex.toLowerCase() === value.toLowerCase());

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {QUICK_COLORS.map(({ name, hex }) => {
          const active = hex.toLowerCase() === value.toLowerCase();
          return (
            <Tooltip key={hex} content={name} side="bottom">
              <button
                type="button"
                onClick={() => onChange(hex)}
                aria-label={`Set to ${name}`}
                aria-pressed={active}
                style={{ backgroundColor: hex }}
                className={[
                  "relative h-6 w-6 rounded-md border-2 transition-[border-color,transform] duration-150",
                  "hover:scale-110 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                  active
                    ? "border-accent-hi ring-1 ring-accent/60"
                    : "border-rim hover:border-white/30",
                ].join(" ")}
              >
                {active && (
                  <svg
                    className="absolute inset-0 m-auto"
                    width="10" height="10" viewBox="0 0 24 24"
                    fill="none" stroke={hex === "#ffffff" || hex === "#f8fafc" || hex === "#f0fdf4" || hex === "#ede9fe" ? "#7c3aed" : "#ffffff"}
                    strokeWidth="3" aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            </Tooltip>
          );
        })}

        {/* Custom color picker via react-colorful popover */}
        <Popover className="relative">
          <Tooltip content="Custom color" side="bottom">
            <PopoverButton
              as="button"
              type="button"
              style={{ backgroundColor: !isPreset ? value : undefined }}
              aria-label="Pick a custom color"
              className={[
                "relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-2 transition-[border-color,transform] duration-150",
                "hover:scale-110 active:scale-95 focus:outline-none",
                !isPreset
                  ? "border-accent-hi ring-1 ring-accent/60"
                  : "border-rim hover:border-rim-hi bg-surface-hi",
              ].join(" ")}
            >
              {isPreset ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              ) : (
                <svg className="absolute inset-0 m-auto" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </PopoverButton>
          </Tooltip>
          <PopoverPanel
            anchor={{ to: "bottom end", gap: 8 }}
            className="z-[9999] w-60 overflow-hidden rounded-xl border border-rim bg-surface-hi p-3 shadow-2xl shadow-black/60"
          >
            {({ close }) => (
              <div className="flex flex-col gap-2">
                <HexColorPicker color={value} onChange={(c) => { onChange(c); setHexInput(c); }} style={{ width: "100%" }} />
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 shrink-0 rounded border border-rim"
                    style={{ backgroundColor: value }}
                    aria-hidden="true"
                  />
                  <Input
                    type="text"
                    value={hexInput}
                    onChange={(e) => handleHexInput(e.target.value)}
                    onBlur={() => { if (!/^#[0-9a-fA-F]{6}$/.test(hexInput)) setHexInput(value); }}
                    spellCheck={false}
                    autoComplete="off"
                    className="h-6 w-40 font-mono text-[11px] text-muted"
                  />
                </div>
              </div>
            )}
          </PopoverPanel>
        </Popover>
      </div>

      {/* Hex input below swatches */}
      <div className="flex items-center gap-2">
        <div
          className="h-5 w-5 shrink-0 rounded border border-rim"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
        <Input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexInput(e.target.value)}
          onBlur={() => { if (!/^#[0-9a-fA-F]{6}$/.test(hexInput)) setHexInput(value); }}
          spellCheck={false}
          autoComplete="off"
          placeholder="#000000"
          className="h-6 flex-1 font-mono text-[11px] text-muted"
        />
      </div>
    </div>
  );
}

// ─── Block editors ────────────────────────────────────────────────────────────

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: "xs", label: "XS" }, { value: "sm", label: "SM" },
  { value: "base", label: "Base" }, { value: "lg", label: "LG" },
  { value: "xl", label: "XL" }, { value: "2xl", label: "2XL" },
  { value: "3xl", label: "3XL" },
];

const FONT_WEIGHT_OPTIONS: { value: FontWeight; label: string }[] = [
  { value: "normal", label: "Normal" }, { value: "medium", label: "Medium" },
  { value: "semibold", label: "Semibold" }, { value: "bold", label: "Bold" },
];

const TRACKING_OPTIONS: { value: LetterSpacing; label: string }[] = [
  { value: "tighter", label: "Tighter" }, { value: "tight", label: "Tight" },
  { value: "normal", label: "Normal" }, { value: "wide", label: "Wide" },
  { value: "wider", label: "Wider" }, { value: "widest", label: "Widest" },
];

const LEADING_OPTIONS: { value: LineHeight; label: string }[] = [
  { value: "none", label: "None" }, { value: "tight", label: "Tight" },
  { value: "snug", label: "Snug" }, { value: "normal", label: "Normal" },
  { value: "relaxed", label: "Relaxed" }, { value: "loose", label: "Loose" },
];

const ALIGN_OPTIONS: { value: TextAlign; label: string; title: string; icon: React.ReactNode }[] = [
  { value: "left",   label: "Left",   title: "Align left",   icon: <AlignLeft   size={14} aria-hidden="true" /> },
  { value: "center", label: "Center", title: "Align center", icon: <AlignCenter size={14} aria-hidden="true" /> },
  { value: "right",  label: "Right",  title: "Align right",  icon: <AlignRight  size={14} aria-hidden="true" /> },
];

function TextBlockEditor({
  block,
  onUpdate,
}: {
  block: TextBlock;
  onUpdate: (updates: Partial<TextBlock>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <SectionLabel>Text</SectionLabel>
        <MiniInput
          value={block.text}
          placeholder="Enter text…"
          onChange={(v) => onUpdate({ text: v })}
          multiline
        />
      </div>

      <div className="flex flex-col gap-2">
        <ControlRow label="Size">
          <MiniSelect
            value={block.fontSize ?? "sm"}
            options={FONT_SIZE_OPTIONS}
            onChange={(v) => onUpdate({ fontSize: v as FontSize })}
          />
        </ControlRow>
        <ControlRow label="Weight">
          <MiniSelect
            value={block.fontWeight ?? "normal"}
            options={FONT_WEIGHT_OPTIONS}
            onChange={(v) => onUpdate({ fontWeight: v as FontWeight })}
          />
        </ControlRow>
        <ControlRow label="Tracking">
          <MiniSelect
            value={block.tracking ?? "normal"}
            options={TRACKING_OPTIONS}
            onChange={(v) => onUpdate({ tracking: v as LetterSpacing })}
          />
        </ControlRow>
        <ControlRow label="Leading">
          <MiniSelect
            value={block.leading ?? "normal"}
            options={LEADING_OPTIONS}
            onChange={(v) => onUpdate({ leading: v as LineHeight })}
          />
        </ControlRow>
      </div>

      <div className="flex flex-col gap-1">
        <SectionLabel>Alignment</SectionLabel>
        <PillToggle
          value={block.align ?? "left"}
          options={ALIGN_OPTIONS}
          onChange={(v) => onUpdate({ align: v as TextAlign })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionLabel>Color</SectionLabel>
        <ColorPicker
          value={block.color ?? "#ffffff"}
          onChange={(v) => onUpdate({ color: v })}
        />
      </div>
    </div>
  );
}

const SHADOW_OPTIONS: { value: ShadowLevel; label: string; title: string }[] = [
  { value: "none", label: "None", title: "No shadow" },
  { value: "sm",   label: "SM",   title: "Small shadow" },
  { value: "md",   label: "MD",   title: "Medium shadow" },
  { value: "lg",   label: "LG",   title: "Large shadow" },
  { value: "xl",   label: "XL",   title: "Extra-large shadow" },
];

function ShadowPicker({
  value,
  onChange,
}: {
  value: ShadowLevel;
  onChange: (v: ShadowLevel) => void;
}) {
  return (
    <PillToggle
      value={value}
      options={SHADOW_OPTIONS}
      onChange={(v) => onChange(v as ShadowLevel)}
    />
  );
}

const BORDER_WIDTH_OPTIONS: { value: string; label: string; title: string }[] = [
  { value: "0", label: "None", title: "No border" },
  { value: "1", label: "1px",  title: "1px border" },
  { value: "2", label: "2px",  title: "2px border" },
  { value: "4", label: "4px",  title: "4px border" },
];

function BorderWidthPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <PillToggle
      value={value}
      options={BORDER_WIDTH_OPTIONS}
      onChange={onChange}
    />
  );
}

function ImageBlockEditor({
  block,
  onUpdate,
}: {
  block: ImageBlock;
  onUpdate: (updates: Partial<ImageBlock>) => void;
}) {
  const hasBorder = (block.borderWidth ?? 0) > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Fit */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Fit</SectionLabel>
        <PillToggle
          value={block.fit ?? "cover"}
          options={[
            { value: "cover", label: "Cover", title: "Cover — fill the area" },
            { value: "contain", label: "Contain", title: "Contain — show the full image" },
          ]}
          onChange={(v) => onUpdate({ fit: v as "cover" | "contain" })}
        />
      </div>

      {/* Border radius */}
      <div className="flex flex-col gap-1.5">
        <SectionLabel>Corners</SectionLabel>
        <RadiusPicker
          value={block.borderRadius ?? "none"}
          onChange={(v) => onUpdate({ borderRadius: v })}
        />
      </div>

      {/* Shadow */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Shadow</SectionLabel>
        <ShadowPicker
          value={block.shadow ?? "none"}
          onChange={(v) => onUpdate({ shadow: v })}
        />
      </div>

      {/* Border */}
      <div className="flex flex-col gap-1.5">
        <SectionLabel>Border</SectionLabel>
        <BorderWidthPicker
          value={String(block.borderWidth ?? 0)}
          onChange={(v) => onUpdate({ borderWidth: Number(v) })}
        />
        {hasBorder && (
          <div className="flex flex-col gap-1 pt-1">
            <SectionLabel>Border Color</SectionLabel>
            <ColorPicker
              value={block.borderColor ?? "#ffffff"}
              onChange={(v) => onUpdate({ borderColor: v })}
            />
          </div>
        )}
      </div>

      {/* Alt text */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Alt Text</SectionLabel>
        <MiniInput
          value={block.alt ?? ""}
          placeholder="Describe the image…"
          onChange={(v) => onUpdate({ alt: v })}
        />
      </div>
    </div>
  );
}

const BTN_VARIANT_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
];

const BTN_SIZE_OPTIONS = [
  { value: "sm", label: "SM" }, { value: "md", label: "MD" }, { value: "lg", label: "LG" },
];

function ButtonBlockEditor({
  block,
  onUpdate,
}: {
  block: ButtonBlock;
  onUpdate: (updates: Partial<ButtonBlock>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <SectionLabel>Label</SectionLabel>
        <MiniInput
          value={block.label}
          placeholder="Button label…"
          onChange={(v) => onUpdate({ label: v })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <SectionLabel>Style</SectionLabel>
        <PillToggle
          value={block.variant ?? "solid"}
          options={BTN_VARIANT_OPTIONS}
          onChange={(v) => onUpdate({ variant: v as ButtonBlock["variant"] })}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <ControlRow label="Size">
          <MiniSelect
            value={block.size ?? "md"}
            options={BTN_SIZE_OPTIONS}
            onChange={(v) => onUpdate({ size: v as ButtonBlock["size"] })}
          />
        </ControlRow>
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionLabel>Corners</SectionLabel>
        <RadiusPicker
          value={block.borderRadius ?? "lg"}
          onChange={(v) => onUpdate({ borderRadius: v })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionLabel>
          {block.variant === "solid" ? "Background" : "Accent color"}
        </SectionLabel>
        <ColorPicker
          value={block.bgColor ?? "#ffffff"}
          onChange={(v) => onUpdate({ bgColor: v })}
        />
      </div>

      {block.variant === "solid" && (
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Text color</SectionLabel>
          <ColorPicker
            value={block.textColor ?? "#000000"}
            onChange={(v) => onUpdate({ textColor: v })}
          />
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={block.fullWidth ?? false}
          onChange={(e) => onUpdate({ fullWidth: e.target.checked })}
          className="h-3.5 w-3.5 rounded border-rim accent-accent"
        />
        <span className="text-xs text-muted">Full width</span>
      </label>
    </div>
  );
}

function StatBlockEditor({
  block,
  onUpdate,
}: {
  block: StatBlock;
  onUpdate: (updates: Partial<StatBlock>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <SectionLabel>Value</SectionLabel>
        <MiniInput
          value={block.value}
          placeholder="e.g. 42K"
          onChange={(v) => onUpdate({ value: v })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <SectionLabel>Label</SectionLabel>
        <MiniInput
          value={block.label ?? ""}
          placeholder="e.g. Monthly Users"
          onChange={(v) => onUpdate({ label: v })}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-3">
        <ControlRow label="Prefix">
          <MiniInput
            value={block.prefix ?? ""}
            placeholder="$"
            onChange={(v) => onUpdate({ prefix: v })}
          />
        </ControlRow>
        <ControlRow label="Suffix">
          <MiniInput
            value={block.suffix ?? ""}
            placeholder="%"
            onChange={(v) => onUpdate({ suffix: v })}
          />
        </ControlRow>
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionLabel>Value color</SectionLabel>
        <ColorPicker
          value={block.valueColor ?? "#ffffff"}
          onChange={(v) => onUpdate({ valueColor: v })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionLabel>Label color</SectionLabel>
        <ColorPicker
          value={block.labelColor ?? "#888888"}
          onChange={(v) => onUpdate({ labelColor: v })}
        />
      </div>
    </div>
  );
}

// ─── Block card ───────────────────────────────────────────────────────────────

const BLOCK_TYPE_META = {
  text:   { icon: Type,             label: "Text",   color: "text-blue-400" },
  image:  { icon: ImageIcon,        label: "Image",  color: "text-emerald-400" },
  button: { icon: MousePointerClick, label: "Button", color: "text-amber-400" },
  stat:   { icon: TrendingUp,        label: "Stat",   color: "text-violet-400" },
};

interface BlockCardProps {
  block: ContentBlock;
  isFirst: boolean;
  isLast: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  onUpdate: (updates: Partial<ContentBlock>) => void;
  onRemove: () => void;
}

function BlockCard({
  block,
  isFirst: _isFirst,
  isLast: _isLast,
  dragHandleProps,
  isDragging,
  onUpdate,
  onRemove,
}: BlockCardProps) {
  const [open, setOpen] = useState(true);
  const meta = BLOCK_TYPE_META[block.type];
  const Icon = meta.icon;

  return (
    <div
      className={[
        "rounded-lg border overflow-hidden transition-shadow duration-150",
        isDragging ? "border-accent/60 shadow-lg shadow-black/40" : "border-rim",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center bg-surface-hi border-b border-rim/40 min-h-[34px]">
        {/* Drag handle with tooltip */}
        <Tooltip content="Move" side="top">
          <button
            type="button"
            aria-label={`Drag to reorder ${meta.label} block`}
            className="bento-block-action flex h-full items-center px-2 cursor-grab text-muted/50 hover:text-muted transition-colors active:cursor-grabbing"
            {...dragHandleProps}
          >
            <GripVertical size={14} aria-hidden="true" />
          </button>
        </Tooltip>

        {/* Title — full-height click target for expand/collapse */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 min-w-0 self-stretch items-center gap-2 px-1.5 py-2 text-left transition-colors hover:bg-accent/8"
          aria-expanded={open}
        >
          <Icon size={13} className={`shrink-0 ${meta.color}`} aria-hidden="true" />
          <span className="text-xs font-medium text-cream leading-none">{meta.label}</span>
          <ChevronDown
            size={12}
            aria-hidden="true"
            className={`ml-auto mr-0.5 shrink-0 text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Remove */}
        <Tooltip content="Remove block" side="top">
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${meta.label} block`}
            className="bento-block-action flex h-full items-center px-2 text-muted/60 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} aria-hidden="true" />
          </button>
        </Tooltip>
      </div>

      {/* Body */}
      {open && (
        <div className="p-3 bg-surface/50 dark:bg-canvas/40">
          {block.type === "text" && (
            <TextBlockEditor block={block} onUpdate={(u) => onUpdate(u as Partial<TextBlock>)} />
          )}
          {block.type === "image" && (
            <ImageBlockEditor block={block} onUpdate={(u) => onUpdate(u as Partial<ImageBlock>)} />
          )}
          {block.type === "button" && (
            <ButtonBlockEditor block={block} onUpdate={(u) => onUpdate(u as Partial<ButtonBlock>)} />
          )}
          {block.type === "stat" && (
            <StatBlockEditor block={block} onUpdate={(u) => onUpdate(u as Partial<StatBlock>)} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sortable block card ───────────────────────────────────────────────────────

function SortableBlockCard(props: Omit<BlockCardProps, "dragHandleProps" | "isDragging" | "isFirst" | "isLast"> & { isFirst?: boolean; isLast?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.block.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <BlockCard
        {...props}
        isFirst={props.isFirst ?? false}
        isLast={props.isLast ?? false}
        dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>}
        isDragging={isDragging}
      />
    </div>
  );
}

// ─── Add block button ─────────────────────────────────────────────────────────

function AddBlockButton({
  icon: Icon,
  label,
  color,
  tintClass,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  tintClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 h-8 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${tintClass}`}
    >
      <Icon size={14} className={color} aria-hidden="true" />
      {label}
    </button>
  );
}

// ─── Main props ───────────────────────────────────────────────────────────────

interface CellControlsProps {
  cell: BentoCell;
  grid: GridConfig;
  cells: BentoCell[];
  onUpdate: (updates: Partial<BentoCell>) => void;
  onDelete: () => void;
  onAddBlock: (block: ContentBlock) => void;
  onUpdateBlock: (blockId: string, updates: Partial<ContentBlock>) => void;
  onRemoveBlock: (blockId: string) => void;
  onReorderBlocksFull: (blockIds: string[]) => void;
  onSetBgImage: (src: string | null) => void;
  onDuplicateCell: () => void;
  canDuplicate: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CellControls({
  cell,
  grid,
  cells,
  onUpdate,
  onDelete,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onReorderBlocksFull,
  onSetBgImage,
  onDuplicateCell,
  canDuplicate,
}: CellControlsProps) {
  const otherCells = cells.filter((c) => c.id !== cell.id);

  function wouldOverlap(updates: Partial<BentoCell>): boolean {
    const proposed = { ...cell, ...updates };
    if (
      proposed.colStart < 1 ||
      proposed.rowStart < 1 ||
      proposed.colStart + proposed.colSpan - 1 > grid.cols ||
      proposed.rowStart + proposed.rowSpan - 1 > grid.rows
    )
      return true;
    return hasOverlap(proposed, otherCells);
  }

  const maxColSpan = grid.cols - cell.colStart + 1;
  const maxRowSpan = grid.rows - cell.rowStart + 1;
  const maxColStart = grid.cols - cell.colSpan + 1;
  const maxRowStart = grid.rows - cell.rowSpan + 1;

  const blocks = cell.blocks ?? [];

  function handleAddBlock(type: ContentBlock["type"]) {
    if (type === "text") {
      onAddBlock({ id: generateId(), type: "text", text: "", fontSize: "sm", fontWeight: "normal" });
    } else if (type === "image") {
      onAddBlock({ id: generateId(), type: "image", src: PLACEHOLDER_IMAGE, fit: "cover" });
    } else if (type === "button") {
      onAddBlock({ id: generateId(), type: "button", label: "Click me", variant: "solid", size: "md" });
    } else if (type === "stat") {
      onAddBlock({ id: generateId(), type: "stat", value: "42K", label: "Label" });
    }
  }

  // dnd-kit sensors for sortable blocks
  const blockSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleBlockDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = blocks.findIndex((b) => b.id === active.id);
      const newIdx = blocks.findIndex((b) => b.id === over.id);
      const newOrder = arrayMove(blocks, oldIdx, newIdx).map((b) => b.id);
      onReorderBlocksFull(newOrder);
    }
  }

  return (
    <section aria-label="Cell settings" className="flex flex-col gap-3">

      {/* ── Cell title + label ── */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[13px] font-semibold text-cream">Cell</h2>
        <Input
          id="cell-label"
          type="text"
          value={cell.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Internal label…"
          autoComplete="off"
        />
      </div>

      {/* ── Content ── */}
      <CollapsibleSection icon={Layers} title="Content" defaultOpen>
        <div className="flex flex-wrap gap-1.5">
          <AddBlockButton
            icon={Type}
            label="Text"
            color="text-blue-400"
            tintClass="border-blue-500/20 bg-blue-500/5 text-muted hover:bg-blue-500/15 hover:text-cream hover:border-blue-500/30"
            onClick={() => handleAddBlock("text")}
          />
          <AddBlockButton
            icon={ImageIcon}
            label="Image"
            color="text-emerald-400"
            tintClass="border-emerald-500/20 bg-emerald-500/5 text-muted hover:bg-emerald-500/15 hover:text-cream hover:border-emerald-500/30"
            onClick={() => handleAddBlock("image")}
          />
          <AddBlockButton
            icon={MousePointerClick}
            label="Button"
            color="text-amber-400"
            tintClass="border-amber-500/20 bg-amber-500/5 text-muted hover:bg-amber-500/15 hover:text-cream hover:border-amber-500/30"
            onClick={() => handleAddBlock("button")}
          />
          <AddBlockButton
            icon={TrendingUp}
            label="Stat"
            color="text-violet-400"
            tintClass="border-violet-500/20 bg-violet-500/5 text-muted hover:bg-violet-500/15 hover:text-cream hover:border-violet-500/30"
            onClick={() => handleAddBlock("stat")}
          />
        </div>

        {blocks.length === 0 ? (
          <p className="rounded-md border border-dashed border-accent/20 dark:border-rim/60 px-3 py-3 text-center text-xs text-muted/50 leading-relaxed">
            No blocks yet — add one above
          </p>
        ) : (
          <DndContext
            sensors={blockSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleBlockDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {blocks.map((block) => (
                  <SortableBlockCard
                    key={block.id}
                    block={block}
                    onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                    onRemove={() => onRemoveBlock(block.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CollapsibleSection>

      {/* ── Appearance ── */}
      <CollapsibleSection icon={Paintbrush} title="Appearance" defaultOpen>
        {/* Background image */}
        <SectionLabel>Background</SectionLabel>
        {cell.bgImage ? (
          <div className="flex items-center gap-2 rounded-md border border-rim bg-surface-hi/40 p-2">
            <div
              className="h-9 w-14 shrink-0 rounded border border-rim bg-cover bg-center"
              style={{ backgroundImage: `url(${cell.bgImage})` }}
              aria-hidden="true"
            />
            <span className="flex-1 truncate text-xs text-muted/70">Placeholder image</span>
            <Tooltip content="Remove background image" side="left">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onSetBgImage(null)}
                aria-label="Remove background image"
                className="hover:border-red-500/40 hover:text-red-400 focus-visible:ring-red-500"
              >
                <ImageOff size={14} aria-hidden="true" />
              </Button>
            </Tooltip>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => onSetBgImage(PLACEHOLDER_IMAGE)}
            className="h-9 w-full gap-2 border-dashed text-xs text-muted"
          >
            <ImageIcon size={14} aria-hidden="true" />
            Use placeholder image
          </Button>
        )}

        {/* Color */}
        <div className={`flex flex-col gap-1.5 ${cell.bgGradient ? "opacity-40" : ""}`}>
          <SectionLabel>Color</SectionLabel>
          <ColorPicker
            value={cell.bgColor ?? DEFAULT_CELL_BG}
            onChange={(hex) => onUpdate({ bgColor: hex })}
          />
        </div>

        {/* Gradient toggle + controls */}
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={!!cell.bgGradient}
              onChange={(e) => {
                if (e.target.checked) {
                  const grad: GradientConfig = {
                    type: "linear",
                    angle: 135,
                    stops: [cell.bgColor ?? DEFAULT_CELL_BG, "#1e1b4b"],
                  };
                  onUpdate({ bgGradient: grad });
                } else {
                  onUpdate({ bgGradient: undefined });
                }
              }}
              className="h-3.5 w-3.5 rounded border-rim accent-accent"
            />
            <span className="text-xs text-muted">Use gradient</span>
          </label>

          {cell.bgGradient && (
            <div className="flex flex-col gap-2 rounded-md border border-rim/60 bg-surface/50 p-2">
              <div className="flex flex-col gap-1.5">
                <SectionLabel>Start color</SectionLabel>
                <ColorPicker
                  value={cell.bgGradient.stops[0]}
                  onChange={(hex) => onUpdate({ bgGradient: { ...cell.bgGradient!, stops: [hex, cell.bgGradient!.stops[1]] } })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <SectionLabel>End color</SectionLabel>
                <ColorPicker
                  value={cell.bgGradient.stops[1]}
                  onChange={(hex) => onUpdate({ bgGradient: { ...cell.bgGradient!, stops: [cell.bgGradient!.stops[0], hex] } })}
                />
              </div>
              <ControlRow label="Angle">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={cell.bgGradient.angle}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 0 && v <= 360) {
                        onUpdate({ bgGradient: { ...cell.bgGradient!, angle: v } });
                      }
                    }}
                    className="h-7 w-16 rounded border border-rim bg-surface-hi px-2 text-xs tabular-nums text-cream focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                  <span className="text-xs text-muted">°</span>
                </div>
              </ControlRow>
            </div>
          )}
        </div>

        <Divider />

        {/* Corners */}
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Corners</SectionLabel>
          <RadiusPicker
            value={cell.borderRadius ?? "2xl"}
            onChange={(v) => onUpdate({ borderRadius: v })}
          />
        </div>

        <Divider />

        {/* Border */}
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Border</SectionLabel>
          <BorderWidthPicker
            value={String(cell.borderWidth ?? 0)}
            onChange={(v) => onUpdate({ borderWidth: Number(v) })}
          />
          {(cell.borderWidth ?? 0) > 0 && (
            <div className="flex flex-col gap-1 pt-1">
              <SectionLabel>Border Color</SectionLabel>
              <ColorPicker
                value={cell.borderColor ?? "#ffffff"}
                onChange={(v) => onUpdate({ borderColor: v })}
              />
            </div>
          )}
        </div>

        {/* Shadow */}
        <div className="flex flex-col gap-1">
          <SectionLabel>Shadow</SectionLabel>
          <ShadowPicker
            value={cell.shadow ?? "none"}
            onChange={(v) => onUpdate({ shadow: v })}
          />
        </div>

        <Divider />

        {/* Padding */}
        <div className="flex flex-col gap-1">
          <SectionLabel>Padding</SectionLabel>
          <PillToggle
            value={cell.padding ?? "md"}
            options={[
              { value: "none", label: "None" },
              { value: "sm",   label: "SM" },
              { value: "md",   label: "MD" },
              { value: "lg",   label: "LG" },
            ]}
            onChange={(v) => onUpdate({ padding: v as BentoCell["padding"] })}
          />
        </div>

        {/* Content alignment */}
        <div className="flex flex-col gap-1">
          <SectionLabel>Content align</SectionLabel>
          <PillToggle
            value={cell.contentAlign ?? "start"}
            options={[
              { value: "start",  label: "Top" },
              { value: "center", label: "Center" },
              { value: "end",    label: "Bottom" },
            ]}
            onChange={(v) => onUpdate({ contentAlign: v as BentoCell["contentAlign"] })}
          />
        </div>

        <Divider />

        {/* Entrance animation */}
        <div className="flex flex-col gap-1">
          <SectionLabel>Entrance animation</SectionLabel>
          <PillToggle
            value={cell.animation ?? "none"}
            options={[
              { value: "none",        label: "None" },
              { value: "fade-in",     label: "Fade" },
              { value: "slide-up",    label: "Up" },
              { value: "slide-right", label: "Right" },
              { value: "pop",         label: "Pop" },
            ]}
            onChange={(v) => onUpdate({ animation: v as CellAnimation })}
          />
        </div>
      </CollapsibleSection>

      {/* ── Layout ── */}
      <CollapsibleSection icon={LayoutGrid} title="Layout" defaultOpen={false}>
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-medium text-muted">Position</p>
          <SpinField
            id="cell-col-start"
            label="Col Start"
            value={cell.colStart}
            min={1}
            max={maxColStart}
            decreaseDisabled={cell.colStart <= 1 || wouldOverlap({ colStart: cell.colStart - 1 })}
            increaseDisabled={cell.colStart >= maxColStart || wouldOverlap({ colStart: cell.colStart + 1 })}
            onChange={(colStart) => onUpdate({ colStart })}
          />
          <SpinField
            id="cell-row-start"
            label="Row Start"
            value={cell.rowStart}
            min={1}
            max={maxRowStart}
            decreaseDisabled={cell.rowStart <= 1 || wouldOverlap({ rowStart: cell.rowStart - 1 })}
            increaseDisabled={cell.rowStart >= maxRowStart || wouldOverlap({ rowStart: cell.rowStart + 1 })}
            onChange={(rowStart) => onUpdate({ rowStart })}
          />
        </div>

        <Divider />

        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-medium text-muted">Span</p>
          <SpinField
            id="cell-col-span"
            label="Col Span"
            value={cell.colSpan}
            min={1}
            max={maxColSpan}
            decreaseDisabled={cell.colSpan <= 1}
            increaseDisabled={cell.colSpan >= maxColSpan || wouldOverlap({ colSpan: cell.colSpan + 1 })}
            onChange={(colSpan) => onUpdate({ colSpan })}
          />
          <SpinField
            id="cell-row-span"
            label="Row Span"
            value={cell.rowSpan}
            min={1}
            max={maxRowSpan}
            decreaseDisabled={cell.rowSpan <= 1}
            increaseDisabled={cell.rowSpan >= maxRowSpan || wouldOverlap({ rowSpan: cell.rowSpan + 1 })}
            onChange={(rowSpan) => onUpdate({ rowSpan })}
          />
        </div>
      </CollapsibleSection>

      {/* ── Actions ── */}
      <div className="flex gap-2 pt-1">
        <Tooltip content={!canDuplicate ? "Grid is full" : "Duplicate cell (Ctrl+D)"} side="top">
          <Button
            variant="outline"
            size="sm"
            onClick={onDuplicateCell}
            disabled={!canDuplicate}
            aria-label={`Duplicate ${cell.label || "this cell"}`}
            className="flex-1 gap-2 text-xs border-accent/30 hover:bg-accent/10 hover:text-accent-hi"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Duplicate
          </Button>
        </Tooltip>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          aria-label={`Delete ${cell.label || "this cell"} (Delete key)`}
          className="flex-1 gap-2 text-xs bg-danger/5 text-danger hover:bg-danger/15 hover:text-danger"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </Button>
      </div>
    </section>
  );
}
