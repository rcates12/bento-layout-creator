"use client";

import { useState, useCallback } from "react";

// ─── Tab types ────────────────────────────────────────────────────────────────

type ExportTab = "html" | "standalone" | "jsx";

const TABS: { id: ExportTab; label: string; description: string }[] = [
  { id: "html",       label: "Tailwind HTML",  description: "Grid classes with inline background styles" },
  { id: "standalone", label: "Standalone HTML", description: "Complete HTML file with Tailwind CDN" },
  { id: "jsx",        label: "React JSX",       description: "Functional component with className props" },
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
  string:    "text-amber-300/90",
  punct:     "text-zinc-500",
  comment:   "text-zinc-500 italic",
  "jsx-expr": "text-violet-300/90",
  text:      "text-zinc-300",
  whitespace: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface CodeOutputProps {
  htmlCode: string;
  standaloneCode: string;
  jsxCode: string;
}

export function CodeOutput({ htmlCode, standaloneCode, jsxCode }: CodeOutputProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>("html");
  const [copied, setCopied] = useState(false);

  const code =
    activeTab === "html"       ? htmlCode       :
    activeTab === "standalone" ? standaloneCode :
    jsxCode;

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

  const tokens = tokenize(code);
  const activeTabInfo = TABS.find((t) => t.id === activeTab)!;

  return (
    <section
      aria-label="Generated code"
      className="flex flex-col overflow-hidden rounded-2xl border border-rim bg-canvas"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rim px-4 py-3">
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          <span className="text-xs font-semibold text-muted">
            Export
          </span>
        </div>

        {/* Screen reader copy feedback */}
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? "Code copied to clipboard" : ""}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${activeTabInfo.label} code`}
          className={[
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
            copied
              ? "border border-accent/30 bg-accent/10 text-accent-hi"
              : "border border-rim bg-surface-hi text-cream hover:border-rim-hi hover:bg-hover",
          ].join(" ")}
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b border-rim"
        role="tablist"
        aria-label="Export format"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="code-panel"
            title={tab.description}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "px-3 py-2 text-[11px] font-medium transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent",
              activeTab === tab.id
                ? "border-b-2 border-accent text-cream"
                : "text-muted hover:text-cream",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code block */}
      <div className="overflow-x-auto" id="code-panel" role="tabpanel">
        <pre
          className="p-4 font-mono text-[13px] leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-rim-hi"
          tabIndex={0}
          aria-label={`${activeTabInfo.label} code output`}
        >
          <code>
            {tokens.map((token, i) => (
              <span key={i} className={TOKEN_COLORS[token.type] ?? ""}>
                {token.value}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </section>
  );
}
