import { getCourseBySlug } from "@/lib/courses/registry";
import { fetchToc, fetchContentIndex } from "@/lib/courses/content-loader";
import Link from "next/link";

export const dynamic = "force-dynamic";


interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseOverviewPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getCourseBySlug(slug);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!product) return null;

  let toc, contentIndex;
  try {
    [toc, contentIndex] = await Promise.all([fetchToc(slug), fetchContentIndex(slug)]);
  } catch {
    return (
      <div className="py-20 text-center">
        <p className="text-text-muted">Failed to load course data.</p>
      </div>
    );
  }

  const freeCount = product.freeContentCount;
  const premiumCount = product.premiumContentCount;
  const codeExamples = contentIndex.filter((e) => e.contentType === "code").length;
  const firstFreeKey = toc.toc[0]?.items[0]?.contentKey;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
      {/* Course Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          {product.category && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">{product.category}</span>
          )}
          {product.level && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-teal/10 text-teal border border-teal/20">
              {product.level
                .split("-")
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" → ")}
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-4">{product.title}</h1>

        <p className="text-text-muted leading-relaxed text-lg mb-6">{product.shortDescription}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{freeCount}</p>
            <p className="text-[11px] text-text-dim font-mono uppercase tracking-wider">Free Lessons</p>
          </div>
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{premiumCount}</p>
            <p className="text-[11px] text-text-dim font-mono uppercase tracking-wider">Premium Lessons</p>
          </div>
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] p-4 text-center">
            <p className="text-2xl font-bold text-teal">{codeExamples}</p>
            <p className="text-[11px] text-text-dim font-mono uppercase tracking-wider">Code Examples</p>
          </div>
        </div>

        {/* Start Learning CTA */}
        {firstFreeKey && (
          <Link
            href={`${basePath}/courses/${slug}/${firstFreeKey}/`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal text-navy font-semibold text-sm hover:bg-teal/90 transition-colors shadow-lg shadow-teal/20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start Learning
          </Link>
        )}
      </div>

      {/* Learning Path / TOC */}
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-6">Learning Path</h2>

        <div className="space-y-6">
          {toc.toc.map((phase, phaseIndex) => {
            const hasPremium = phase.items.some((i) => i.accessLevel === "premium");

            return (
              <div key={phase.phase} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] overflow-hidden">
                {/* Phase header */}
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

                {/* Items */}
                <ul className="divide-y divide-[var(--theme-border)]">
                  {phase.items.map((item) => (
                    <li key={item.contentKey}>
                      <Link href={`${basePath}/courses/${slug}/${item.contentKey}/`} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--theme-white-alpha-5)] transition-colors">
                        <span className="flex items-center gap-3">
                          {item.accessLevel === "free" ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                              <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                            </svg>
                          ) : (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-amber-400/60"
                            >
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                          )}
                          <span className="text-sm text-text-muted">{item.title}</span>
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-dim">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
