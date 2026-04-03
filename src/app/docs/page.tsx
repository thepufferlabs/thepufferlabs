import Link from "next/link";
import { discoverAllDocs, categorizeRepo, getAllDocFiles, getEstimatedReadTime, formatBytes, formatNumber, languagePercentages, CATEGORY_MAP, type RepoDocsConfig, type GHRepo } from "@/lib/github";

const LANGUAGE_COLORS: Record<string, string> = {
  "C#": "#9B4DCA",
  TypeScript: "#3178C6",
  JavaScript: "#F7DF1E",
  Python: "#3572A5",
  Shell: "#89E051",
  Go: "#00ADD8",
  Java: "#B07219",
  Rust: "#DEA584",
  Dockerfile: "#384D54",
  HTML: "#E34C26",
  CSS: "#1572B6",
  "Jupyter Notebook": "#DA5B0B",
  Unknown: "#6B7280",
};

function getLangColor(lang: string): string {
  return LANGUAGE_COLORS[lang] ?? "#6B7280";
}

export const metadata = {
  title: "Docs — The Puffer Labs",
  description: "Browse deep technical documentation across all The Puffer Labs projects. Auto-discovered from GitHub.",
};

function asGHRepo(config: RepoDocsConfig): GHRepo {
  return {
    name: config.repo,
    full_name: `${process.env.NEXT_PUBLIC_GITHUB_OWNER ?? ""}/${config.repo}`,
    description: config.description,
    language: config.language,
    default_branch: config.branch,
    topics: config.topics,
    html_url: config.htmlUrl,
    private: false,
    fork: false,
    archived: false,
    stargazers_count: config.stars,
    updated_at: config.updatedAt,
  };
}

export default async function DocsIndexPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const registry = await discoverAllDocs();

  // Group repos by category
  const categoryOrder = [...Object.values(CATEGORY_MAP), "Other Projects"];
  const grouped = new Map<string, RepoDocsConfig[]>();

  for (const config of registry) {
    const category = categorizeRepo(asGHRepo(config));
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category)!.push(config);
  }

  const totalDocs = registry.reduce((sum, r) => sum + getAllDocFiles(r).length, 0);
  const totalCodeFiles = registry.reduce((sum, r) => sum + r.totalFiles, 0);
  const totalCodeSize = registry.reduce((sum, r) => sum + r.totalSize, 0);

  // Aggregate language stats across all repos
  const globalLangStats: Record<string, number> = {};
  for (const config of registry) {
    for (const [lang, bytes] of Object.entries(config.languageStats)) {
      globalLangStats[lang] = (globalLangStats[lang] ?? 0) + bytes;
    }
  }
  const globalLangBreakdown = languagePercentages(globalLangStats);

  return (
    <div className="min-h-screen bg-navy pt-16">
      {/* Header */}
      <header className="border-b border-[var(--theme-border)] bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">The Puffer Labs Docs</h1>
            <p className="text-sm text-text-muted mt-0.5">Auto-discovered from GitHub &middot; Deep technical documentation</p>
          </div>

          {/* Aggregate stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] px-4 py-3">
              <p className="text-2xl font-bold text-teal">{registry.length}</p>
              <p className="text-[11px] text-text-dim font-mono uppercase tracking-wider">Projects</p>
            </div>
            <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] px-4 py-3">
              <p className="text-2xl font-bold text-teal">{totalDocs}</p>
              <p className="text-[11px] text-text-dim font-mono uppercase tracking-wider">Articles</p>
            </div>
            <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] px-4 py-3">
              <p className="text-2xl font-bold text-lime">{formatNumber(totalCodeFiles)}</p>
              <p className="text-[11px] text-text-dim font-mono uppercase tracking-wider">Source Files</p>
            </div>
            <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] px-4 py-3">
              <p className="text-2xl font-bold text-lime">{formatBytes(totalCodeSize)}</p>
              <p className="text-[11px] text-text-dim font-mono uppercase tracking-wider">Total Code</p>
            </div>
          </div>

          {/* Global language bar */}
          {globalLangBreakdown.length > 0 && (
            <div>
              <div className="flex h-2 rounded-full overflow-hidden mb-2">
                {globalLangBreakdown.map((lang) => (
                  <div
                    key={lang.language}
                    style={{
                      width: `${lang.percentage}%`,
                      backgroundColor: getLangColor(lang.language),
                    }}
                    title={`${lang.language}: ${lang.percentage}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {globalLangBreakdown.slice(0, 8).map((lang) => (
                  <span key={lang.language} className="inline-flex items-center gap-1.5 text-[11px] text-text-dim">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getLangColor(lang.language) }} />
                    {lang.language} <span className="text-text-dim/60">{lang.percentage}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Project dock by category */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {categoryOrder.map((category) => {
          const repos = grouped.get(category);
          if (!repos || repos.length === 0) return null;

          return (
            <section key={category} className="mb-14">
              <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-text-dim mb-5 font-mono">{category}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {repos.map((config) => {
                  const files = getAllDocFiles(config);
                  const firstFile = files[0];
                  const href = firstFile ? `${basePath}/docs/${config.repo}/${firstFile.path.replace(/\.md$/, "")}/` : `${basePath}/docs/`;
                  const langBreakdown = languagePercentages(config.languageStats);

                  return (
                    <div
                      key={config.repo}
                      className="group rounded-xl border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] hover:border-teal/20 hover:bg-[var(--theme-white-alpha-5)] transition-all duration-300 flex flex-col"
                    >
                      {/* Card header */}
                      <div className="p-5 pb-0 flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <Link href={href}>
                            <h3 className="text-base font-semibold text-text-primary group-hover:text-teal transition-colors">{config.name}</h3>
                          </Link>
                          <a href={config.htmlUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 ml-2 text-text-dim hover:text-teal transition-colors" title="View on GitHub">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                            </svg>
                          </a>
                        </div>

                        <p className="text-xs text-text-muted leading-relaxed mb-3 line-clamp-2">{config.description}</p>

                        {/* Topics/tags */}
                        {config.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {config.topics.slice(0, 5).map((topic) => (
                              <span key={topic} className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono bg-teal/5 text-teal/60 border border-teal/10">
                                {topic}
                              </span>
                            ))}
                            {config.topics.length > 5 && <span className="text-[9px] text-text-dim/50 self-center">+{config.topics.length - 5}</span>}
                          </div>
                        )}

                        {/* Repo stats row */}
                        <div className="flex items-center gap-3 text-[10px] text-text-dim font-mono mb-3">
                          <span className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: getLangColor(config.language),
                              }}
                            />
                            {config.language}
                          </span>
                          <span>{config.totalFiles} files</span>
                          <span>{formatBytes(config.totalSize)}</span>
                          {config.stars > 0 && <span>&#9733; {config.stars}</span>}
                        </div>

                        {/* Per-repo language bar */}
                        {langBreakdown.length > 1 && (
                          <div className="mb-3">
                            <div className="flex h-1.5 rounded-full overflow-hidden mb-1">
                              {langBreakdown.map((lang) => (
                                <div
                                  key={lang.language}
                                  style={{
                                    width: `${lang.percentage}%`,
                                    backgroundColor: getLangColor(lang.language),
                                  }}
                                  title={`${lang.language}: ${lang.percentage}%`}
                                />
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                              {langBreakdown.slice(0, 4).map((lang) => (
                                <span key={lang.language} className="inline-flex items-center gap-1 text-[9px] text-text-dim/60">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{
                                      backgroundColor: getLangColor(lang.language),
                                    }}
                                  />
                                  {lang.language} {lang.percentage}%
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card footer */}
                      <div className="px-5 pb-4 pt-3 border-t border-[var(--theme-border)] mt-auto">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] text-text-dim font-mono">
                            {files.length} {files.length === 1 ? "doc" : "docs"}
                          </span>
                          <Link href={href} className="text-xs text-teal/60 hover:text-teal transition-colors font-medium">
                            Browse &rarr;
                          </Link>
                        </div>

                        {/* File preview list */}
                        <ul className="space-y-0.5">
                          {files.slice(0, 3).map((file) => (
                            <li key={file.path} className="flex items-center justify-between text-[11px] text-text-dim">
                              <span className="truncate">
                                <span className="mr-1 opacity-40">&#9656;</span>
                                {file.title}
                              </span>
                              {file.size > 0 && <span className="text-text-dim/40 ml-2 shrink-0">{getEstimatedReadTime(file.size)}</span>}
                            </li>
                          ))}
                          {files.length > 3 && <li className="text-[11px] text-text-dim/50 italic">+{files.length - 3} more</li>}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {registry.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-muted">
              No documentation found. Add a <code className="text-teal">docs/</code> folder with <code className="text-teal">.md</code> files to your repos.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--theme-border)] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <Link href={`${basePath}/`} className="text-sm text-text-dim hover:text-teal transition-colors">
            &larr; Back to The Puffer Labs
          </Link>
          <p className="text-xs text-text-dim font-mono">&copy; {new Date().getFullYear()} The Puffer Labs &middot; Powered by GitHub API</p>
        </div>
      </footer>
    </div>
  );
}
