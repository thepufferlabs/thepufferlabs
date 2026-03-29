/**
 * GitHub API service for dynamically discovering repos and docs.
 *
 * Uses a PAT (Personal Access Token) set via GITHUB_PAT env var.
 * Falls back to unauthenticated requests (60 req/hr limit) if no PAT.
 *
 * PAT Setup:
 *   1. Go to https://github.com/settings/tokens?type=beta
 *   2. Create a fine-grained PAT with:
 *      - Resource owner: your account
 *      - Repository access: "All repositories" or select specific ones
 *      - Permissions: Contents (read-only), Metadata (read-only)
 *   3. Set as GITHUB_PAT env var locally or in GitHub Actions secrets
 */

const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER ?? "";
const GITHUB_PAT = process.env.GITHUB_PAT ?? "";
const API_BASE = "https://api.github.com";

// ---------------------------------------------------------------------------
// Core request helper
// ---------------------------------------------------------------------------

function headers(): HeadersInit {
  const h: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (GITHUB_PAT) {
    h.Authorization = `Bearer ${GITHUB_PAT}`;
  }
  return h;
}

async function ghFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: headers(),
    next: { revalidate: 3600 },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${path} — ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GHRepo {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  default_branch: string;
  topics: string[];
  html_url: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  updated_at: string;
}

export interface GHTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

export interface DocFile {
  path: string;
  title: string;
  size: number;
}

export interface DocFolder {
  name: string;
  files: DocFile[];
}

export interface RepoDocsConfig {
  repo: string;
  name: string;
  description: string;
  language: string;
  branch: string;
  topics: string[];
  htmlUrl: string;
  updatedAt: string;
  stars: number;
  docs: DocFolder[];
  languageStats: Record<string, number>;
  totalFiles: number;
  totalSize: number;
}

// ---------------------------------------------------------------------------
// Topic → Category mapping
// ---------------------------------------------------------------------------

/**
 * TAGGING CONVENTION:
 *
 * Add GitHub topics to your repos to auto-categorize them in the docs viewer.
 * Use ONE primary category topic + additional descriptive topics.
 *
 * Category topics (pick one per repo):
 *   pufferlabs-messaging     → Messaging & Streaming
 *   pufferlabs-architecture  → Architecture & Patterns
 *   pufferlabs-security      → Security & Auth
 *   pufferlabs-infra         → Infrastructure & DevOps
 *   pufferlabs-distributed   → Distributed Systems
 *   pufferlabs-frontend      → APIs & Frontend
 *   pufferlabs-data          → Data & ML
 *   pufferlabs-testing       → Testing & QA
 *
 * Additional useful topics:
 *   pufferlabs-docs          → Marks repo as having documentation (auto-included)
 *   dotnet, typescript, python, etc. → Language tags
 *   kafka, rabbitmq, grpc, etc.     → Technology tags
 *
 * Repos WITHOUT a pufferlabs-* category topic are placed in "Other Projects".
 * Repos WITHOUT any docs/ folder are excluded from the docs viewer.
 */

export const CATEGORY_MAP: Record<string, string> = {
  "pufferlabs-messaging": "Messaging & Streaming",
  "pufferlabs-architecture": "Architecture & Patterns",
  "pufferlabs-security": "Security & Auth",
  "pufferlabs-infra": "Infrastructure & DevOps",
  "pufferlabs-distributed": "Distributed Systems",
  "pufferlabs-frontend": "APIs & Frontend",
  "pufferlabs-data": "Data & ML",
  "pufferlabs-testing": "Testing & QA",
};

const FALLBACK_CATEGORIES: Record<string, string> = {
  // Keyword-based fallback when no topic is set
  kafka: "Messaging & Streaming",
  rabbitmq: "Messaging & Streaming",
  sse: "Messaging & Streaming",
  "server-sent": "Messaging & Streaming",
  cqrs: "Architecture & Patterns",
  ddd: "Architecture & Patterns",
  "domain-driven": "Architecture & Patterns",
  "design-pattern": "Architecture & Patterns",
  "system-design": "Architecture & Patterns",
  oidc: "Security & Auth",
  oauth: "Security & Auth",
  mtls: "Security & Auth",
  certificate: "Security & Auth",
  rbac: "Security & Auth",
  abac: "Security & Auth",
  dapr: "Infrastructure & DevOps",
  keda: "Infrastructure & DevOps",
  nginx: "Infrastructure & DevOps",
  kubernetes: "Infrastructure & DevOps",
  linux: "Infrastructure & DevOps",
  logging: "Infrastructure & DevOps",
  distributed: "Distributed Systems",
  akka: "Distributed Systems",
  actor: "Distributed Systems",
  graphql: "APIs & Frontend",
  grpc: "APIs & Frontend",
  angular: "APIs & Frontend",
  regex: "APIs & Frontend",
  cypress: "Testing & QA",
  testing: "Testing & QA",
};

export function categorizeRepo(repo: GHRepo): string {
  // 1. Check explicit pufferlabs-* topics
  for (const topic of repo.topics ?? []) {
    if (CATEGORY_MAP[topic]) return CATEGORY_MAP[topic];
  }

  // 2. Fallback: match repo name or description against keywords
  const searchText = `${repo.name} ${repo.description ?? ""}`.toLowerCase();
  for (const [keyword, category] of Object.entries(FALLBACK_CATEGORIES)) {
    if (searchText.includes(keyword.toLowerCase())) return category;
  }

  return "Other Projects";
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

/**
 * Fetch all public repos for the configured owner.
 * Paginates automatically to get all repos.
 */
export async function fetchAllRepos(): Promise<GHRepo[]> {
  const repos: GHRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const batch = await ghFetch<GHRepo[]>(
      `/users/${GITHUB_OWNER}/repos?per_page=${perPage}&page=${page}&sort=updated&direction=desc&type=public`
    );
    repos.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }

  return repos.filter((r) => !r.fork && !r.archived && !r.private);
}

/**
 * Fetch the full file tree for a repo.
 * Uses the Git Trees API with `recursive=1` for a single API call.
 */
export async function fetchRepoTree(
  repo: string,
  branch: string
): Promise<GHTreeItem[]> {
  try {
    const data = await ghFetch<{ tree: GHTreeItem[] }>(
      `/repos/${GITHUB_OWNER}/${repo}/git/trees/${branch}?recursive=1`
    );
    return data.tree;
  } catch {
    return [];
  }
}

/**
 * Discover all .md files under docs/ in a repo.
 * Groups them by folder for the tree view.
 */
export function discoverDocs(tree: GHTreeItem[]): DocFolder[] {
  const mdFiles = tree.filter(
    (item) =>
      item.type === "blob" &&
      item.path.startsWith("docs/") &&
      item.path.endsWith(".md")
  );

  if (mdFiles.length === 0) return [];

  // Group by parent directory
  const folderMap = new Map<string, DocFile[]>();

  for (const file of mdFiles) {
    const parts = file.path.split("/");
    const folderPath = parts.length > 2 ? parts.slice(0, -1).join("/") : "docs";

    if (!folderMap.has(folderPath)) {
      folderMap.set(folderPath, []);
    }

    folderMap.get(folderPath)!.push({
      path: file.path,
      title: titleFromPath(file.path),
      size: file.size ?? 0,
    });
  }

  // Sort files within each folder
  const folders: DocFolder[] = [];
  for (const [name, files] of folderMap) {
    files.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));
    folders.push({ name, files });
  }

  // Sort folders
  folders.sort((a, b) => a.name.localeCompare(b.name));

  return folders;
}

/**
 * Fetch raw file content from a repo.
 */
export async function fetchFileContent(
  repo: string,
  path: string,
  branch = "main"
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${repo}/${branch}/${path}`;
  const res = await fetch(url, {
    headers: GITHUB_PAT ? { Authorization: `Bearer ${GITHUB_PAT}` } : {},
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }

  return res.text();
}

/**
 * Fetch language breakdown for a repo (bytes per language).
 * Uses the Languages API: GET /repos/{owner}/{repo}/languages
 */
export async function fetchLanguageStats(
  repo: string
): Promise<Record<string, number>> {
  try {
    return await ghFetch<Record<string, number>>(
      `/repos/${GITHUB_OWNER}/${repo}/languages`
    );
  } catch {
    return {};
  }
}

/**
 * Count total files and total size from a repo tree.
 */
function computeTreeStats(tree: GHTreeItem[]): { totalFiles: number; totalSize: number } {
  let totalFiles = 0;
  let totalSize = 0;
  for (const item of tree) {
    if (item.type === "blob") {
      totalFiles++;
      totalSize += item.size ?? 0;
    }
  }
  return { totalFiles, totalSize };
}

/**
 * Full discovery: fetch all repos → discover their docs → build registry.
 * This is the main entry point called at build time.
 *
 * Falls back to a static registry when the GitHub API is unreachable
 * (e.g. local builds without internet or PAT).
 */
export async function discoverAllDocs(): Promise<RepoDocsConfig[]> {
  let repos: GHRepo[];
  try {
    repos = await fetchAllRepos();
  } catch (err) {
    console.warn(
      `[ThePufferLabs] GitHub API unreachable, using fallback registry: ${err instanceof Error ? err.message : err}`
    );
    const { FALLBACK_REGISTRY } = await import("@/lib/fallback-registry");
    return FALLBACK_REGISTRY;
  }
  const configs: RepoDocsConfig[] = [];

  // Fetch trees in parallel (batched to avoid rate limits)
  const batchSize = 10;
  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (repo) => {
        const [tree, languageStats] = await Promise.all([
          fetchRepoTree(repo.name, repo.default_branch),
          fetchLanguageStats(repo.name),
        ]);
        const docs = discoverDocs(tree);

        if (docs.length === 0) return null;

        const { totalFiles, totalSize } = computeTreeStats(tree);

        const config: RepoDocsConfig = {
          repo: repo.name,
          name: humanizeName(repo.name),
          description: repo.description ?? `${repo.name} documentation`,
          language: repo.language ?? "Unknown",
          branch: repo.default_branch,
          topics: repo.topics ?? [],
          htmlUrl: repo.html_url,
          updatedAt: repo.updated_at,
          stars: repo.stargazers_count,
          docs,
          languageStats,
          totalFiles,
          totalSize,
        };

        return config;
      })
    );

    configs.push(...results.filter((c): c is RepoDocsConfig => c !== null));
  }

  // Sort by name
  configs.sort((a, b) => a.name.localeCompare(b.name));
  return configs;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function titleFromPath(filePath: string): string {
  const filename = filePath.split("/").pop() ?? filePath;
  return filename
    .replace(/\.md$/, "")
    .replace(/^\d+-/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanizeName(repoName: string): string {
  return repoName
    .replace(/^Dotnet/, ".NET ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\. Net/g, ".NET")
    .trim();
}

// ---------------------------------------------------------------------------
// TOC extraction
// ---------------------------------------------------------------------------

export interface TocEntry {
  level: number;
  text: string;
  id: string;
}

export function extractToc(markdown: string): TocEntry[] {
  const headingRegex = /^(#{1,4})\s+(.+)$/gm;
  const entries: TocEntry[] = [];
  const idCounts = new Map<string, number>();
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[`*_~\[\]]/g, "").trim();
    let id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Deduplicate IDs (matches rehype-slug behavior)
    const count = idCounts.get(id) ?? 0;
    idCounts.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;

    entries.push({ level, text, id });
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Utility for components
// ---------------------------------------------------------------------------

export function getAllDocFiles(config: RepoDocsConfig): DocFile[] {
  return config.docs.flatMap((folder) => folder.files);
}

export function getEstimatedReadTime(sizeBytes: number): string {
  const words = sizeBytes / 5;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${units[i]}`;
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

/**
 * Convert language bytes to percentage breakdown.
 */
export function languagePercentages(
  stats: Record<string, number>
): { language: string; percentage: number; bytes: number }[] {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(stats)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: Math.round((bytes / total) * 1000) / 10,
    }))
    .sort((a, b) => b.bytes - a.bytes);
}
