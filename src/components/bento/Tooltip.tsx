"use client";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const SIDE_CLASSES: Record<string, string> = {
  top:    "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left:   "right-full top-1/2 mr-2 -translate-y-1/2",
  right:  "left-full top-1/2 ml-2 -translate-y-1/2",
};

export function Tooltip({ content, children, side = "top", className = "" }: TooltipProps) {
  return (
    <div className={`group/tip relative inline-flex ${className}`}>
      {children}
      <div
        role="tooltip"
        className={[
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md",
          "border border-rim bg-surface px-2 py-1 text-[11px] text-cream shadow-lg",
          "opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100",
          SIDE_CLASSES[side] ?? SIDE_CLASSES.top,
        ].join(" ")}
      >
        {content}
      </div>
    </div>
  );
}
