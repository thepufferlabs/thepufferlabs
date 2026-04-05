"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import MarkdownRenderer from "@/components/docs/MarkdownRenderer";
import Link from "next/link";

interface PremiumGateProps {
  title: string;
  tags?: string[];
  slug?: string;
  storagePath?: string;
  contentKey?: string;
  linkMap?: Record<string, string>;
}

async function fetchMarkdownFromStorage(path: string): Promise<string | null> {
  const firstSlash = path.indexOf("/");
  if (firstSlash === -1) return null;
  const bucket = path.slice(0, firstSlash);
  const objectPath = path.slice(firstSlash + 1);

  const { data: blob, error } = await supabase.storage.from(bucket).download(objectPath);
  if (error || !blob) return null;

  let text = await blob.text();
  // Strip frontmatter
  if (text.startsWith("---")) {
    const end = text.indexOf("---", 3);
    if (end !== -1) text = text.slice(end + 3).trim();
  }
  return text;
}

export default function PremiumGate({ title, tags, slug, storagePath, contentKey, linkMap }: PremiumGateProps) {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  useEffect(() => {
    if (!user) {
      setChecking(false);
      setHasAccess(false);
      return;
    }

    async function checkAndLoad() {
      setChecking(true);

      // 1. Get product_id from slug
      let productId: string | null = null;
      if (slug) {
        const { data } = await (supabase.from("products") as any)
          .select("id")
          .eq("slug", slug)
          .single() as { data: { id: string } | null };
        productId = data?.id ?? null;
      }

      if (!productId) {
        setChecking(false);
        setHasAccess(false);
        return;
      }

      // 2. Check entitlement
      const { data: entitlement } = await (supabase.from("user_entitlements") as any)
        .select("id")
        .eq("user_id", user!.id)
        .eq("product_id", productId)
        .eq("is_active", true)
        .limit(1) as { data: { id: string }[] | null };

      const entitled = !!(entitlement && entitlement.length > 0);
      setHasAccess(entitled);
      setChecking(false);

      if (!entitled) return;

      // 3. Resolve storage path — use prop if available, else query product_content
      //    The browser client (with user JWT) can see premium product_content rows
      //    because the RLS policy grants access when the user has an entitlement.
      let resolvedPath = storagePath;

      if (!resolvedPath && contentKey) {
        const { data: contentRow } = await (supabase.from("product_content") as any)
          .select("storage_path")
          .eq("product_id", productId)
          .eq("content_key", contentKey)
          .single() as { data: { storage_path: string } | null };
        resolvedPath = contentRow?.storage_path ?? undefined;
      }

      if (!resolvedPath) return;

      // 4. Fetch the markdown from storage
      setLoadingContent(true);
      const text = await fetchMarkdownFromStorage(resolvedPath);
      if (text) setMarkdown(text);
      setLoadingContent(false);
    }

    checkAndLoad();
  }, [user, slug, storagePath, contentKey]);

  // Loading
  if (checking) {
    return (
      <div className="py-20 text-center">
        <div className="animate-pulse text-text-dim text-sm">Checking access...</div>
      </div>
    );
  }

  // Entitled + content loaded → render it
  if (hasAccess && markdown) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: "var(--theme-success-bg)", color: "var(--theme-success-text)", border: "1px solid var(--theme-success-border)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Premium
          </span>
        </div>
        <MarkdownRenderer content={markdown} linkMap={linkMap} />
      </div>
    );
  }

  // Entitled + still loading content
  if (hasAccess && loadingContent) {
    return (
      <div className="py-20 text-center">
        <div className="animate-pulse text-text-dim text-sm">Loading premium content...</div>
      </div>
    );
  }

  // Entitled but no content found (not synced to storage yet)
  if (hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: "var(--theme-success-bg)", border: "1px solid var(--theme-success-border)" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--theme-success-text)" }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-3">{title}</h2>
        <p className="text-text-muted mb-6">You have access. This content is being prepared and will be available soon.</p>
      </div>
    );
  }

  // No access — show purchase gate
  return (
    <div className="max-w-2xl mx-auto py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: "var(--theme-sale-bg)", border: "1px solid var(--theme-sale-border)" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--theme-sale-text)" }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-text-primary mb-3">{title}</h2>

      <p className="text-text-muted mb-6 leading-relaxed max-w-md mx-auto">
        {user ? "This is premium content. Purchase the course to unlock full access." : "Sign in and purchase the course to unlock this content."}
      </p>

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-mono bg-[var(--theme-white-alpha-5)] text-text-dim border border-[var(--theme-border)]">
              {tag}
            </span>
          ))}
        </div>
      )}

      {slug && (
        <Link
          href={`${basePath}/courses/${slug}/`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-navy font-semibold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          View Course &amp; Purchase
        </Link>
      )}

      <p className="text-xs text-text-dim mt-6">Premium includes deep dives, cheatsheets, interview prep, and production architecture guides.</p>
    </div>
  );
}
