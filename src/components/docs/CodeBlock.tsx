"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const MermaidDiagram = dynamic(() => import("./MermaidDiagram"), { ssr: false });

const LANG_MAP: Record<string, string> = {
  js: "javascript", ts: "typescript", jsx: "jsx", tsx: "tsx",
  cs: "csharp", "c#": "csharp", csharp: "csharp",
  py: "python", python: "python", rb: "ruby",
  sh: "bash", shell: "bash", bash: "bash", zsh: "bash",
  yml: "yaml", yaml: "yaml", json: "json",
  xml: "xml", html: "html", css: "css", scss: "scss",
  sql: "sql", go: "go", rust: "rust", rs: "rust",
  java: "java", kt: "kotlin", kotlin: "kotlin", swift: "swift",
  cpp: "cpp", "c++": "cpp", c: "c",
  docker: "dockerfile", dockerfile: "dockerfile",
  graphql: "graphql", md: "markdown", markdown: "markdown",
  diff: "diff", powershell: "powershell", ps1: "powershell",
  proto: "proto", protobuf: "proto", toml: "toml", ini: "ini",
  lua: "lua", r: "r", dart: "dart", scala: "scala",
  groovy: "groovy", perl: "perl", hcl: "hcl", tf: "hcl",
  text: "text", txt: "text", log: "text", plaintext: "text",
};

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
}

export default function CodeBlock({ className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");
  const match = /language-(\w+)/.exec(className ?? "");
  const language = match ? match[1] : "";
  const code = String(children).replace(/\n$/, "");
  const lineCount = code.split("\n").length;
  const showLineNumbers = lineCount > 5;

  if (language === "mermaid") {
    return <MermaidDiagram chart={code} />;
  }

  // Highlight with shiki on client
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const { codeToHtml } = await import("shiki");
        const lang = LANG_MAP[language.toLowerCase()] ?? (language.toLowerCase() || "text");
        const html = await codeToHtml(code, {
          lang,
          theme: "night-owl",
        });
        if (!cancelled) setHighlightedHtml(html);
      } catch {
        // If language not supported, render as plain text
        if (!cancelled) setHighlightedHtml("");
      }
    }

    highlight();
    return () => { cancelled = true; };
  }, [code, language]);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative my-4 rounded-lg border border-white/5 bg-[#0B1120] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim">
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          className="text-[10px] font-mono text-text-dim hover:text-teal transition-colors px-2 py-0.5 rounded hover:bg-white/5"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {highlightedHtml ? (
        /* Shiki-highlighted code (VS Code quality) */
        <div className="shiki-wrapper overflow-x-auto">
          <style>{`
            .shiki-wrapper pre {
              background: #0B1120 !important;
              padding: 1rem;
              margin: 0;
              font-size: 0.875rem;
              line-height: 1.625;
              font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
            }
            .shiki-wrapper code {
              font-family: inherit;
              counter-reset: ${showLineNumbers ? "line" : "none"};
            }
            ${showLineNumbers ? `
            .shiki-wrapper code .line {
              counter-increment: line;
            }
            .shiki-wrapper code .line::before {
              content: counter(line);
              display: inline-block;
              width: 2rem;
              margin-right: 1rem;
              text-align: right;
              color: #334155;
              user-select: none;
              font-size: 0.75rem;
            }
            ` : ""}
          `}</style>
          <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        </div>
      ) : (
        /* Fallback: plain text while shiki loads */
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed" style={{ background: "#0B1120" }}>
          <code className="text-text-muted font-mono">{code}</code>
        </pre>
      )}
    </div>
  );
}
