import type { CourseRegistryEntry } from "./registry";
import type { CourseMeta, CourseInfo, Sidebar, Toc, TocPhase, TocItem, ContentEntry } from "./types";

const GITHUB_PAT = process.env.GITHUB_PAT ?? "";

function headers(): HeadersInit {
  const h: HeadersInit = {
    Accept: "application/vnd.github.raw+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (GITHUB_PAT) {
    h.Authorization = `Bearer ${GITHUB_PAT}`;
  }
  return h;
}

async function fetchRepoFile(entry: CourseRegistryEntry, path: string, revalidate = 3600): Promise<string> {
  const url = `https://api.github.com/repos/${entry.owner}/${entry.repo}/contents/${path}?ref=${entry.branch}`;
  const res = await fetch(url, {
    headers: headers(),
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${path} from ${entry.repo}: ${res.status}`);
  }

  return res.text();
}

async function fetchRepoJson<T>(entry: CourseRegistryEntry, path: string, revalidate = 3600): Promise<T> {
  const text = await fetchRepoFile(entry, path, revalidate);
  return JSON.parse(text) as T;
}

export async function fetchCourseMeta(entry: CourseRegistryEntry): Promise<CourseMeta> {
  return fetchRepoJson<CourseMeta>(entry, "meta.json");
}

/** Fetch repo metadata from GitHub API (stars, updated_at) */
async function fetchRepoInfo(entry: CourseRegistryEntry): Promise<{ stars: number; updatedAt: string }> {
  try {
    const url = `https://api.github.com/repos/${entry.owner}/${entry.repo}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(GITHUB_PAT ? { Authorization: `Bearer ${GITHUB_PAT}` } : {}),
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { stars: 0, updatedAt: "" };
    const data = await res.json();
    return { stars: data.stargazers_count ?? 0, updatedAt: data.updated_at ?? "" };
  } catch {
    return { stars: 0, updatedAt: "" };
  }
}

/** Build the raw thumbnail URL for a course asset */
function buildThumbnailUrl(entry: CourseRegistryEntry, assetPath: string): string {
  return `https://raw.githubusercontent.com/${entry.owner}/${entry.repo}/${entry.branch}/${assetPath}`;
}

/** Fetch enriched course info: meta.json + GitHub repo data + thumbnail URL */
export async function fetchCourseInfo(entry: CourseRegistryEntry): Promise<CourseInfo> {
  const [meta, repoInfo] = await Promise.all([fetchCourseMeta(entry), fetchRepoInfo(entry)]);

  return {
    ...meta,
    stars: repoInfo.stars,
    updatedAt: repoInfo.updatedAt,
    thumbnailUrl: meta.thumbnail ? buildThumbnailUrl(entry, meta.thumbnail) : "",
  };
}

export async function fetchSidebar(entry: CourseRegistryEntry): Promise<Sidebar> {
  const raw = await fetchRepoJson<Record<string, unknown>>(entry, "docs/shared/sidebar.json");

  // Normalize sections: some repos use "sectionKey" instead of "id", and may lack "icon"
  const sections = ((raw.sections ?? []) as Record<string, unknown>[]).map((s) => {
    const id = (s.id ?? s.sectionKey ?? "") as string;
    const items = ((s.items ?? []) as Record<string, unknown>[]).map((item) => ({
      contentKey: (item.contentKey ?? "") as string,
      title: (item.title ?? "") as string,
      routePath: (item.routePath ?? "") as string,
      accessLevel: (item.accessLevel ?? "free") as "free" | "premium",
      order: (item.order ?? 0) as number,
    }));

    // Auto-detect premium: section is premium if ALL items are premium
    const premium = (s.premium as boolean | undefined) ?? (items.length > 0 && items.every((i) => i.accessLevel === "premium"));

    return {
      id,
      title: (s.title ?? "") as string,
      icon: (s.icon ?? "") as string,
      premium,
      items,
    };
  });

  return {
    projectSlug: (raw.projectSlug ?? entry.slug) as string,
    sections,
  };
}

export async function fetchToc(entry: CourseRegistryEntry): Promise<Toc> {
  const raw = await fetchRepoJson<Record<string, unknown>>(entry, "docs/shared/toc.json");

  // Normalize: some repos use phased "toc" array, others use flat "entries" array
  let phases: TocPhase[];

  if (Array.isArray(raw.toc)) {
    // Phased format: { toc: [{ phase, description, items }] }
    phases = (raw.toc as Record<string, unknown>[]).map((p) => ({
      phase: (p.phase ?? "") as string,
      description: (p.description ?? "") as string,
      items: (p.items ?? []) as TocItem[],
    }));
  } else if (Array.isArray(raw.entries)) {
    // Flat format: { entries: [{ order, contentKey, title, accessLevel }] }
    // Group into a single phase
    const entries = raw.entries as TocItem[];
    phases = [
      {
        phase: (raw.title as string) ?? "Learning Path",
        description: "",
        items: entries.sort((a, b) => a.order - b.order),
      },
    ];
  } else {
    phases = [];
  }

  return {
    projectSlug: (raw.projectSlug ?? entry.slug) as string,
    title: (raw.title ?? "") as string,
    toc: phases,
  };
}

export async function fetchContentIndex(entry: CourseRegistryEntry): Promise<ContentEntry[]> {
  const data = await fetchRepoJson<ContentEntry[] | { items: ContentEntry[] }>(entry, "docs/shared/content-index.json");
  return Array.isArray(data) ? data : data.items;
}

export async function fetchMarkdownContent(entry: CourseRegistryEntry, sourcePath: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${entry.owner}/${entry.repo}/${entry.branch}/${sourcePath}`;
  const res = await fetch(url, {
    headers: GITHUB_PAT ? { Authorization: `Bearer ${GITHUB_PAT}` } : {},
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${sourcePath}: ${res.status}`);
  }

  return res.text();
}

export function getContentEntry(entries: ContentEntry[], contentKey: string): ContentEntry | undefined {
  return entries.find((e) => e.contentKey === contentKey);
}

export function stripFrontmatter(markdown: string): string {
  if (!markdown.startsWith("---")) return markdown;
  const end = markdown.indexOf("---", 3);
  if (end === -1) return markdown;
  return markdown.slice(end + 3).trim();
}
