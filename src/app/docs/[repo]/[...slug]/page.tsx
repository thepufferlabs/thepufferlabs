import {
  discoverAllDocs,
  fetchFileContent,
  extractToc,
  getAllDocFiles,
} from "@/lib/github";
import DocsSidebar from "@/components/docs/DocsSidebar";
import TableOfContents from "@/components/docs/TableOfContents";
import MarkdownRenderer from "@/components/docs/MarkdownRenderer";
import Link from "next/link";

interface PageProps {
  params: Promise<{ repo: string; slug: string[] }>;
}

// Build all doc pages at build time via dynamic discovery
export async function generateStaticParams() {
  const registry = await discoverAllDocs();
  const params: { repo: string; slug: string[] }[] = [];

  for (const config of registry) {
    for (const file of getAllDocFiles(config)) {
      const slugParts = file.path.replace(/\.md$/, "").split("/");
      params.push({ repo: config.repo, slug: slugParts });
    }
  }

  return params;
}

export default async function DocPage({ params }: PageProps) {
  const { repo, slug } = await params;
  const registry = await discoverAllDocs();
  const config = registry.find((r) => r.repo === repo);
  const filePath = `${slug.join("/")}.md`;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!config) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Project not found
          </h1>
          <p className="text-sm text-text-muted mb-4">
            The repository &ldquo;{repo}&rdquo; was not found or has no docs.
          </p>
          <Link
            href={`${basePath}/docs/`}
            className="text-teal hover:underline text-sm"
          >
            &larr; Back to all docs
          </Link>
        </div>
      </div>
    );
  }

  let content: string;
  try {
    content = await fetchFileContent(repo, filePath, config.branch);
  } catch {
    content = `# File Not Found\n\nCould not load \`${filePath}\` from **${config.name}**.\n\nThis file may have been moved or the repository may be private.`;
  }

  const toc = extractToc(content);
  const allFiles = getAllDocFiles(config);
  const currentIndex = allFiles.findIndex((f) => f.path === filePath);
  const prevFile = currentIndex > 0 ? allFiles[currentIndex - 1] : null;
  const nextFile =
    currentIndex < allFiles.length - 1 ? allFiles[currentIndex + 1] : null;

  function docHref(path: string) {
    return `${basePath}/docs/${repo}/${path.replace(/\.md$/, "")}/`;
  }

  return (
    <div className="min-h-screen bg-navy flex">
      {/* Left sidebar — tree view */}
      <DocsSidebar
        registry={registry}
        currentRepo={repo}
        currentPath={filePath}
      />

      {/* Middle — content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Breadcrumb */}
        <div className="sticky top-0 z-10 border-b border-white/5 bg-navy/90 backdrop-blur-md pl-10 pr-4 sm:px-8 lg:pl-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-text-dim font-mono">
              <Link
                href={`${basePath}/docs/`}
                className="hover:text-teal transition-colors"
              >
                docs
              </Link>
              <span>/</span>
              <span className="text-text-muted">{config.name}</span>
              <span>/</span>
              <span className="text-teal">{slug[slug.length - 1]}</span>
            </div>

            {/* View on GitHub link */}
            <a
              href={`${config.htmlUrl}/blob/${config.branch}/${filePath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-text-dim hover:text-teal transition-colors flex items-center gap-1"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Edit on GitHub
            </a>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
          {/* Repo/topic metadata */}
          {config.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {config.topics.map((topic) => (
                <span
                  key={topic}
                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal/5 text-teal/60 border border-teal/10"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          <MarkdownRenderer content={content} />

          {/* Prev / Next navigation */}
          <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between gap-4">
            {prevFile ? (
              <Link
                href={docHref(prevFile.path)}
                className="group flex flex-col items-start text-sm"
              >
                <span className="text-[10px] text-text-dim uppercase tracking-wider mb-1">
                  Previous
                </span>
                <span className="text-text-muted group-hover:text-teal transition-colors">
                  &larr; {prevFile.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
            {nextFile ? (
              <Link
                href={docHref(nextFile.path)}
                className="group flex flex-col items-end text-sm"
              >
                <span className="text-[10px] text-text-dim uppercase tracking-wider mb-1">
                  Next
                </span>
                <span className="text-text-muted group-hover:text-teal transition-colors">
                  {nextFile.title} &rarr;
                </span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </main>

      {/* Right sidebar — TOC */}
      <div className="hidden xl:block border-l border-white/5">
        <div className="sticky top-0 pt-6 px-4">
          <TableOfContents entries={toc} />
        </div>
      </div>
      {/* Mobile TOC — fixed FAB + drawer, no flex space */}
      <TableOfContents entries={toc} mobile />
    </div>
  );
}
