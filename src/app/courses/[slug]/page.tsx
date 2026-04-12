import { getCourseBySlug } from "@/lib/courses/registry";
import { fetchToc, fetchContentIndex } from "@/lib/courses/content-loader";
import Link from "next/link";
import CourseOverviewContent from "@/components/courses/CourseOverviewContent";

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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal text-btn-text font-semibold text-sm hover:bg-teal/90 transition-colors shadow-lg shadow-teal/20"
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

        <CourseOverviewContent slug={slug} phases={toc.toc} />
      </div>
    </div>
  );
}
