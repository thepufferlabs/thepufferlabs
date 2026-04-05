"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SidebarSection } from "@/lib/courses/types";

interface CourseSidebarProps {
  slug: string;
  sections: SidebarSection[];
}

export default function CourseSidebar({ slug, sections }: CourseSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const pathname = usePathname();

  // Extract activeContentKey from URL: /courses/{slug}/{contentKey}/
  const pathParts = pathname.replace(basePath, "").split("/").filter(Boolean);
  const activeContentKey = pathParts.length >= 3 ? pathParts[2] : "";

  // Find which section contains the active content key
  const activeSectionId = sections.find((s) => s.items.some((item) => item.contentKey === activeContentKey))?.id;

  // All sections start collapsed; only the active section is expanded
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const section of sections) {
      initial[section.id] = section.id !== activeSectionId;
    }
    return initial;
  });

  function toggleSection(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const visibleSections = sections;

  const sidebarContent = (
    <nav className="py-4 px-3 space-y-0.5">
      {/* Back to courses */}
      <Link href={`${basePath}/courses/`} className="flex items-center gap-2 px-3 py-2 text-xs text-text-dim hover:text-teal transition-colors mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        All Courses
      </Link>

      {visibleSections.map((section, index) => {
        const isCollapsed = collapsed[section.id] ?? true;
        const isPremiumSection = section.premium;

        return (
          <div key={section.id}>
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center w-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-dim hover:text-text-muted transition-colors rounded-lg cursor-pointer gap-2 min-w-0"
            >
              {/* Section number or lock */}
              {isPremiumSection ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-400/70">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              ) : (
                <span className="w-5 h-5 rounded bg-[var(--theme-white-alpha-5)] text-[10px] font-bold flex items-center justify-center shrink-0 text-text-dim">{index + 1}</span>
              )}

              <span className="truncate">{section.title}</span>

              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 ml-auto transition-transform ${isCollapsed ? "" : "rotate-90"}`}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {!isCollapsed && (
              <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-[var(--theme-border)] pl-3">
                {section.items.map((item) => {
                  const isActive = item.contentKey === activeContentKey;
                  const isPremium = item.accessLevel === "premium";

                  return (
                    <li key={item.contentKey}>
                      <Link
                        href={`${basePath}/courses/${slug}/${item.contentKey}/`}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all min-w-0 ${
                          isActive
                            ? "text-teal bg-teal/10 font-medium"
                            : isPremium
                              ? "text-text-dim hover:text-text-muted hover:bg-[var(--theme-white-alpha-5)]"
                              : "text-text-muted hover:text-text-primary hover:bg-[var(--theme-white-alpha-5)]"
                        }`}
                      >
                        <span className="truncate flex-1">{item.title}</span>
                        {isPremium && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0 ml-auto text-amber-400/50"
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                          </svg>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-teal text-navy flex items-center justify-center shadow-lg shadow-teal/20 cursor-pointer"
        aria-label="Toggle sidebar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {mobileOpen ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </>
          ) : (
            <>
              <line x1="3" y1="7" x2="21" y2="7" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="17" x2="21" y2="17" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 bg-navy border-r border-[var(--theme-border)] overflow-y-auto transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
