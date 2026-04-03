"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/github";

interface TableOfContentsProps {
  entries: TocEntry[];
  mobile?: boolean;
}

export default function TableOfContents({ entries, mobile }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (observerEntries) => {
        for (const entry of observerEntries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0.1 }
    );

    for (const tocEntry of entries) {
      const el = document.getElementById(tocEntry.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  const tocList = (
    <nav aria-label="Table of contents">
      <ul className="space-y-0.5">
        {entries.map((entry, i) => (
          <li key={`${entry.id}-${i}`}>
            <a
              href={`#${entry.id}`}
              onClick={() => setOpen(false)}
              className={`block text-xs py-1 px-2 rounded transition-colors truncate ${entry.level === 1 ? "font-medium" : ""} ${
                entry.level === 3 ? "pl-6" : entry.level === 4 ? "pl-8" : entry.level === 2 ? "pl-4" : ""
              } ${activeId === entry.id ? "text-teal bg-teal/5" : "text-text-dim hover:text-text-muted"}`}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  if (mobile) {
    return (
      <>
        {/* Mobile TOC toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="xl:hidden fixed bottom-4 right-4 z-50 bg-navy-light text-text-muted p-3 rounded-full shadow-lg border border-[var(--theme-white-alpha-10)] hover:border-teal/30 hover:text-teal transition-colors"
          aria-label="Toggle table of contents"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16" />
            <path d="M4 12h10" />
            <path d="M4 18h6" />
          </svg>
        </button>

        {/* Mobile TOC drawer */}
        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="fixed bottom-0 right-0 z-50 w-72 max-h-[60vh] bg-surface border-l border-t border-[var(--theme-border)] rounded-tl-xl overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold tracking-wider uppercase text-text-dim">On this page</h4>
                <button onClick={() => setOpen(false)} className="text-text-dim hover:text-text-primary transition-colors" aria-label="Close table of contents">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {tocList}
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <aside className="w-56 shrink-0">
      <div className="sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto">
        <h4 className="text-xs font-semibold tracking-wider uppercase text-text-dim mb-3 px-2">On this page</h4>
        {tocList}
      </div>
    </aside>
  );
}
