"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const MermaidDiagram = dynamic(() => import("./MermaidDiagram"), { ssr: false });

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
}

export default function CodeBlock({ className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className ?? "");
  const language = match ? match[1] : "";
  const code = String(children).replace(/\n$/, "");

  if (language === "mermaid") {
    return <MermaidDiagram chart={code} />;
  }

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
      {/* Code content */}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className={`${className ?? ""} text-text-muted`}>{code}</code>
      </pre>
    </div>
  );
}
