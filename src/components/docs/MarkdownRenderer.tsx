"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import CodeBlock from "./CodeBlock";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  repo?: string;
}

function buildComponents(repo?: string): Components {
  const basePath = typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "")
    : (process.env.NEXT_PUBLIC_BASE_PATH ?? "");

  return {
  pre({ children }) {
    // Extract props from the nested <code> element
    const child = children as React.ReactElement<{
      className?: string;
      children?: React.ReactNode;
    }>;
    const className = child?.props?.className;
    const code = child?.props?.children;
    return <CodeBlock className={className}>{code}</CodeBlock>;
  },
  code({ className, children, ...props }) {
    // Inline code only — block code is handled by pre() above
    return (
      <code
        className="bg-white/5 text-teal px-1.5 py-0.5 rounded text-[0.9em] font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  table({ children }) {
    return (
      <div className="my-6 overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-sm">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return (
      <thead className="bg-white/[0.03] border-b border-white/5">
        {children}
      </thead>
    );
  },
  th({ children }) {
    return (
      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="px-4 py-2.5 border-t border-white/5 text-text-muted">
        {children}
      </td>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-4 border-l-2 border-teal/30 pl-4 text-text-muted italic">
        {children}
      </blockquote>
    );
  },
  a({ href, children }) {
    let resolvedHref = href ?? "";

    // Rewrite relative .md links to docs route when repo is known
    if (repo && resolvedHref && !resolvedHref.startsWith("http") && !resolvedHref.startsWith("#")) {
      // e.g. "docs/ARCHITECTURE.md" → "/docs/Dotnetty/docs/ARCHITECTURE/"
      const cleaned = resolvedHref
        .replace(/^\.?\/?/, "")   // strip leading ./ or /
        .replace(/\.md$/, "");     // strip .md extension
      resolvedHref = `${basePath}/docs/${repo}/${cleaned}/`;
    }

    return (
      <a
        href={resolvedHref}
        className="text-teal hover:text-teal/80 underline underline-offset-2 decoration-teal/30 transition-colors"
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
  img({ src, alt }) {
    return (
      <span className="block my-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? ""}
          className="rounded-lg border border-white/5 max-w-full"
          loading="lazy"
        />
      </span>
    );
  },
  hr() {
    return <hr className="my-8 border-white/5" />;
  },
  };
}

export default function MarkdownRenderer({ content, repo }: MarkdownRendererProps) {
  const components = buildComponents(repo);
  return (
    <div className="prose-puffer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
