import Link from "next/link";
import type { CourseMeta } from "@/lib/courses/types";

interface CourseCardProps {
  meta: CourseMeta;
  basePath: string;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-400 border-green-500/20",
  intermediate: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  advanced: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "beginner-to-advanced": "bg-teal/10 text-teal border-teal/20",
};

const CATEGORY_COLORS: Record<string, string> = {
  devops: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  architecture: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  backend: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  frontend: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  security: "bg-red-500/10 text-red-400 border-red-500/20",
  data: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

function formatLevel(level: string): string {
  return level
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" → ");
}

export default function CourseCard({ meta, basePath }: CourseCardProps) {
  const freeCount = meta.previewDocPaths.length;
  const premiumCount = meta.premiumDocPaths.length;
  const levelClass = LEVEL_COLORS[meta.level] ?? LEVEL_COLORS["intermediate"];
  const categoryClass = CATEGORY_COLORS[meta.category] ?? "bg-[var(--theme-white-alpha-5)] text-text-muted border-[var(--theme-border)]";

  return (
    <Link
      href={`${basePath}/courses/${meta.slug}/`}
      className="group rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] hover:border-teal/30 hover:shadow-[0_0_40px_rgba(45,212,191,0.08)] transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* Header gradient */}
      <div className="h-2 bg-gradient-to-r from-teal via-teal/60 to-lime/40" />

      <div className="p-6 flex-1 flex flex-col">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${categoryClass}`}>{meta.category}</span>
          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${levelClass}`}>{formatLevel(meta.level)}</span>
        </div>

        {/* Title & description */}
        <h3 className="text-xl font-bold text-text-primary group-hover:text-teal transition-colors mb-2">{meta.title}</h3>
        <p className="text-sm text-text-muted leading-relaxed mb-4 line-clamp-3 flex-1">{meta.shortDescription}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {meta.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal/5 text-teal/60 border border-teal/10">
              {tag}
            </span>
          ))}
          {meta.tags.length > 5 && <span className="text-[10px] text-text-dim self-center">+{meta.tags.length - 5}</span>}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-4 border-t border-[var(--theme-border)]">
          <div className="flex items-center gap-1.5 text-xs text-text-dim">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
              <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
            <span>{freeCount} free</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-dim">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span>{premiumCount} premium</span>
          </div>
          <div className="ml-auto text-xs text-teal font-medium group-hover:translate-x-1 transition-transform">Start Learning &rarr;</div>
        </div>
      </div>
    </Link>
  );
}
