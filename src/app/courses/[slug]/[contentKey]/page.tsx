import { discoverCourseRepos, getCourseBySlug } from "@/lib/courses/registry";
import { fetchContentIndex, fetchMarkdownContent, getContentEntry, stripFrontmatter } from "@/lib/courses/content-loader";
import MarkdownRenderer from "@/components/docs/MarkdownRenderer";
import PremiumGate from "@/components/courses/PremiumGate";
import Link from "next/link";

export async function generateStaticParams() {
  const registry = await discoverCourseRepos();
  const params: { slug: string; contentKey: string }[] = [];

  for (const entry of registry) {
    try {
      const contentIndex = await fetchContentIndex(entry);
      for (const item of contentIndex) {
        if (item.isPublished !== false) {
          params.push({ slug: entry.slug, contentKey: item.contentKey });
        }
      }
    } catch (err) {
      console.error(`Failed to generate params for ${entry.slug}:`, err);
    }
  }

  return params;
}

interface PageProps {
  params: Promise<{ slug: string; contentKey: string }>;
}

export default async function ContentPage({ params }: PageProps) {
  const { slug, contentKey } = await params;
  const registry = await discoverCourseRepos();
  const entry = getCourseBySlug(slug, registry);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!entry) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-xl font-bold text-text-primary mb-2">Course not found</h1>
        <Link href={`${basePath}/courses/`} className="text-teal hover:underline text-sm">
          &larr; Back to courses
        </Link>
      </div>
    );
  }

  let contentIndex;
  try {
    contentIndex = await fetchContentIndex(entry);
  } catch {
    return (
      <div className="py-20 text-center">
        <p className="text-text-muted">Failed to load content index.</p>
      </div>
    );
  }

  const contentEntry = getContentEntry(contentIndex, contentKey);

  if (!contentEntry) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-xl font-bold text-text-primary mb-2">Content not found</h1>
        <p className="text-text-muted text-sm mb-4">No content found for &ldquo;{contentKey}&rdquo;.</p>
        <Link href={`${basePath}/courses/${slug}/`} className="text-teal hover:underline text-sm">
          &larr; Back to course overview
        </Link>
      </div>
    );
  }

  // Premium content: show gate, don't fetch markdown
  if (contentEntry.accessLevel === "premium") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-dim font-mono mb-6">
          <Link href={`${basePath}/courses/`} className="hover:text-teal transition-colors">
            courses
          </Link>
          <span>/</span>
          <Link href={`${basePath}/courses/${slug}/`} className="hover:text-teal transition-colors">
            {slug}
          </Link>
          <span>/</span>
          <span className="text-amber-400">{contentKey}</span>
        </div>
        <PremiumGate title={contentEntry.title} tags={contentEntry.tags} />
      </div>
    );
  }

  // Free content: fetch and render markdown
  // For code entries, sourcePath is a directory — fetch README.md inside it
  const filePath = contentEntry.contentType === "code" ? `${contentEntry.sourcePath}/README.md` : contentEntry.sourcePath;

  let markdown: string;
  try {
    markdown = await fetchMarkdownContent(entry, filePath);
    markdown = stripFrontmatter(markdown);
  } catch {
    markdown = `# Failed to Load\n\nCould not load content for **${contentEntry.title}**.`;
  }

  // Build serializable link map: filename → course route
  const linkMap: Record<string, string> = {};
  for (const e of contentIndex) {
    const srcFile = e.sourcePath.split("/").pop()?.replace(/\.md$/, "") ?? "";
    const route = `${basePath}/courses/${slug}/${e.contentKey}/`;
    linkMap[srcFile] = route;
    // Also map without numeric prefix: "07-ingress-and-dns" → "ingress-and-dns"
    const stripped = srcFile.replace(/^\d+-/, "");
    if (stripped !== srcFile) linkMap[stripped] = route;
    // Also map by contentKey directly
    linkMap[e.contentKey] = route;
  }

  // Find prev/next for navigation
  const docEntries = contentIndex.filter((e) => e.isPublished !== false).sort((a, b) => a.order - b.order);
  const currentIdx = docEntries.findIndex((e) => e.contentKey === contentKey);
  const prev = currentIdx > 0 ? docEntries[currentIdx - 1] : null;
  const next = currentIdx < docEntries.length - 1 ? docEntries[currentIdx + 1] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-dim font-mono mb-6">
        <Link href={`${basePath}/courses/`} className="hover:text-teal transition-colors">
          courses
        </Link>
        <span>/</span>
        <Link href={`${basePath}/courses/${slug}/`} className="hover:text-teal transition-colors">
          {slug}
        </Link>
        <span>/</span>
        <span className="text-teal">{contentKey}</span>
      </div>

      {/* Tags */}
      {contentEntry.tags && contentEntry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {contentEntry.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal/5 text-teal/60 border border-teal/10">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Markdown content */}
      <MarkdownRenderer content={markdown} linkMap={linkMap} />

      {/* Prev / Next navigation */}
      <div className="mt-16 pt-8 border-t border-[var(--theme-border)] flex items-center justify-between gap-4">
        {prev ? (
          <Link href={`${basePath}/courses/${slug}/${prev.contentKey}/`} className="group flex flex-col items-start text-sm">
            <span className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Previous</span>
            <span className="text-text-muted group-hover:text-teal transition-colors flex items-center gap-1">
              &larr; {prev.title}
              {prev.accessLevel === "premium" && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400/60">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              )}
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
              {next.accessLevel === "premium" && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400/60">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              )}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
