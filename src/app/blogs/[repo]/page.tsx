import Link from "next/link";
import {
  fetchAllBlogs,
  fetchAllRepos,
  fetchFileContent,
  extractToc,
} from "@/lib/github";
import MarkdownRenderer from "@/components/docs/MarkdownRenderer";
import TableOfContents from "@/components/docs/TableOfContents";

interface PageProps {
  params: Promise<{ repo: string }>;
}

export async function generateStaticParams() {
  try {
    const blogs = await fetchAllBlogs();
    return blogs.map((b) => ({ repo: b.repo }));
  } catch {
    return [];
  }
}

export default async function BlogPage({ params }: PageProps) {
  const { repo } = await params;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const githubOwner = process.env.NEXT_PUBLIC_GITHUB_OWNER ?? "";

  let repos: Awaited<ReturnType<typeof fetchAllRepos>> = [];
  try {
    repos = await fetchAllRepos();
  } catch {
    // fallback to empty
  }

  const repoInfo = repos.find((r) => r.name === repo);
  const branch = repoInfo?.default_branch ?? "main";

  let content: string;
  try {
    content = await fetchFileContent(repo, "README.md", branch);
  } catch {
    content = `# Not Found\n\nCould not load README for **${repo}**.`;
  }

  const toc = extractToc(content);
  const repoUrl = repoInfo?.html_url ?? `https://github.com/${githubOwner}/${repo}`;

  return (
    <div className="min-h-screen bg-navy flex">
      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Breadcrumb */}
        <div className="sticky top-0 z-10 border-b border-white/5 bg-navy/90 backdrop-blur-md px-4 sm:px-8 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-xs text-text-dim font-mono">
              <Link
                href={`${basePath}/blogs/`}
                className="hover:text-teal transition-colors"
              >
                blogs
              </Link>
              <span>/</span>
              <span className="text-teal">{repo}</span>
            </div>

            <a
              href={repoUrl}
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
              View on GitHub
            </a>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
          {/* Repo metadata */}
          {repoInfo && (
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {repoInfo.language && (
                <span className="text-xs font-mono text-text-dim px-2 py-0.5 rounded border border-white/5 bg-white/[0.02]">
                  {repoInfo.language}
                </span>
              )}
              {repoInfo.topics?.slice(0, 5).map((topic: string) => (
                <span
                  key={topic}
                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal/5 text-teal/60 border border-teal/10"
                >
                  {topic}
                </span>
              ))}
              {repoInfo.stargazers_count > 0 && (
                <span className="text-xs text-text-dim flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
                  </svg>
                  {repoInfo.stargazers_count}
                </span>
              )}
            </div>
          )}

          <MarkdownRenderer content={content} repo={repo} />

          {/* Back link */}
          <div className="mt-16 pt-8 border-t border-white/5">
            <Link
              href={`${basePath}/blogs/`}
              className="text-sm text-text-muted hover:text-teal transition-colors"
            >
              &larr; Back to all blogs
            </Link>
          </div>
        </div>
      </main>

      {/* Right sidebar — TOC (desktop) */}
      <div className="hidden xl:block border-l border-white/5">
        <div className="sticky top-0 pt-6 px-4">
          <TableOfContents entries={toc} />
        </div>
      </div>
      {/* Mobile TOC */}
      <TableOfContents entries={toc} mobile />
    </div>
  );
}
