"use client";

import { AlertTriangle, Info, XCircle } from "lucide-react";

type BannerVariant = "info" | "warning" | "error";

interface StatusBannerProps {
  variant?: BannerVariant;
  children: React.ReactNode;
  role?: string;
  "aria-live"?: "polite" | "assertive" | "off";
}

const VARIANT_STYLES: Record<BannerVariant, string> = {
  info:    "border-blue-500/30 bg-blue-500/10 text-blue-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  error:   "border-red-500/30 bg-red-500/10 text-red-300",
};

const VARIANT_ICONS: Record<BannerVariant, React.ElementType> = {
  info:    Info,
  warning: AlertTriangle,
  error:   XCircle,
};

export function StatusBanner({
  variant = "info",
  children,
  role = "status",
  "aria-live": ariaLive = "polite",
}: StatusBannerProps) {
  const Icon = VARIANT_ICONS[variant];

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={[
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-medium leading-relaxed",
        VARIANT_STYLES[variant],
      ].join(" ")}
    >
      <Icon size={13} className="mt-px shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
