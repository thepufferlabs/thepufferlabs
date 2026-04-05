"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CourseInfo, FlashSale } from "@/lib/courses/types";
import type { Json } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { useCart, type CartItem } from "@/components/CartProvider";
import { useAuth } from "@/components/AuthProvider";
import { showToast } from "@/components/ui/Toast";
import CountdownTimer from "@/components/ui/CountdownTimer";

interface CourseCatalogProps {
  courses: CourseInfo[];
  basePath: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  devops: "DevOps & Infrastructure",
  architecture: "Architecture & Patterns",
  backend: "Backend Engineering",
  frontend: "Frontend & APIs",
  security: "Security & Auth",
  data: "Data & ML",
  distributed: "Distributed Systems",
  testing: "Testing & QA",
};

const CATEGORY_COLORS: Record<string, string> = {
  devops: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  architecture: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  backend: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  frontend: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  security: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  data: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  distributed: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  testing: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-400 border-green-500/20",
  intermediate: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  advanced: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "beginner-to-advanced": "bg-teal/10 text-teal border-teal/20",
};

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  published: { label: "Live", class: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/25" },
  draft: { label: "Coming Soon", class: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/25" },
  beta: { label: "Beta", class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25" },
};

function formatLevel(level: string): string {
  return level
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" \u2192 ");
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function estimateDuration(docCount: number): string {
  const mins = docCount * 12; // ~12 min per lesson avg
  if (mins < 60) return `${mins} min`;
  const hrs = Math.round(mins / 60);
  return `~${hrs} hr${hrs > 1 ? "s" : ""}`;
}

function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  const code = currency.toUpperCase();
  if (code === "INR") return `\u20B9${amount.toLocaleString("en-IN")}`;
  if (code === "USD") return `$${amount.toLocaleString("en-US")}`;
  return `${amount.toLocaleString()} ${code}`;
}

const QUALIFIER_KEYS = ["category", "topic", "level", "status"] as const;

function parseFlashSaleFromMeta(metadata: Json): FlashSale | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const fs = (metadata as Record<string, Json>).flash_sale;
  if (!fs || typeof fs !== "object" || Array.isArray(fs)) return null;
  const sale = fs as Record<string, Json>;
  if (!sale.is_active) return null;
  if (new Date(sale.ends_at as string) <= new Date()) return null;
  return {
    salePriceCents: sale.sale_price_cents as number,
    startsAt: sale.starts_at as string,
    endsAt: sale.ends_at as string,
    label: (sale.label as string) ?? "",
    isActive: true,
  };
}

export default function CourseCatalog({ courses, basePath }: CourseCatalogProps) {
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  // Fetch live pricing from Supabase (prices/flash sales are sensitive — never serve stale)
  const [livePricing, setLivePricing] = useState<Record<string, { productId: string; priceCents: number; currency: string; comparePriceCents: number | null; flashSale: FlashSale | null; thumbnailPath: string | null }>>({});

  // Track which products the user has purchased (entitlements)
  const [ownedProducts, setOwnedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchPricing() {
      const { data } = await (supabase.from("products") as any)
        .select("id, slug, price_cents, currency, compare_price_cents, metadata, thumbnail_path")
        .eq("product_type", "course")
        .eq("status", "published") as { data: { id: string; slug: string; price_cents: number; currency: string; compare_price_cents: number | null; metadata: Json; thumbnail_path: string | null }[] | null };
      if (!data) return;
      const map: typeof livePricing = {};
      for (const row of data) {
        map[row.slug] = {
          productId: row.id,
          priceCents: row.price_cents,
          currency: row.currency,
          comparePriceCents: row.compare_price_cents,
          flashSale: parseFlashSaleFromMeta(row.metadata),
          thumbnailPath: row.thumbnail_path,
        };
      }
      setLivePricing(map);
    }
    fetchPricing();
  }, []);

  // Fetch user entitlements
  useEffect(() => {
    if (!user) { setOwnedProducts(new Set()); return; }
    async function fetchEntitlements() {
      const { data } = await (supabase.from("user_entitlements") as any)
        .select("product_id")
        .eq("user_id", user!.id)
        .eq("is_active", true) as { data: { product_id: string }[] | null };
      if (data) setOwnedProducts(new Set(data.map((e) => e.product_id)));
    }
    fetchEntitlements();
  }, [user]);

  // Merge live pricing into static course data
  const liveCourses = useMemo(() => {
    if (Object.keys(livePricing).length === 0) return courses;
    return courses.map((c) => {
      const live = livePricing[c.slug];
      if (!live) return c;
      return { ...c, priceCents: live.priceCents, currency: live.currency, comparePriceCents: live.comparePriceCents, flashSale: live.flashSale };
    });
  }, [courses, livePricing]);

  // Build value pools for autocomplete
  const valuePools = useMemo(() => {
    const categories = new Set<string>();
    const topics = new Set<string>();
    const levels = new Set<string>();
    const statuses = new Set<string>();
    liveCourses.forEach((c) => {
      categories.add(c.category);
      c.tags.forEach((t) => topics.add(t));
      levels.add(c.level);
      statuses.add(c.status);
    });
    return {
      category: Array.from(categories).sort(),
      topic: Array.from(topics).sort(),
      level: Array.from(levels).sort(),
      status: Array.from(statuses).sort(),
    };
  }, [liveCourses]);

  // Parse GitHub-style qualifiers: "category:devops topic:k8s some text"
  const { qualifiers, freeText } = useMemo(() => {
    const parts = search.split(/\s+/).filter(Boolean);
    const quals: { type: string; value: string }[] = [];
    const text: string[] = [];
    for (const part of parts) {
      const m = part.match(/^(category|topic|level|status):(.+)$/i);
      if (m) quals.push({ type: m[1].toLowerCase(), value: m[2].toLowerCase() });
      else text.push(part);
    }
    return { qualifiers: quals, freeText: text.join(" ").toLowerCase() };
  }, [search]);

  const filtered = useMemo(() => {
    return liveCourses.filter((c) => {
      if (
        freeText &&
        !(
          c.title.toLowerCase().includes(freeText) ||
          c.shortDescription.toLowerCase().includes(freeText) ||
          c.tags.some((t) => t.toLowerCase().includes(freeText)) ||
          c.category.toLowerCase().includes(freeText)
        )
      )
        return false;
      for (const q of qualifiers) {
        if (q.type === "category" && !c.category.toLowerCase().includes(q.value)) return false;
        if (q.type === "topic" && !c.tags.some((t) => t.toLowerCase().includes(q.value))) return false;
        if (q.type === "level" && !c.level.toLowerCase().includes(q.value)) return false;
        if (q.type === "status" && !c.status.toLowerCase().includes(q.value)) return false;
      }
      return true;
    });
  }, [liveCourses, freeText, qualifiers]);

  // Build highlighted tokens from the search string
  const tokens = useMemo(() => {
    if (!search) return [];
    return search.split(/(\s+)/).map((token, i) => {
      const isQualifier = /^(category|topic|level|status):(.+)$/i.test(token);
      const isSpace = /^\s+$/.test(token);
      return { text: token, isQualifier, isSpace, key: i };
    });
  }, [search]);

  // Compute autocomplete suggestions based on current typing
  const suggestions = useMemo(() => {
    if (!focused) return [];
    const parts = search.split(/\s+/);
    const current = parts[parts.length - 1] ?? "";
    if (!current) {
      // Empty or just pressed space — show qualifier keys
      return QUALIFIER_KEYS.map((k) => ({
        display: `${k}:`,
        completion: `${k}:`,
        hint: `Filter by ${k}`,
      }));
    }

    // Typing a qualifier value: "category:dev" → suggest matching values
    const colonIdx = current.indexOf(":");
    if (colonIdx > 0) {
      const key = current.slice(0, colonIdx).toLowerCase();
      const partial = current.slice(colonIdx + 1).toLowerCase();
      const pool = valuePools[key as keyof typeof valuePools];
      if (pool) {
        return pool
          .filter((v) => v.toLowerCase().includes(partial) && v.toLowerCase() !== partial)
          .slice(0, 6)
          .map((v) => ({
            display: `${key}:${v}`,
            completion: `${key}:${v}`,
            hint: CATEGORY_LABELS[v] ?? v,
          }));
      }
      return [];
    }

    // Typing a partial qualifier key: "cate" → suggest "category:"
    const matchingKeys = QUALIFIER_KEYS.filter((k) => k.startsWith(current.toLowerCase()));
    if (matchingKeys.length > 0 && current.length > 0) {
      return matchingKeys.map((k) => ({
        display: `${k}:`,
        completion: `${k}:`,
        hint: `Filter by ${k}`,
      }));
    }

    return [];
  }, [search, focused, valuePools]);

  const applySuggestion = useCallback(
    (completion: string) => {
      const parts = search.split(/\s+/);
      parts[parts.length - 1] = completion;
      // If it ends with ":" keep cursor ready for value, otherwise add space
      const next = parts.join(" ") + (completion.endsWith(":") ? "" : " ");
      setSearch(next);
      setSelectedIdx(0);
      inputRef.current?.focus();
    },
    [search]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Tab" || e.key === "Enter") {
      if (suggestions.length > 0) {
        e.preventDefault();
        applySuggestion(suggestions[selectedIdx].completion);
      }
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  }

  return (
    <>
      {/* GitHub-style search with inline highlighting + autocomplete */}
      <div className="relative mb-6">
        {/* Highlight overlay */}
        <div className="absolute inset-0 flex items-center pl-10 pr-10 py-2.5 text-sm font-mono pointer-events-none overflow-hidden whitespace-pre" aria-hidden>
          {tokens.map((t) =>
            t.isSpace ? (
              <span key={t.key}>{t.text}</span>
            ) : t.isQualifier ? (
              <span key={t.key}>
                <span className="text-blue-400">{t.text.split(":")[0]}:</span>
                <span className="text-teal">{t.text.split(":").slice(1).join(":")}</span>
              </span>
            ) : (
              <span key={t.key} className="text-transparent">
                {t.text}
              </span>
            )
          )}
        </div>

        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim z-10"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="category:devops topic:kubernetes"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedIdx(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          className="relative w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] pl-10 pr-10 py-2.5 text-sm font-mono text-text-primary caret-teal placeholder:text-text-dim/40 focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/20 transition-colors"
          style={search ? { color: "transparent", caretColor: "var(--color-teal)" } : {}}
        />
        {/* Plain text overlay for non-qualifier parts */}
        {search && (
          <div className="absolute inset-0 flex items-center pl-10 pr-10 py-2.5 text-sm font-mono pointer-events-none overflow-hidden whitespace-pre" aria-hidden>
            {tokens.map((t) =>
              t.isSpace ? (
                <span key={t.key}>{t.text}</span>
              ) : t.isQualifier ? (
                <span key={t.key} className="text-transparent">
                  {t.text}
                </span>
              ) : (
                <span key={t.key} className="text-text-primary">
                  {t.text}
                </span>
              )
            )}
          </div>
        )}
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted cursor-pointer z-10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Autocomplete dropdown */}
        {focused && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-[var(--theme-border)] bg-navy shadow-xl z-20 py-1 max-h-52 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={s.completion}
                onMouseDown={() => applySuggestion(s.completion)}
                className={`flex items-center justify-between w-full px-3 py-1.5 text-sm font-mono transition-colors cursor-pointer ${
                  i === selectedIdx ? "bg-[var(--theme-white-alpha-5)] text-text-primary" : "text-text-muted hover:bg-[var(--theme-white-alpha-5)]"
                }`}
              >
                <span>
                  <span className="text-blue-400">{s.display.split(":")[0]}</span>
                  <span className="text-text-dim">:</span>
                  <span className="text-teal">{s.display.split(":").slice(1).join(":")}</span>
                </span>
                <span className="text-[10px] text-text-dim ml-4 truncate">{s.hint}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <p className="text-xs text-text-dim mb-4">
        {filtered.length} {filtered.length === 1 ? "course" : "courses"}
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {filtered.map((course) => (
            <EnhancedCourseCard key={course.slug} course={course} basePath={basePath} productId={livePricing[course.slug]?.productId ?? ""} isOwned={ownedProducts.has(livePricing[course.slug]?.productId ?? "")} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-muted text-sm mb-2">No courses match your filters.</p>
          <button onClick={() => setSearch("")} className="text-teal text-sm hover:underline cursor-pointer">
            Clear
          </button>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Minimal Course Card                                                */
/* ------------------------------------------------------------------ */

function EnhancedCourseCard({ course, basePath, productId, isOwned }: { course: CourseInfo; basePath: string; productId: string; isOwned: boolean }) {
  const router = useRouter();
  const { addItem, isInCart } = useCart();

  const freeDoc = course.freeContentCount ?? course.previewDocPaths.length;
  const premiumDoc = course.premiumContentCount ?? course.premiumDocPaths.length;
  const totalDoc = freeDoc + premiumDoc;
  const freePercent = totalDoc > 0 ? (freeDoc / totalDoc) * 100 : 0;

  const codeCount = course.sampleCodePaths.length + course.premiumCodePaths.length;
  const cheatsheetCount = course.premiumDocPaths.filter((p) => p.includes("cheatsheet")).length;
  const hasInterviewPrep = course.premiumDocPaths.some((p) => p.includes("interview"));

  const categoryClass = CATEGORY_COLORS[course.category] ?? "bg-[var(--theme-white-alpha-5)] text-text-muted border-[var(--theme-border)]";
  const statusCfg = STATUS_CONFIG[course.status] ?? STATUS_CONFIG["published"];

  const features: string[] = [];
  if (cheatsheetCount > 0) features.push(`${cheatsheetCount} cheatsheets`);
  if (hasInterviewPrep) features.push("Interview prep");
  if (codeCount > 0) features.push(`${codeCount} hands-on labs`);

  const activeSale = course.flashSale && new Date(course.flashSale.startsAt) <= new Date() && new Date(course.flashSale.endsAt) > new Date() ? course.flashSale : null;
  const inCart = productId ? isInCart(productId) : false;

  function buildCartItem(): CartItem {
    return {
      productId,
      slug: course.slug,
      title: course.title,
      priceCents: course.priceCents,
      salePriceCents: activeSale?.salePriceCents ?? null,
      saleEndsAt: activeSale?.endsAt ?? null,
      currency: course.currency,
      thumbnailUrl: course.thumbnailUrl,
    };
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!productId) return;
    addItem(buildCartItem());
    showToast("Added to cart", "success");
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!productId) return;
    addItem(buildCartItem());
    router.push(`${basePath}/cart/`);
  }

  return (
    <div
      className={`group relative rounded-xl border bg-navy-light transition-all duration-300 p-5 flex flex-col ${
        activeSale ? "border-amber-500/25 hover:border-amber-400/40" : "border-[var(--theme-border)] hover:border-teal/30"
      }`}
      style={{ boxShadow: "var(--theme-card-shadow)" }}
    >
      {/* Overlay link for card navigation */}
      <Link href={`${basePath}/courses/${course.slug}/`} className="absolute inset-0 z-0 rounded-xl" aria-label={course.title} />

      {/* Header: category + status */}
      <div className="flex items-center justify-between mb-3 relative z-[1]">
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${categoryClass}`}>{CATEGORY_LABELS[course.category] ?? course.category}</span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${statusCfg.class}`}>{statusCfg.label}</span>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-text-primary group-hover:text-teal transition-colors mb-1.5 leading-snug relative z-[1]">{course.title}</h3>

      {/* Description */}
      <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-3 relative z-[1]">{course.shortDescription}</p>

      {/* Free / Premium bar */}
      <div className="mb-3 relative z-[1]">
        <div className="flex h-1 rounded-full overflow-hidden bg-[var(--theme-white-alpha-5)]">
          <div className="bg-green-400/70 rounded-l-full" style={{ width: `${freePercent}%` }} />
          <div className="bg-amber-400/50 rounded-r-full" style={{ width: `${100 - freePercent}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-text-dim">
          <span>{freeDoc} free &middot; {premiumDoc} premium</span>
          <span>{estimateDuration(totalDoc)}</span>
        </div>
      </div>

      {/* Feature tags */}
      {features.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 relative z-[1]">
          {features.map((f) => (
            <span key={f} className="px-2 py-0.5 rounded text-[9px] font-medium bg-[var(--theme-white-alpha-5)] text-text-dim border border-[var(--theme-border)]">
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Footer: price + actions */}
      <div className="mt-auto pt-3 border-t border-[var(--theme-border)] relative z-10">
        {isOwned ? (
          /* Enrolled state — no price, no cart buttons */
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "var(--theme-success-bg)", color: "var(--theme-success-text)", border: "1px solid var(--theme-success-border)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Enrolled
            </span>
            <span className="text-xs text-text-muted">All content unlocked</span>
          </div>
        ) : activeSale ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-bold" style={{ color: "var(--theme-sale-text)" }}>{formatPrice(activeSale.salePriceCents, course.currency)}</span>
              <span className="text-xs text-text-dim line-through">{formatPrice(course.priceCents, course.currency)}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "var(--theme-sale-bg)", color: "var(--theme-sale-text)", border: "1px solid var(--theme-sale-border)" }}>
                {Math.round((1 - activeSale.salePriceCents / course.priceCents) * 100)}% OFF
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end gap-0.5 mr-1">
                <span className="text-[9px] text-text-dim uppercase tracking-wider">{activeSale.label}</span>
                <CountdownTimer endsAt={activeSale.endsAt} className="text-text-muted" />
              </div>
              {productId && course.priceCents > 0 && (
                <div className="flex gap-1.5">
                  <button
                    onClick={handleAddToCart}
                    disabled={inCart}
                    title={inCart ? "In Cart" : "Add to Cart"}
                    className="p-2 rounded-lg border transition-colors cursor-pointer disabled:cursor-default"
                    style={inCart ? { borderColor: "var(--theme-success-border)", color: "var(--theme-success-text)", background: "var(--theme-success-bg)" } : { borderColor: "var(--theme-border)", color: "var(--color-text-muted)" }}
                  >
                    {inCart ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
                    )}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    title="Buy Now"
                    className="p-2 rounded-lg bg-teal text-btn-text hover:bg-teal-dark transition-colors cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {course.comparePriceCents != null && course.comparePriceCents > 0 && (
                <span className="text-xs text-text-dim line-through">{formatPrice(course.comparePriceCents, course.currency)}</span>
              )}
              <span className="text-lg font-bold text-teal">{course.priceCents > 0 ? formatPrice(course.priceCents, course.currency) : "Free"}</span>
            </div>
            {productId && course.priceCents > 0 && (
              <div className="flex gap-1.5">
                <button
                  onClick={handleAddToCart}
                  disabled={inCart}
                  title={inCart ? "In Cart" : "Add to Cart"}
                  className="p-2 rounded-lg border transition-colors cursor-pointer disabled:cursor-default"
                  style={inCart ? { borderColor: "var(--theme-success-border)", color: "var(--theme-success-text)", background: "var(--theme-success-bg)" } : { borderColor: "var(--theme-border)", color: "var(--color-text-muted)" }}
                >
                  {inCart ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
                  )}
                </button>
                <button
                  onClick={handleBuyNow}
                  title="Buy Now"
                  className="p-2 rounded-lg bg-teal text-btn-text hover:bg-teal-dark transition-colors cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
