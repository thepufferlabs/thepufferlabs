"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import CodeBlock from "./CodeBlock";

/** Map of source filename (without .md) → route path, for rewriting relative links */
export type LinkMap = Record<string, string>;

interface MarkdownRendererProps {
  content: string;
  repo?: string;
  /** Serializable link map for rewriting relative .md links (used by courses) */
  linkMap?: LinkMap;
}

function buildComponents(repo?: string, linkMap?: LinkMap): Components {
  const basePath = typeof window === "undefined" ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "") : (process.env.NEXT_PUBLIC_BASE_PATH ?? "");

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
    code({ className: _className, children, ...props }) {
      // Inline code only — block code is handled by pre() above
      return (
        <code className="bg-[var(--theme-white-alpha-5)] text-teal px-1.5 py-0.5 rounded text-[0.9em] font-mono" {...props}>
          {children}
        </code>
      );
    },
    table({ children }) {
      return (
        <div className="my-6 overflow-x-auto rounded-lg border border-[var(--theme-border)]">
          <table className="w-full text-sm">{children}</table>
        </div>
      );
    },
    thead({ children }) {
      return <thead className="bg-[var(--theme-white-alpha-5)] border-b border-[var(--theme-border)]">{children}</thead>;
    },
    th({ children }) {
      return <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{children}</th>;
    },
    td({ children }) {
      return <td className="px-4 py-2.5 border-t border-[var(--theme-border)] text-text-muted">{children}</td>;
    },
    blockquote({ children }) {
      return <blockquote className="my-4 border-l-2 border-teal/30 pl-4 text-text-muted italic">{children}</blockquote>;
    },
    a({ href, children }) {
      let resolvedHref = href ?? "";

      if (resolvedHref && !resolvedHref.startsWith("http") && !resolvedHref.startsWith("#")) {
        if (linkMap) {
          // Course link rewriting: match filename against linkMap
          const filename =
            resolvedHref
              .replace(/^[./]*/, "")
              .split("/")
              .pop()
              ?.replace(/\.md$/, "") ?? "";
          // Try exact match, then without numeric prefix (e.g. "07-ingress-and-dns" -> "ingress-and-dns")
          const route = linkMap[filename] ?? linkMap[filename.replace(/^\d+-/, "")];
          if (route) resolvedHref = route;
        } else if (repo) {
          // Fallback: rewrite relative .md links to docs route
          const cleaned = resolvedHref.replace(/^\.?\/?/, "").replace(/\.md$/, "");
          resolvedHref = `${basePath}/docs/${repo}/${cleaned}/`;
        }
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
          <img src={src} alt={alt ?? ""} className="rounded-lg border border-[var(--theme-border)] max-w-full" loading="lazy" />
        </span>
      );
    },
    hr() {
      return <hr className="my-8 border-[var(--theme-border)]" />;
    },
  };
}

export default function MarkdownRenderer({ content, repo, linkMap }: MarkdownRendererProps) {
  const components = buildComponents(repo, linkMap);
  return (
    <div className="prose-puffer">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
