"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { BlogEntry } from "@/lib/github";
import LanguageIcon from "./LanguageIcon";

const PER_PAGE = 10;

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface BlogFeedProps {
  blogs: BlogEntry[];
  categories: string[];
}

export default function BlogFeed({ blogs, categories }: BlogFeedProps) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!activeTag) return blogs;
    return blogs.filter((b) => b.category === activeTag);
  }, [blogs, activeTag]);

  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore = page * PER_PAGE < filtered.length;

  function handleTagClick(tag: string) {
    setActiveTag(activeTag === tag ? null : tag);
    setPage(1);
  }

  return (
    <div className="flex gap-8">
      {/* Main feed */}
      <div className="flex-1 min-w-0">
        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-text-dim font-mono">
            {filtered.length} blog{filtered.length !== 1 ? "s" : ""}
            {activeTag && (
              <>
                {" "}in <span className="text-teal">{activeTag}</span>
              </>
            )}
          </p>
          {activeTag && (
            <button
              onClick={() => { setActiveTag(null); setPage(1); }}
              className="text-xs text-text-dim hover:text-teal transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Blog tiles */}
        <div className="space-y-4">
          {paginated.map((blog) => (
            <article
              key={blog.repo}
              className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-teal/20 hover:bg-white/[0.04] transition-all duration-300"
            >
              {/* Title + date */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <Link
                  href={`${basePath}/blogs/${blog.repo}/`}
                  className="text-base font-semibold text-text-primary group-hover:text-teal transition-colors line-clamp-1"
                >
                  {blog.readmeTitle}
                </Link>
                <span className="text-[10px] text-text-dim font-mono whitespace-nowrap shrink-0 pt-1">
                  {formatDate(blog.updatedAt)}
                </span>
              </div>

              {/* Excerpt */}
              <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-4">
                {blog.readmeExcerpt}
              </p>

              {/* Bottom row */}
              <div className="flex items-center justify-between gap-3">
                {/* Left: links */}
                <div className="flex items-center gap-3">
                  <Link
                    href={`${basePath}/blogs/${blog.repo}/`}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-teal hover:text-teal/80 transition-colors"
                  >
                    Read blog
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8.7 1.3a1 1 0 00-1.4 1.4L11.58 7H2a1 1 0 000 2h9.58l-4.3 4.3a1 1 0 001.42 1.4l6-6a1 1 0 000-1.4l-6-6z" />
                    </svg>
                  </Link>
                  {blog.firstDocPath && (
                    <Link
                      href={`${basePath}/docs/${blog.repo}/${blog.firstDocPath}/`}
                      className="inline-flex items-center gap-1 text-[11px] text-text-dim hover:text-text-muted transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                      </svg>
                      View docs
                    </Link>
                  )}
                </div>

                {/* Right: chips */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {blog.topics.slice(0, 2).map((topic) => (
                    <span
                      key={topic}
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-teal/5 text-teal/60 border border-teal/10"
                    >
                      {topic}
                    </span>
                  ))}

                  {/* Language chip */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 text-text-dim border border-white/5">
                    <LanguageIcon language={blog.language} size={14} />
                    {blog.language}
                  </span>

                  {blog.stars > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-text-dim">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
                      </svg>
                      {blog.stars}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-dim text-sm">
              No blogs found{activeTag ? ` in "${activeTag}"` : ""}.
            </p>
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl border border-teal/30 text-teal hover:bg-teal/10 hover:border-teal/50 transition-all"
            >
              Load more
              <span className="text-xs text-text-dim font-mono">
                ({filtered.length - paginated.length} remaining)
              </span>
            </button>
          </div>
        )}

        {filtered.length > PER_PAGE && (
          <p className="mt-4 text-center text-[10px] text-text-dim font-mono">
            Showing {paginated.length} of {filtered.length}
          </p>
        )}
      </div>

      {/* Right sidebar — tags */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-20">
          <h4 className="text-xs font-semibold tracking-wider uppercase text-text-dim mb-3">
            Categories
          </h4>
          <div className="space-y-1">
            {categories.map((cat) => {
              const count = blogs.filter((b) => b.category === cat).length;
              const isActive = activeTag === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleTagClick(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all ${
                    isActive
                      ? "bg-teal/10 text-teal border border-teal/20"
                      : "text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  <span className={`text-[10px] font-mono ${isActive ? "text-teal/70" : "text-text-dim"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Languages */}
          <h4 className="text-xs font-semibold tracking-wider uppercase text-text-dim mb-3 mt-8">
            Languages
          </h4>
          <div className="space-y-1.5">
            {[...new Set(blogs.map((b) => b.language))].map((lang) => {
              const count = blogs.filter((b) => b.language === lang).length;
              return (
                <div key={lang} className="flex items-center gap-2 px-3 py-1">
                  <LanguageIcon language={lang} size={14} />
                  <span className="text-xs text-text-dim truncate">{lang}</span>
                  <span className="text-[10px] font-mono text-text-dim ml-auto">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
