export interface CourseRegistryEntry {
  slug: string;
  owner: string;
  repo: string;
  branch: string;
}

const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER ?? "";
const GITHUB_PAT = process.env.GITHUB_PAT ?? "";

/** Required topics for a repo to be treated as a course */
const REQUIRED_TOPICS = ["learning-course", "premium-content-repo"];

/**
 * Static fallback registry — used when GitHub API is unreachable.
 * Keep this in sync with your actual course repos.
 */
const FALLBACK_REGISTRY: CourseRegistryEntry[] = [
  {
    slug: "k8s-zero-to-mastery",
    owner: "senapatisantosh",
    repo: "k8s-zero-to-mastery",
    branch: "claude/kubernetes-learning-repo-eSbUG",
  },
];

interface GHRepoMinimal {
  name: string;
  full_name: string;
  default_branch: string;
  topics: string[];
  archived: boolean;
  fork: boolean;
  owner: { login: string };
}

let _cachedRegistry: CourseRegistryEntry[] | null = null;

/**
 * Discover all course repos by scanning GitHub for repos
 * tagged with both "learning-course" and "premium-content-repo".
 */
export async function discoverCourseRepos(): Promise<CourseRegistryEntry[]> {
  if (_cachedRegistry) return _cachedRegistry;

  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (GITHUB_PAT) headers.Authorization = `Bearer ${GITHUB_PAT}`;

    // Search for repos with both required topics owned by the configured user
    // GitHub search: topic:learning-course topic:premium-content-repo user:owner
    const query = `${REQUIRED_TOPICS.map((t) => `topic:${t}`).join("+")}+user:${GITHUB_OWNER}`;
    const url = `https://api.github.com/search/repositories?q=${query}&per_page=100`;

    const res = await fetch(url, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(`[Courses] GitHub search API returned ${res.status}, using fallback registry`);
      _cachedRegistry = FALLBACK_REGISTRY;
      return FALLBACK_REGISTRY;
    }

    const data = await res.json();
    const repos: GHRepoMinimal[] = data.items ?? [];

    const entries: CourseRegistryEntry[] = repos
      .filter((r) => !r.archived && !r.fork)
      .filter((r) => REQUIRED_TOPICS.every((t) => r.topics.includes(t)))
      .map((r) => ({
        slug: r.name,
        owner: r.owner.login,
        repo: r.name,
        branch: r.default_branch,
      }));

    _cachedRegistry = entries.length > 0 ? entries : FALLBACK_REGISTRY;
    return _cachedRegistry;
  } catch (err) {
    console.warn(`[Courses] Failed to discover repos, using fallback:`, err);
    _cachedRegistry = FALLBACK_REGISTRY;
    return FALLBACK_REGISTRY;
  }
}

export function getCourseBySlug(slug: string, registry: CourseRegistryEntry[]): CourseRegistryEntry | undefined {
  return registry.find((c) => c.slug === slug);
}
