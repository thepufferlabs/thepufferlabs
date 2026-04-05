import { discoverCourseRepos, getCourseBySlug } from "@/lib/courses/registry";
import { fetchContentIndex, fetchSidebar, fetchMarkdownContent, getContentEntry, stripFrontmatter } from "@/lib/courses/content-loader";
import MarkdownRenderer from "@/components/docs/MarkdownRenderer";
import PremiumGate from "@/components/courses/PremiumGate";
import Link from "next/link";

export async function generateStaticParams() {
  const products = await discoverCourseRepos();
  const params: { slug: string; contentKey: string }[] = [];

  for (const product of products) {
    const seen = new Set<string>();

    try {
      // Content index has free (and possibly premium) entries
      const contentIndex = await fetchContentIndex(product.slug);
      for (const item of contentIndex) {
        if (item.isPublished !== false && !seen.has(item.contentKey)) {
          seen.add(item.contentKey);
          params.push({ slug: product.slug, contentKey: item.contentKey });
        }
      }
    } catch (err) {
      console.error(`Failed to fetch content index for ${product.slug}:`, err);
    }

    try {
      // Sidebar may reference premium content keys not in product_content
      const sidebar = await fetchSidebar(product.slug);
      for (const section of sidebar.sections) {
        for (const item of section.items) {
          if (item.contentKey && !seen.has(item.contentKey)) {
            seen.add(item.contentKey);
            params.push({ slug: product.slug, contentKey: item.contentKey });
          }
        }
      }
    } catch (err) {
      console.error(`Failed to fetch sidebar for ${product.slug}:`, err);
    }
  }

  return params;
}

interface PageProps {
  params: Promise<{ slug: string; contentKey: string }>;
}

export default async function ContentPage({ params }: PageProps) {
  const { slug, contentKey } = await params;
  const product = await getCourseBySlug(slug);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!product) {
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
    contentIndex = await fetchContentIndex(slug);
  } catch {
    return (
      <div className="py-20 text-center">
        <p className="text-text-muted">Failed to load content index.</p>
      </div>
    );
  }

  const contentEntry = getContentEntry(contentIndex, contentKey);

  // Content not in product_content table → treat as premium (requires purchase)
  if (!contentEntry) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6">
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
        <PremiumGate
          title={contentKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          tags={[]}
        />
      </div>
    );
  }

  // Premium content in product_content: show gate
  if (contentEntry.accessLevel === "premium") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6">
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

  // Free content: fetch from Supabase Storage and render markdown
  const filePath = contentEntry.contentType === "code" ? `${contentEntry.sourcePath}/README.md` : contentEntry.sourcePath;

  let markdown: string;
  try {
    markdown = await fetchMarkdownContent(filePath);
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
    const stripped = srcFile.replace(/^\d+-/, "");
    if (stripped !== srcFile) linkMap[stripped] = route;
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
