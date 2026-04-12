"use client";

import Link from "next/link";
import type { ContentEntry } from "@/lib/courses/types";
import { useCourseOwnership } from "@/components/courses/useCourseOwnership";
import PremiumContentBadge from "@/components/courses/PremiumContentBadge";

interface CourseContentNavProps {
  slug: string;
  prev: ContentEntry | null;
  next: ContentEntry | null;
}

function ContentStatus({ accessLevel, showLock }: { accessLevel: "free" | "premium"; showLock: boolean }) {
  if (showLock) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400/60">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    );
  }

  if (accessLevel === "premium") {
    return <PremiumContentBadge compact />;
  }

  return null;
}

export default function CourseContentNav({ slug, prev, next }: CourseContentNavProps) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const { isOwned, ownershipResolved } = useCourseOwnership(slug);

  return (
    <div className="mt-16 pt-8 border-t border-[var(--theme-border)] flex items-center justify-between gap-4">
      {prev ? (
        <Link href={`${basePath}/courses/${slug}/${prev.contentKey}/`} className="group flex flex-col items-start text-sm">
          <span className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Previous</span>
          <span className="text-text-muted group-hover:text-teal transition-colors flex items-center gap-1">
            &larr; {prev.title}
            <ContentStatus accessLevel={prev.accessLevel} showLock={prev.accessLevel === "premium" && ownershipResolved && !isOwned} />
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link href={`${basePath}/courses/${slug}/${next.contentKey}/`} className="group flex flex-col items-end text-sm">
          <span className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Next</span>
          <span className="text-text-muted group-hover:text-teal transition-colors flex items-center gap-1">
            {next.title} &rarr;
            <ContentStatus accessLevel={next.accessLevel} showLock={next.accessLevel === "premium" && ownershipResolved && !isOwned} />
          </span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
