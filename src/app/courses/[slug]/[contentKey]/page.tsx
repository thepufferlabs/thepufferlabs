import { getCourseBySlug } from "@/lib/courses/registry";
import { fetchContentIndex, fetchMarkdownContent, getContentEntry, stripFrontmatter } from "@/lib/courses/content-loader";
import MarkdownRenderer from "@/components/docs/MarkdownRenderer";
import PremiumGate from "@/components/courses/PremiumGate";
import CourseContentNav from "@/components/courses/CourseContentNav";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
        <PremiumGate title={contentKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} tags={[]} slug={slug} contentKey={contentKey} />
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
        <PremiumGate title={contentEntry.title} tags={contentEntry.tags} slug={slug} storagePath={contentEntry.sourcePath} contentKey={contentKey} />
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

      <CourseContentNav slug={slug} prev={prev} next={next} />
    </div>
  );
}
