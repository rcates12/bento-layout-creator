"use client";

import { useState, useCallback } from "react";
import { Code2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

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
      className="flex flex-col overflow-hidden rounded-2xl border border-rim bg-[#0a0a0b]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-zinc-500" aria-hidden="true" />
          <span className="text-[13px] font-semibold text-zinc-100">
            Export
          </span>
        </div>

        {/* Screen reader copy feedback */}
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? "Code copied to clipboard" : ""}
        </span>

        <Button
          variant={copied ? "outline" : "outline"}
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
      </div>

      {/* Tabs */}
      <div
        className="flex border-b border-zinc-800"
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
      <div className="overflow-x-auto" id="code-panel" role="tabpanel">
        <pre
          className="p-4 font-mono text-[13px] leading-relaxed text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-zinc-600"
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
