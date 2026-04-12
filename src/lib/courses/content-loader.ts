import { supabaseServer } from "@/lib/supabase-server";
import type { CourseProduct } from "./registry";
import type { CourseInfo, Sidebar, SidebarSection, Toc, TocPhase, TocItem, ContentEntry } from "./types";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ── Course Info ─────────────────────────────────────────────

/** Build a public storage URL for course assets */
function buildAssetUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/course-assets/${path}`;
}

/** Map a CourseProduct to the CourseInfo shape consumed by components */
export function buildCourseInfo(product: CourseProduct): CourseInfo {
  return {
    title: product.title,
    slug: product.slug,
    shortDescription: product.shortDescription ?? "",
    category: product.category ?? "",
    level: product.level ?? "",
    tags: product.tags,
    banner: product.bannerPath ?? "",
    thumbnail: product.thumbnailPath ?? "",
    repoType: "course",
    status: product.status,
    version: product.version ?? "1.0.0",
    previewDocPaths: [],
    premiumDocPaths: [],
    publicBlogPaths: [],
    premiumBlogPaths: [],
    sampleCodePaths: [],
    premiumCodePaths: [],
    updatedAt: product.updatedAt,
    stars: 0,
    thumbnailUrl: product.thumbnailPath ? buildAssetUrl(product.thumbnailPath) : "",
    freeContentCount: product.freeContentCount,
    premiumContentCount: product.premiumContentCount,
    priceCents: product.priceCents,
    currency: product.currency,
    comparePriceCents: product.comparePriceCents,
    flashSale: product.flashSale,
  };
}

// ── Sidebar ─────────────────────────────────────────────────

export async function fetchSidebar(slug: string): Promise<Sidebar> {
  const productId = await getProductId(slug);
  if (!productId) return { projectSlug: slug, sections: [] };

  const { data, error } = await supabaseServer.from("course_details").select("sidebar_data, product_id").eq("product_id", productId).single();

  if (error || !data) {
    return { projectSlug: slug, sections: [] };
  }

  const raw = data.sidebar_data as Record<string, unknown> | null;
  if (!raw) return { projectSlug: slug, sections: [] };

  const sections = ((raw.sections ?? []) as Record<string, unknown>[]).map((s): SidebarSection => {
    const id = (s.id ?? s.sectionKey ?? "") as string;
    const items = ((s.items ?? []) as Record<string, unknown>[]).map((item) => ({
      contentKey: (item.contentKey ?? "") as string,
      title: (item.title ?? "") as string,
      routePath: (item.routePath ?? "") as string,
      accessLevel: (item.accessLevel ?? "free") as "free" | "premium",
      order: (item.order ?? 0) as number,
    }));

    const premium = (s.premium as boolean | undefined) ?? (items.length > 0 && items.every((i) => i.accessLevel === "premium"));

    return { id, title: (s.title ?? "") as string, icon: (s.icon ?? "") as string, premium, items };
  });

  return { projectSlug: slug, sections };
}

// ── Table of Contents ───────────────────────────────────────

export async function fetchToc(slug: string): Promise<Toc> {
  const productId = await getProductId(slug);
  if (!productId) return { projectSlug: slug, title: "", toc: [] };

  const { data, error } = await supabaseServer.from("course_details").select("toc_data").eq("product_id", productId).single();

  if (error || !data) {
    return { projectSlug: slug, title: "", toc: [] };
  }

  const raw = data.toc_data as Record<string, unknown> | null;
  if (!raw) return { projectSlug: slug, title: "", toc: [] };

  let phases: TocPhase[];

  if (Array.isArray(raw.toc)) {
    phases = (raw.toc as Record<string, unknown>[]).map((p) => ({
      phase: (p.phase ?? "") as string,
      description: (p.description ?? "") as string,
      items: (p.items ?? []) as TocItem[],
    }));
  } else if (Array.isArray(raw.entries)) {
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
    projectSlug: slug,
    title: (raw.title ?? "") as string,
    toc: phases,
  };
}

// ── Content Index ───────────────────────────────────────────

export async function fetchContentIndex(slug: string): Promise<ContentEntry[]> {
  const productId = await getProductId(slug);
  if (!productId) return [];

  const { data, error } = await supabaseServer.from("product_content").select("*").eq("product_id", productId).eq("is_published", true).order("sort_order");

  if (error || !data) return [];

  return data.map(
    (row): ContentEntry => ({
      contentKey: row.content_key,
      title: row.title,
      section: row.section ?? "",
      accessLevel: row.access_level as "free" | "premium",
      contentType: (row.content_type ?? "doc") as "doc" | "blog" | "code",
      sourceType: "supabase-storage",
      sourcePath: row.storage_path,
      routePath: `/courses/${slug}/${row.content_key}`,
      tags: row.tags ?? [],
      order: row.sort_order,
      isPublished: row.is_published,
      migrationTargetPath: null,
    })
  );
}

// ── Markdown Content ────────────────────────────────────────

/**
 * Fetch markdown content from Supabase Storage.
 * storage_path in product_content is formatted as:
 *   "free-content/{slug}/docs/free/01-intro.md" or
 *   "premium-content/{slug}/docs/premium/..."
 *
 * Free content bucket is public — fetched via public URL.
 * Premium content bucket is private — fetched via authenticated download.
 */
export async function fetchMarkdownContent(storagePath: string): Promise<string> {
  // storage_path format: "{bucket}/{slug}/{rest-of-path}"
  // e.g. "free-content/k8s-zero-to-mastery/docs/free/01-intro.md"
  const firstSlash = storagePath.indexOf("/");
  const bucket = storagePath.slice(0, firstSlash);
  const objectPath = storagePath.slice(firstSlash + 1);

  if (bucket === "free-content" || bucket === "course-assets") {
    // Public bucket — use public URL
    const url = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Failed to fetch ${storagePath}: ${res.status}`);
    return res.text();
  }

  // Private bucket — use Supabase client download
  const { data, error } = await supabaseServer.storage.from(bucket).download(objectPath);
  if (error || !data) throw new Error(`Failed to download ${storagePath}: ${error?.message}`);
  return data.text();
}

// ── Helpers ─────────────────────────────────────────────────

export function getContentEntry(entries: ContentEntry[], contentKey: string): ContentEntry | undefined {
  return entries.find((e) => e.contentKey === contentKey);
}

export function stripFrontmatter(markdown: string): string {
  if (!markdown.startsWith("---")) return markdown;
  const end = markdown.indexOf("---", 3);
  if (end === -1) return markdown;
  return markdown.slice(end + 3).trim();
}

/** Resolve a product slug to its UUID */
async function getProductId(slug: string): Promise<string | null> {
  const { data, error } = await supabaseServer.from("products").select("id").eq("slug", slug).eq("product_type", "course").eq("status", "published").single();

  if (error || !data) return null;
  return data.id;
}
