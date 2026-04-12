"use client";

import Link from "next/link";
import type { TocPhase } from "@/lib/courses/types";
import { useCourseOwnership } from "@/components/courses/useCourseOwnership";
import PremiumContentBadge from "@/components/courses/PremiumContentBadge";

interface CourseOverviewContentProps {
  slug: string;
  phases: TocPhase[];
}

function ContentMarker({ accessLevel, showLock }: { accessLevel: "free" | "premium"; showLock: boolean }) {
  if (showLock) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400/60">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    );
  }

  if (accessLevel === "premium") {
    return <PremiumContentBadge compact />;
  }

  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  );
}

export default function CourseOverviewContent({ slug, phases }: CourseOverviewContentProps) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const { isOwned, ownershipResolved } = useCourseOwnership(slug);

  return (
    <div className="space-y-6">
      {phases.map((phase, phaseIndex) => {
        const hasPremium = phase.items.some((item) => item.accessLevel === "premium");

        return (
          <div key={phase.phase} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--theme-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center text-sm font-bold">{phaseIndex + 1}</span>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{phase.phase}</h3>
                  <p className="text-xs text-text-dim">{phase.description}</p>
                </div>
              </div>
              {hasPremium && <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Premium</span>}
            </div>

            <ul className="divide-y divide-[var(--theme-border)]">
              {phase.items.map((item) => {
                const showLock = item.accessLevel === "premium" && ownershipResolved && !isOwned;

                return (
                  <li key={item.contentKey}>
                    <Link href={`${basePath}/courses/${slug}/${item.contentKey}/`} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--theme-white-alpha-5)] transition-colors">
                      <span className="flex items-center gap-3 min-w-0">
                        <ContentMarker accessLevel={item.accessLevel} showLock={showLock} />
                        <span className="text-sm text-text-muted truncate">{item.title}</span>
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-dim">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
