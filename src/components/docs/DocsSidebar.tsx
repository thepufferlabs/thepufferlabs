"use client";

import { useState } from "react";
import Link from "next/link";
import type { RepoDocsConfig } from "@/lib/github";

interface DocsSidebarProps {
  registry: RepoDocsConfig[];
  currentRepo?: string;
  currentPath?: string;
}

export default function DocsSidebar({ registry, currentRepo, currentPath }: DocsSidebarProps) {
  const [expandedRepos, setExpandedRepos] = useState<Set<string>>(new Set(currentRepo ? [currentRepo] : []));
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  function toggleRepo(repo: string) {
    setExpandedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repo)) next.delete(repo);
      else next.add(repo);
      return next;
    });
  }

  function toggleFolder(key: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function slugFromPath(filePath: string): string {
    return filePath.replace(/\.md$/, "");
  }

  // Filter repos/files by search
  const filteredRegistry = search.trim()
    ? registry.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.repo.toLowerCase().includes(search.toLowerCase()) ||
          r.docs.some((f) => f.files.some((file) => file.title.toLowerCase().includes(search.toLowerCase())))
      )
    : registry;

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-[var(--theme-border)] space-y-3">
        <div className="flex items-center justify-between">
          <Link href={`${basePath}/docs/`} className="text-sm font-semibold text-teal hover:text-teal/80 transition-colors" onClick={() => setOpen(false)}>
            &larr; All Projects
          </Link>
          {/* Close button — mobile only */}
          <button onClick={() => setOpen(false)} className="lg:hidden text-text-dim hover:text-text-primary transition-colors" aria-label="Close sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search docs..."
            className="w-full bg-[var(--theme-white-alpha-5)] border border-[var(--theme-border)] rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-dim/50 focus:outline-none focus:border-teal/30 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted text-xs">
              &times;
            </button>
          )}
        </div>
      </div>

      <nav className="p-2" aria-label="Documentation tree">
        {filteredRegistry.map((repoConfig) => {
          const isExpanded = expandedRepos.has(repoConfig.repo);
          const isActive = currentRepo === repoConfig.repo;

          return (
            <div key={repoConfig.repo} className="mb-1">
              {/* Repo header */}
              <button
                onClick={() => toggleRepo(repoConfig.repo)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  isActive ? "bg-teal/10 text-teal" : "text-text-muted hover:text-text-primary hover:bg-[var(--theme-white-alpha-5)]"
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" className={`shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                  <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
                <span className="truncate font-medium">{repoConfig.name}</span>
                <span className="ml-auto text-[10px] text-text-dim font-mono">{repoConfig.language}</span>
              </button>

              {/* Files tree */}
              {isExpanded && (
                <div className="ml-3 pl-3 border-l border-[var(--theme-border)]">
                  {repoConfig.docs.map((folder) => {
                    const folderKey = `${repoConfig.repo}/${folder.name}`;
                    const isFolderExpanded = expandedFolders.has(folderKey) || folder.files.some((f) => f.path === currentPath);

                    return (
                      <div key={folderKey} className="mb-0.5">
                        {repoConfig.docs.length > 1 && (
                          <button onClick={() => toggleFolder(folderKey)} className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-text-dim hover:text-text-muted rounded transition-colors">
                            <svg width="10" height="10" viewBox="0 0 10 10" className={`shrink-0 transition-transform ${isFolderExpanded ? "rotate-90" : ""}`}>
                              <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                            </svg>
                            <span className="font-mono">{folder.name}</span>
                          </button>
                        )}

                        {(repoConfig.docs.length === 1 || isFolderExpanded) &&
                          folder.files.map((file) => {
                            const isFileActive = file.path === currentPath;
                            const href = `${basePath}/docs/${repoConfig.repo}/${slugFromPath(file.path)}/`;

                            return (
                              <Link
                                key={file.path}
                                href={href}
                                onClick={() => setOpen(false)}
                                className={`block px-2 py-1.5 text-xs rounded-md transition-colors truncate ${
                                  isFileActive ? "bg-teal/10 text-teal font-medium" : "text-text-dim hover:text-text-muted hover:bg-[var(--theme-white-alpha-5)]"
                                }`}
                              >
                                <span className="mr-1.5 opacity-50">&#9656;</span>
                                {file.title}
                              </Link>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredRegistry.length === 0 && <p className="text-xs text-text-dim px-3 py-4 text-center">No matching docs found.</p>}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile toggle button — rendered in breadcrumb area via portal-like positioning */}
      <button onClick={() => setOpen(true)} className="lg:hidden fixed top-2.5 left-3 z-30 text-text-muted hover:text-teal transition-colors p-1" aria-label="Open sidebar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h18" />
          <path d="M3 6h18" />
          <path d="M3 18h18" />
        </svg>
      </button>

      {/* Backdrop — mobile only */}
      {open && <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-[var(--theme-border)] bg-surface overflow-y-auto h-[calc(100vh-4rem)] sticky top-16">{sidebarContent}</aside>

      {/* Mobile sidebar drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 w-72 border-r border-[var(--theme-border)] bg-surface overflow-y-auto h-screen transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
