import { supabaseServer } from "@/lib/supabase-server";
import type { Database } from "@/lib/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export interface CourseProduct {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  category: string | null;
  level: string | null;
  tags: string[];
  bannerPath: string | null;
  thumbnailPath: string | null;
  status: string;
  version: string | null;
  freeContentCount: number;
  premiumContentCount: number;
  storagePrefix: string | null;
  updatedAt: string;
  lastSyncedAt: string | null;
  priceCents: number;
  currency: string;
  comparePriceCents: number | null;
}

function mapProductRow(row: ProductRow): CourseProduct {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    category: row.category,
    level: row.level,
    tags: row.tags ?? [],
    bannerPath: row.banner_path,
    thumbnailPath: row.thumbnail_path,
    status: row.status,
    version: row.version,
    freeContentCount: row.free_content_count,
    premiumContentCount: row.premium_content_count,
    storagePrefix: row.storage_prefix,
    updatedAt: row.updated_at,
    lastSyncedAt: row.last_synced_at,
    priceCents: row.price_cents,
    currency: row.currency,
    comparePriceCents: row.compare_price_cents,
  };
}

/**
 * Fetch all published courses from Supabase.
 * Returns empty array if none exist — no fallback.
 */
export async function discoverCourseRepos(): Promise<CourseProduct[]> {
  const { data, error } = await (supabaseServer.from("products") as any)
    .select("*")
    .eq("product_type", "course")
    .eq("status", "published")
    .order("title") as { data: ProductRow[] | null; error: { message: string } | null };

  if (error) {
    console.error("[Courses] Failed to fetch courses from Supabase:", error.message);
    return [];
  }

  return (data ?? []).map(mapProductRow);
}

/**
 * Fetch a single course by slug.
 * Returns null if not found.
 */
export async function getCourseBySlug(slug: string): Promise<CourseProduct | null> {
  const { data, error } = await (supabaseServer.from("products") as any)
    .select("*")
    .eq("slug", slug)
    .eq("product_type", "course")
    .eq("status", "published")
    .single() as { data: ProductRow | null; error: unknown };

  if (error || !data) return null;

  return mapProductRow(data);
}
