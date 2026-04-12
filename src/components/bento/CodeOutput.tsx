"use client";

import { useState, useCallback, useRef } from "react";
import { Code2, Copy, Check, Download, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

// ─── Tab types ────────────────────────────────────────────────────────────────

type ExportTab = "html" | "standalone" | "jsx" | "json";

const TABS: { id: ExportTab; label: string; description: string }[] = [
  { id: "html",       label: "Tailwind HTML",  description: "Grid classes with inline background styles" },
  { id: "standalone", label: "Standalone HTML", description: "Complete HTML file with Tailwind CDN" },
  { id: "jsx",        label: "React JSX",       description: "Functional component with className props" },
  { id: "json",       label: "JSON",            description: "Raw layout config — import back into Lintel" },
];

// ─── Tokenizer ────────────────────────────────────────────────────────────────

function tokenize(code: string): Array<{ type: string; value: string }> {
  const tokens: Array<{ type: string; value: string }> = [];
  let remaining = code;

  while (remaining.length > 0) {
    // HTML/JSX comment
    const commentMatch = remaining.match(/^(<!--[\s\S]*?-->)/);
    if (commentMatch) {
      tokens.push({ type: "comment", value: commentMatch[1] });
      remaining = remaining.slice(commentMatch[0].length);
      continue;
    }

    // JSX comment {/* ... */}
    const jsxCommentMatch = remaining.match(/^(\{\/\*[\s\S]*?\*\/\})/);
    if (jsxCommentMatch) {
      tokens.push({ type: "comment", value: jsxCommentMatch[1] });
      remaining = remaining.slice(jsxCommentMatch[0].length);
      continue;
    }

    // Tag name after < or </
    const tagMatch = remaining.match(/^(<\/?)([\w-]+)/);
    if (tagMatch) {
      tokens.push({ type: "punct", value: tagMatch[1] });
      tokens.push({ type: "tag", value: tagMatch[2] });
      remaining = remaining.slice(tagMatch[0].length);
      continue;
    }

    // Closing >
    const closeMatch = remaining.match(/^(\s*\/??>)/);
    if (closeMatch) {
      tokens.push({ type: "punct", value: closeMatch[1] });
      remaining = remaining.slice(closeMatch[0].length);
      continue;
    }

    // Attribute name (handles className= too)
    const attrMatch = remaining.match(/^(\s+)([\w-]+)(=)/);
    if (attrMatch) {
      tokens.push({ type: "whitespace", value: attrMatch[1] });
      tokens.push({ type: "attr", value: attrMatch[2] });
      tokens.push({ type: "punct", value: attrMatch[3] });
      remaining = remaining.slice(attrMatch[0].length);
      continue;
    }

    // JSX expression like {{ backgroundColor: "..." }}
    const jsxExprMatch = remaining.match(/^(\{\{[^}]*\}\})/);
    if (jsxExprMatch) {
      tokens.push({ type: "jsx-expr", value: jsxExprMatch[1] });
      remaining = remaining.slice(jsxExprMatch[0].length);
      continue;
    }

    // Quoted double-string
    const strMatch = remaining.match(/^"([^"]*)"/);
    if (strMatch) {
      tokens.push({ type: "string", value: `"${strMatch[1]}"` });
      remaining = remaining.slice(strMatch[0].length);
      continue;
    }

    // Text / whitespace
    const textMatch = remaining.match(/^([^<"{}]+)/);
    if (textMatch) {
      tokens.push({ type: "text", value: textMatch[1] });
      remaining = remaining.slice(textMatch[0].length);
      continue;
    }

    tokens.push({ type: "text", value: remaining[0] });
    remaining = remaining.slice(1);
  }

  return tokens;
}

const TOKEN_COLORS: Record<string, string> = {
  tag:       "text-blue-400",
  attr:      "text-sky-300",
  string:    "text-amber-300",
  punct:     "text-zinc-500",
  comment:   "text-zinc-600 italic",
  "jsx-expr": "text-violet-300",
  text:      "text-zinc-300",
  whitespace: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface CodeOutputProps {
  htmlCode: string;
  standaloneCode: string;
  jsxCode: string;
  jsonCode?: string;
  gridRef?: React.RefObject<HTMLDivElement | null>;
  /** When true, strips outer border/rounding and merges copy button into the tabs row */
  panelMode?: boolean;
}

type PixelRatio = 1 | 2 | 3;

export function CodeOutput({ htmlCode, standaloneCode, jsxCode, jsonCode, gridRef, panelMode = false }: CodeOutputProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>("html");
  const [copied, setCopied] = useState(false);
  const [pngExporting, setPngExporting] = useState(false);
  const [pixelRatio, setPixelRatio] = useState<PixelRatio>(2);
  const exportingRef = useRef(false);

  const code =
    activeTab === "html"       ? htmlCode       :
    activeTab === "standalone" ? standaloneCode :
    activeTab === "jsx"        ? jsxCode        :
    (jsonCode ?? "{}");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement("textarea");
      el.value = code;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleDownloadPng = useCallback(async () => {
    if (!gridRef?.current || exportingRef.current) return;
    exportingRef.current = true;
    setPngExporting(true);
    try {
      const htmlToImage = await import("html-to-image");
      const dataUrl = await htmlToImage.toPng(gridRef.current, { pixelRatio });
      const link = document.createElement("a");
      link.download = `lintel-layout-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    } finally {
      setPngExporting(false);
      exportingRef.current = false;
    }
  }, [gridRef, pixelRatio]);

  const tokens = activeTab !== "json" ? tokenize(code) : null;
  const activeTabInfo = TABS.find((t) => t.id === activeTab)!;

  const copyButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      aria-label={`Copy ${activeTabInfo.label} code`}
      className={copied
        ? "border-zinc-500/40 bg-white/10 text-zinc-200 hover:bg-white/15"
        : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
      }
    >
      {copied ? (
        <>
          <Check size={14} aria-hidden="true" />
          Copied!
        </>
      ) : (
        <>
          <Copy size={14} aria-hidden="true" />
          Copy
        </>
      )}
    </Button>
  );

  return (
    <section
      aria-label="Generated code"
      className={panelMode
        ? "flex flex-col overflow-hidden rounded-xl border border-zinc-700/50 bg-[#0a0a0b]"
        : "flex flex-col overflow-hidden rounded-2xl border border-rim bg-[#0a0a0b]"
      }
    >
      {/* Screen reader copy feedback */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Code copied to clipboard" : ""}
      </span>

      {/* Standalone header — title + copy button (hidden in panel mode) */}
      {!panelMode && (
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-zinc-500" aria-hidden="true" />
            <span className="text-[13px] font-semibold text-zinc-100">
              Export
            </span>
          </div>
          {copyButton}
        </div>
      )}

      {/* Tabs row */}
      <div
        className="flex items-center border-b border-zinc-800"
        role="tablist"
        aria-label="Export format"
      >
        {TABS.map((tab) => (
          <Toggle
            key={tab.id}
            pressed={activeTab === tab.id}
            onPressedChange={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="code-panel"
            title={tab.description}
            size="sm"
            className={[
              "rounded-none px-3 py-2.5 text-xs font-medium",
              activeTab === tab.id
                ? "border-b-2 border-zinc-400 text-zinc-100 bg-white/5 data-[state=on]:bg-white/5"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 data-[state=on]:bg-transparent",
            ].join(" ")}
          >
            {tab.label}
          </Toggle>
        ))}
      </div>

      {/* Code block */}
      <div id="code-panel" role="tabpanel">
        <pre
          className="p-4 font-mono text-[13px] leading-relaxed text-zinc-300 whitespace-pre-wrap break-words focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-zinc-600"
          tabIndex={0}
          aria-label={`${activeTabInfo.label} code output`}
        >
          <code>
            {tokens ? (
              tokens.map((token, i) => (
                <span key={i} className={TOKEN_COLORS[token.type] ?? ""}>
                  {token.value}
                </span>
              ))
            ) : (
              <span className="text-zinc-300">{code}</span>
            )}
          </code>
        </pre>
      </div>

      {/* Copy footer — below the code block in panel mode, inline in standalone */}
      {panelMode ? (
        <div className="shrink-0 border-t border-zinc-800 px-4 py-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">{activeTabInfo.description}</span>
            {copyButton}
          </div>

          {/* PNG export controls — only shown when gridRef is available */}
          {gridRef && (
            <div className="flex items-center gap-2 border-t border-zinc-800/60 pt-2.5">
              <ImageIcon size={13} className="text-zinc-500 shrink-0" aria-hidden="true" />
              <span className="text-xs text-zinc-500 shrink-0">PNG export:</span>
              {/* Pixel ratio selector */}
              <div className="flex overflow-hidden rounded-md border border-zinc-700 text-[11px] font-medium">
                {([1, 2, 3] as PixelRatio[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setPixelRatio(r)}
                    aria-pressed={pixelRatio === r}
                    className={[
                      "px-2 py-1 transition-colors",
                      pixelRatio === r
                        ? "bg-zinc-600 text-zinc-100"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
                    ].join(" ")}
                  >
                    {r}×
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPng}
                disabled={pngExporting}
                className="ml-auto border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-50"
                aria-label="Download grid as PNG image"
              >
                <Download size={13} aria-hidden="true" />
                {pngExporting ? "Exporting…" : "Download PNG"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* standalone mode copy button already rendered in the header above */
        null
      )}
    </section>
  );
}
