"use client";

import { useState } from "react";
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
  ChevronUp,
  Trash2,
  ImageOff,
  GripVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import type {
  BentoCell,
  GridConfig,
  BorderRadius,
  ShadowLevel,
  ContentBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  FontSize,
  FontWeight,
  LetterSpacing,
  LineHeight,
  TextAlign,
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
    <Label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-accent/80 dark:text-muted/80 gap-0">
      {children}
    </Label>
  );
}

function Divider() {
  return <Separator className="bg-rim-hi/60 dark:bg-rim-hi/30" />;
}

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-[11px] text-muted">{label}</span>
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
      <SelectTrigger size="sm" className="h-7 w-full text-[11px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-[11px]">
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

function ToggleGroup({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string; title?: string; icon?: React.ReactNode }[];
  onChange: (v: string) => void;
}) {
  return (
    <ShadToggleGroup
      value={[value]}
      onValueChange={(vals) => { const v = vals[0]; if (v) onChange(v); }}
      variant="outline"
      spacing={0}
      className="w-full"
    >
      {options.map((o) => (
        <Tooltip key={o.value} content={o.title ?? o.label} side="bottom">
          <ToggleGroupItem
            value={o.value}
            aria-label={o.title ?? o.label}
            className="flex-1 text-[10px] font-medium data-[state=on]:bg-accent/20 data-[state=on]:text-accent-hi"
          >
            {o.icon ?? o.label}
          </ToggleGroupItem>
        </Tooltip>
      ))}
    </ShadToggleGroup>
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
      <label htmlFor={id} className="min-w-0 shrink-0 text-xs text-muted">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-xs"
          aria-label={`Decrease ${label}`}
          onClick={() => !decreaseDisabled && onChange(stepped(value, -step))}
          disabled={decreaseDisabled}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
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
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
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
            className="h-7 w-7 shrink-0 border border-rim bg-surface-hi text-muted hover:border-rim-hi hover:text-cream data-[state=on]:border-accent data-[state=on]:bg-accent/20 data-[state=on]:text-accent-hi"
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

// ─── Color swatches ───────────────────────────────────────────────────────────

function ColorSwatches({
  value,
  onChange,
  includeWhite,
}: {
  value: string;
  onChange: (hex: string) => void;
  includeWhite?: boolean;
}) {
  const palette = [
    ...(includeWhite ? [{ name: "White", hex: "#ffffff" }] : []),
    ...EARTH_TONES,
  ];
  return (
    <ShadToggleGroup
      value={[value]}
      onValueChange={(vals) => { const v = vals[0]; if (v) onChange(v); }}
      className="flex flex-wrap gap-1 w-full"
      spacing={4}
    >
      {palette.map(({ name, hex }) => (
        <Tooltip key={hex} content={name} side="bottom">
          <ToggleGroupItem
            value={hex}
            aria-label={`Set to ${name}`}
            style={{ backgroundColor: hex }}
            className="h-5 w-5 min-w-0 rounded border-2 border-transparent p-0 transition-[border-color,transform] duration-150 hover:scale-110 active:scale-95 hover:border-white/20 data-[state=on]:border-accent-hi data-[state=on]:ring-1 data-[state=on]:ring-accent/60"
          />
        </Tooltip>
      ))}
    </ShadToggleGroup>
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
  { value: "left",   label: "Left",   title: "Align left",   icon: <AlignLeft   size={13} aria-hidden="true" /> },
  { value: "center", label: "Center", title: "Align center", icon: <AlignCenter size={13} aria-hidden="true" /> },
  { value: "right",  label: "Right",  title: "Align right",  icon: <AlignRight  size={13} aria-hidden="true" /> },
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

      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
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
        <ToggleGroup
          value={block.align ?? "left"}
          options={ALIGN_OPTIONS}
          onChange={(v) => onUpdate({ align: v as TextAlign })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionLabel>Color</SectionLabel>
        <ColorSwatches
          value={block.color ?? "#ffffff"}
          onChange={(v) => onUpdate({ color: v })}
          includeWhite
        />
      </div>
    </div>
  );
}

const SHADOW_LEVELS: { value: ShadowLevel; title: string; css: string }[] = [
  { value: "none", title: "No shadow",         css: "none" },
  { value: "sm",   title: "Small shadow",      css: "0 1px 4px rgba(0,0,0,0.55)" },
  { value: "md",   title: "Medium shadow",     css: "0 4px 10px rgba(0,0,0,0.55)" },
  { value: "lg",   title: "Large shadow",      css: "0 8px 20px rgba(0,0,0,0.6)" },
  { value: "xl",   title: "Extra-large shadow",css: "0 16px 36px rgba(0,0,0,0.65)" },
];

function ShadowPicker({
  value,
  onChange,
}: {
  value: ShadowLevel;
  onChange: (v: ShadowLevel) => void;
}) {
  return (
    <ShadToggleGroup
      value={[value]}
      onValueChange={(vals) => { const v = vals[0]; if (v) onChange(v as ShadowLevel); }}
      spacing={4}
      className="w-full"
    >
      {SHADOW_LEVELS.map((s) => (
        <Tooltip key={s.value} content={s.title} side="bottom">
          <ToggleGroupItem
            value={s.value}
            aria-label={s.title}
            className="flex flex-1 h-10 border border-rim bg-surface-hi hover:border-muted/50 data-[state=on]:border-accent/70 data-[state=on]:bg-accent/10"
          >
            <div
              className="w-5 h-5 rounded-sm bg-cream/80"
              style={{ boxShadow: s.css }}
            />
          </ToggleGroupItem>
        </Tooltip>
      ))}
    </ShadToggleGroup>
  );
}

const BORDER_WIDTH_LEVELS: { value: string; px: number; title: string }[] = [
  { value: "0", px: 0, title: "No border" },
  { value: "1", px: 1, title: "1px border" },
  { value: "2", px: 2, title: "2px border" },
  { value: "4", px: 4, title: "4px border" },
];

function BorderWidthPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <ShadToggleGroup
      value={[value]}
      onValueChange={(vals) => { const v = vals[0]; if (v) onChange(v); }}
      spacing={4}
      className="w-full"
    >
      {BORDER_WIDTH_LEVELS.map((b) => (
        <Tooltip key={b.value} content={b.title} side="bottom">
          <ToggleGroupItem
            value={b.value}
            aria-label={b.title}
            className="flex flex-1 h-10 border border-rim bg-surface-hi hover:border-muted/50 data-[state=on]:border-accent/70 data-[state=on]:bg-accent/10"
          >
            {b.px === 0 ? (
              <span className="text-[9px] font-semibold text-muted">—</span>
            ) : (
              <div
                className="w-5 h-5 rounded-sm border-cream/60"
                style={{ borderWidth: `${b.px}px`, borderStyle: "solid" }}
              />
            )}
          </ToggleGroupItem>
        </Tooltip>
      ))}
    </ShadToggleGroup>
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
        <ToggleGroup
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
            <ColorSwatches
              value={block.borderColor ?? "#ffffff"}
              onChange={(v) => onUpdate({ borderColor: v })}
              includeWhite
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
        <ToggleGroup
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
        <ColorSwatches
          value={block.bgColor ?? "#ffffff"}
          onChange={(v) => onUpdate({ bgColor: v })}
          includeWhite
        />
      </div>

      {block.variant === "solid" && (
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Text color</SectionLabel>
          <ColorSwatches
            value={block.textColor ?? "#000000"}
            onChange={(v) => onUpdate({ textColor: v })}
            includeWhite
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
        <span className="text-[11px] text-muted">Full width</span>
      </label>
    </div>
  );
}

// ─── Block card ───────────────────────────────────────────────────────────────

const BLOCK_TYPE_META = {
  text:   { icon: Type,             label: "Text",   color: "text-blue-400" },
  image:  { icon: ImageIcon,        label: "Image",  color: "text-emerald-400" },
  button: { icon: MousePointerClick, label: "Button", color: "text-amber-400" },
};

interface BlockCardProps {
  block: ContentBlock;
  isFirst: boolean;
  isLast: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  onUpdate: (updates: Partial<ContentBlock>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function BlockCard({
  block,
  isFirst,
  isLast,
  dragHandleProps,
  isDragging,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
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
      <div className="flex items-center bg-surface-hi/60 dark:bg-surface-hi px-2 py-1.5 gap-1 border-b border-rim/40">
        {/* Drag handle */}
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Drag to reorder ${meta.label} block`}
          title="Drag to reorder"
          className="cursor-grab text-muted/40 hover:bg-transparent hover:text-muted active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical size={13} aria-hidden="true" />
        </Button>

        {/* Title */}
        <Button
          variant="ghost"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 min-w-0 h-auto py-0 justify-start gap-1.5 text-left hover:bg-transparent"
        >
          <Icon size={12} className={`shrink-0 ${meta.color}`} aria-hidden="true" />
          <span className="text-[11px] font-medium text-cream">{meta.label}</span>
          <ChevronDown
            size={10}
            aria-hidden="true"
            className={`ml-auto shrink-0 text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </Button>

        {/* Reorder buttons */}
        <Tooltip content="Move up" side="top">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Move block up"
            className="text-muted/60 hover:bg-transparent hover:text-sky-400 focus-visible:ring-sky-400"
          >
            <ChevronUp size={13} aria-hidden="true" />
          </Button>
        </Tooltip>
        <Tooltip content="Move down" side="top">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Move block down"
            className="text-muted/60 hover:bg-transparent hover:text-amber-400 focus-visible:ring-amber-400"
          >
            <ChevronDown size={13} aria-hidden="true" />
          </Button>
        </Tooltip>

        {/* Remove */}
        <Tooltip content="Remove block" side="top">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRemove}
            aria-label={`Remove ${meta.label} block`}
            className="text-muted hover:bg-transparent hover:text-red-400 focus-visible:ring-red-500"
          >
            <Trash2 size={10} aria-hidden="true" />
          </Button>
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
        </div>
      )}
    </div>
  );
}

// ─── Sortable block card ───────────────────────────────────────────────────────

function SortableBlockCard(props: Omit<BlockCardProps, "dragHandleProps" | "isDragging">) {
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
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex h-auto flex-col items-center gap-1.5 py-3 text-muted"
    >
      <Icon size={16} className={color} aria-hidden="true" />
      <span className="text-[10px] font-medium">{label}</span>
    </Button>
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
  onReorderBlock: (blockId: string, direction: "up" | "down") => void;
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
  onReorderBlock,
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
    <section aria-label="Cell settings" className="flex flex-col gap-4">

      {/* ── Cell title ── */}
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        Cell
      </h2>

      {/* ── Label ── */}
      <div className="flex flex-col gap-1.5">
        <SectionLabel>Label</SectionLabel>
        <Input
          id="cell-label"
          type="text"
          value={cell.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Internal label…"
          autoComplete="off"
        />
      </div>

      <Divider />

      {/* ── Content blocks ── */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Content</SectionLabel>

        {/* Add block buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          <AddBlockButton
            icon={Type}
            label="Text"
            color="text-blue-400"
            onClick={() => handleAddBlock("text")}
          />
          <AddBlockButton
            icon={ImageIcon}
            label="Image"
            color="text-emerald-400"
            onClick={() => handleAddBlock("image")}
          />
          <AddBlockButton
            icon={MousePointerClick}
            label="Button"
            color="text-amber-400"
            onClick={() => handleAddBlock("button")}
          />
        </div>

        {blocks.length === 0 ? (
          <p className="rounded-md border border-dashed border-accent/20 dark:border-rim/60 px-3 py-3 text-center text-[11px] text-muted/50 leading-relaxed">
            No blocks yet — click an icon above
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
                {blocks.map((block, idx) => (
                  <SortableBlockCard
                    key={block.id}
                    block={block}
                    isFirst={idx === 0}
                    isLast={idx === blocks.length - 1}
                    onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                    onRemove={() => onRemoveBlock(block.id)}
                    onMoveUp={() => onReorderBlock(block.id, "up")}
                    onMoveDown={() => onReorderBlock(block.id, "down")}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <Divider />

      {/* ── Background ── */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Background</SectionLabel>

        {/* Background image */}
        {cell.bgImage ? (
          <div className="flex items-center gap-2 rounded-md border border-rim bg-surface-hi/40 p-2">
            <div
              className="h-9 w-14 shrink-0 rounded border border-rim bg-cover bg-center"
              style={{ backgroundImage: `url(${cell.bgImage})` }}
              aria-hidden="true"
            />
            <span className="flex-1 truncate text-[11px] text-muted/70">Placeholder image</span>
            <Tooltip content="Remove background image" side="left">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onSetBgImage(null)}
                aria-label="Remove background image"
                className="hover:border-red-500/40 hover:text-red-400 focus-visible:ring-red-500"
              >
                <ImageOff size={12} aria-hidden="true" />
              </Button>
            </Tooltip>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => onSetBgImage(PLACEHOLDER_IMAGE)}
            className="h-9 w-full gap-2 border-dashed text-[11px] text-muted"
          >
            <ImageIcon size={13} aria-hidden="true" />
            Use placeholder image
          </Button>
        )}

        {/* Color palette */}
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Color</SectionLabel>
          <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Cell color palette">
            {EARTH_TONES.map(({ name, hex }) => {
              const isActive = (cell.bgColor ?? DEFAULT_CELL_BG) === hex;
              return (
                <Tooltip key={hex} content={name} side="bottom">
                  <button
                    type="button"
                    onClick={() => onUpdate({ bgColor: hex })}
                    aria-label={`Set color to ${name}`}
                    aria-pressed={isActive}
                    style={{ backgroundColor: hex }}
                    className={[
                      "h-7 w-full rounded-md border-2 transition-[border-color,transform] duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
                      "hover:scale-110 active:scale-95",
                      isActive
                        ? "border-accent-hi ring-1 ring-accent/60"
                        : "border-transparent hover:border-white/20",
                    ].join(" ")}
                  />
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Style ── */}
      <div className="flex flex-col gap-1.5">
        <SectionLabel>Corners</SectionLabel>
        <RadiusPicker
          value={cell.borderRadius ?? "2xl"}
          onChange={(v) => onUpdate({ borderRadius: v })}
        />
      </div>

      <Divider />

      {/* ── Layout ── */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Layout</SectionLabel>

        <div className="iso-card p-3">
          <p className="mb-2 text-[10px] font-semibold text-muted">Position</p>
          <div className="flex flex-col gap-2">
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
        </div>

        <div className="iso-card p-3">
          <p className="mb-2 text-[10px] font-semibold text-muted">Span</p>
          <div className="flex flex-col gap-2">
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
        </div>
      </div>

      <Divider />

      {/* ── Actions ── */}
      <div className="flex gap-2">
        <Tooltip content={!canDuplicate ? "Grid is full" : "Duplicate cell (Ctrl+D)"} side="top">
          <Button
            variant="outline"
            size="sm"
            onClick={onDuplicateCell}
            disabled={!canDuplicate}
            aria-label={`Duplicate ${cell.label || "this cell"}`}
            className="flex-1 gap-2 text-xs"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Duplicate
          </Button>
        </Tooltip>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          aria-label={`Delete ${cell.label || "this cell"} (Delete key)`}
          className="flex-1 gap-2 text-xs"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </Button>
      </div>
    </section>
  );
}
