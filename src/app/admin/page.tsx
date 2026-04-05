"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/ui/Toast";
import type { Json } from "@/lib/database.types";

// ── Types ───────────────────────────────────────────────────

type AdminTab = "stats" | "products" | "flash_sales" | "coupons" | "bundles";

interface ProductRow {
  id: string;
  slug: string;
  title: string;
  price_cents: number;
  currency: string;
  compare_price_cents: number | null;
  status: string;
  metadata: Json;
}

interface CouponRow {
  id: string;
  code: string;
  coupon_type: "percent" | "fixed_amount";
  discount_value: number;
  currency: string;
  max_uses: number | null;
  used_count: number;
  max_uses_per_user: number;
  min_purchase_cents: number;
  applies_to_product_id: string | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

interface BundleRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  compare_price_cents: number | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
}

interface FlashSale {
  sale_price_cents: number;
  starts_at: string;
  ends_at: string;
  label: string;
  is_active: boolean;
}

interface Stats {
  totalProducts: number;
  activeCoupons: number;
  activeSales: number;
  paidOrders: number;
}

// ── Helpers ─────────────────────────────────────────────────

function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  const code = currency.toUpperCase();
  if (code === "INR") return `\u20B9${amount.toLocaleString("en-IN")}`;
  if (code === "USD") return `$${amount.toLocaleString("en-US")}`;
  return `${amount.toLocaleString()} ${code}`;
}

function getFlashSale(metadata: Json): FlashSale | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const fs = (metadata as Record<string, Json>).flash_sale;
  if (!fs || typeof fs !== "object" || Array.isArray(fs)) return null;
  const sale = fs as Record<string, Json>;
  if (!sale.is_active) return null;
  return {
    sale_price_cents: sale.sale_price_cents as number,
    starts_at: sale.starts_at as string,
    ends_at: sale.ends_at as string,
    label: (sale.label as string) ?? "",
    is_active: true,
  };
}

const TABS: { key: AdminTab; label: string }[] = [
  { key: "stats", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "flash_sales", label: "Flash Sales" },
  { key: "coupons", label: "Coupons" },
  { key: "bundles", label: "Bundles" },
];

const inputClass =
  "rounded-lg border bg-navy-light px-3 py-2 text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-teal/50 transition-colors w-full";

// ── Main Component ──────────────────────────────────────────

export default function AdminPage() {
  const { user, loading, role } = useAuth();
  const [tab, setTab] = useState<AdminTab>("stats");

  if (loading) {
    return (
      <div className="min-h-screen bg-navy pt-24 flex items-center justify-center">
        <div className="animate-pulse text-text-dim text-sm">Loading...</div>
      </div>
    );
  }

  if (!user || !role || !["admin", "super_admin"].includes(role)) {
    return (
      <div className="min-h-screen bg-navy pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-sm text-text-muted">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">Manage pricing, sales, and coupons</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto border-b border-[var(--theme-border)]">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px cursor-pointer ${
                tab === t.key ? "text-teal border-teal" : "text-text-muted border-transparent hover:text-text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "stats" && <StatsSection />}
        {tab === "products" && <ProductsSection />}
        {tab === "flash_sales" && <FlashSalesSection />}
        {tab === "coupons" && <CouponsSection />}
        {tab === "bundles" && <BundlesSection />}
      </div>
    </div>
  );
}

// ── Stats ───────────────────────────────────────────────────

function StatsSection() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [products, coupons, orders] = await Promise.all([
        (supabase.from("products") as any).select("id, metadata", { count: "exact" }),
        (supabase.from("coupons") as any).select("id", { count: "exact", head: true }).eq("is_active", true),
        (supabase.from("orders") as any).select("id", { count: "exact", head: true }).eq("status", "paid"),
      ]);

      const productRows = (products.data ?? []) as ProductRow[];
      const activeSales = productRows.filter((p) => {
        const fs = getFlashSale(p.metadata);
        return fs && new Date(fs.ends_at) > new Date();
      }).length;

      setStats({
        totalProducts: products.count ?? 0,
        activeCoupons: coupons.count ?? 0,
        activeSales,
        paidOrders: orders.count ?? 0,
      });
    }
    load();
  }, []);

  if (!stats) return <div className="text-text-dim text-sm">Loading stats...</div>;

  const cards = [
    { label: "Total Products", value: stats.totalProducts, color: "text-teal" },
    { label: "Active Coupons", value: stats.activeCoupons, color: "text-green-400" },
    { label: "Active Flash Sales", value: stats.activeSales, color: "text-amber-400" },
    { label: "Paid Orders", value: stats.paidOrders, color: "text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] p-5 text-center">
          <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          <p className="text-[11px] text-text-dim font-mono uppercase tracking-wider mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Products ────────────────────────────────────────────────

function ProductsSection() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ price_cents: 0, currency: "INR", compare_price_cents: 0 });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = (await (supabase.from("products") as any).select("id, slug, title, price_cents, currency, compare_price_cents, status, metadata").order("title")) as {
      data: ProductRow[] | null;
    };
    setProducts(data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(p: ProductRow) {
    setEditing(p.id);
    setForm({ price_cents: p.price_cents, currency: p.currency, compare_price_cents: p.compare_price_cents ?? 0 });
  }

  async function save(id: string) {
    setSaving(true);
    const { error } = await (supabase.from("products") as any)
      .update({
        price_cents: form.price_cents,
        currency: form.currency,
        compare_price_cents: form.compare_price_cents || null,
      })
      .eq("id", id);
    setSaving(false);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Price updated", "success");
      setEditing(null);
      load();
    }
  }

  return (
    <div className="space-y-3">
      {products.map((p) => (
        <div key={p.id} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{p.title}</h3>
              <p className="text-xs text-text-dim">{p.slug} &middot; {p.status}</p>
            </div>
            {editing !== p.id ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  {p.compare_price_cents != null && p.compare_price_cents > 0 && (
                    <span className="text-xs text-text-dim line-through mr-2">{formatPrice(p.compare_price_cents, p.currency)}</span>
                  )}
                  <span className="text-sm font-bold text-teal">{p.price_cents > 0 ? formatPrice(p.price_cents, p.currency) : "Free"}</span>
                </div>
                <button onClick={() => startEdit(p)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--theme-border)] text-text-muted hover:text-teal hover:border-teal/30 transition-colors cursor-pointer">
                  Edit
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input type="number" value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: +e.target.value })} placeholder="Price (paise)" className={`${inputClass} w-28`} style={{ borderColor: "var(--theme-border)" }} />
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={`${inputClass} w-20`} style={{ borderColor: "var(--theme-border)" }}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
                <input type="number" value={form.compare_price_cents} onChange={(e) => setForm({ ...form, compare_price_cents: +e.target.value })} placeholder="Compare (paise)" className={`${inputClass} w-28`} style={{ borderColor: "var(--theme-border)" }} />
                <button onClick={() => save(p.id)} disabled={saving} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal text-navy hover:bg-teal/90 transition-colors cursor-pointer disabled:opacity-50">
                  {saving ? "..." : "Save"}
                </button>
                <button onClick={() => setEditing(null)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--theme-border)] text-text-muted hover:text-text-primary transition-colors cursor-pointer">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      {products.length === 0 && <p className="text-sm text-text-dim">No products found.</p>}
    </div>
  );
}

// ── Flash Sales ─────────────────────────────────────────────

function FlashSalesSection() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ sale_price_cents: 0, starts_at: "", ends_at: "", label: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = (await (supabase.from("products") as any).select("id, slug, title, price_cents, currency, compare_price_cents, status, metadata").order("title")) as {
      data: ProductRow[] | null;
    };
    setProducts(data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(p: ProductRow) {
    const fs = getFlashSale(p.metadata);
    setEditing(p.id);
    setForm({
      sale_price_cents: fs?.sale_price_cents ?? Math.round(p.price_cents * 0.7),
      starts_at: fs?.starts_at ? fs.starts_at.slice(0, 16) : new Date().toISOString().slice(0, 16),
      ends_at: fs?.ends_at ? fs.ends_at.slice(0, 16) : "",
      label: fs?.label ?? "Flash Sale",
    });
  }

  async function save(p: ProductRow) {
    setSaving(true);
    const existingMeta = (typeof p.metadata === "object" && !Array.isArray(p.metadata) ? p.metadata : {}) as Record<string, Json>;
    const newMeta = {
      ...existingMeta,
      flash_sale: {
        sale_price_cents: form.sale_price_cents,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        label: form.label,
        is_active: true,
      },
    };
    const { error } = await (supabase.from("products") as any).update({ metadata: newMeta }).eq("id", p.id);
    setSaving(false);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Flash sale saved", "success");
      setEditing(null);
      load();
    }
  }

  async function deactivate(p: ProductRow) {
    const existingMeta = (typeof p.metadata === "object" && !Array.isArray(p.metadata) ? p.metadata : {}) as Record<string, Json>;
    const flash = existingMeta.flash_sale as Record<string, Json> | undefined;
    if (!flash) return;
    const newMeta = { ...existingMeta, flash_sale: { ...flash, is_active: false } };
    const { error } = await (supabase.from("products") as any).update({ metadata: newMeta }).eq("id", p.id);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Flash sale deactivated", "success");
      load();
    }
  }

  return (
    <div className="space-y-3">
      {products.map((p) => {
        const fs = getFlashSale(p.metadata);
        const isActive = fs && new Date(fs.ends_at) > new Date();

        return (
          <div key={p.id} className={`rounded-xl border bg-[var(--theme-white-alpha-5)] p-4 ${isActive ? "border-amber-500/30" : "border-[var(--theme-border)]"}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{p.title}</h3>
                <p className="text-xs text-text-dim">
                  Base: {formatPrice(p.price_cents, p.currency)}
                  {isActive && fs && <span className="ml-2 text-amber-400">Sale: {formatPrice(fs.sale_price_cents, p.currency)} — {fs.label}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isActive && (
                  <button onClick={() => deactivate(p)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
                    Deactivate
                  </button>
                )}
                <button onClick={() => startEdit(p)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--theme-border)] text-text-muted hover:text-teal hover:border-teal/30 transition-colors cursor-pointer">
                  {isActive ? "Edit Sale" : "Create Sale"}
                </button>
              </div>
            </div>

            {editing === p.id && (
              <div className="mt-3 pt-3 border-t border-[var(--theme-border)] grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-text-dim uppercase tracking-wider">Sale Price (paise/cents)</label>
                  <input type="number" value={form.sale_price_cents} onChange={(e) => setForm({ ...form, sale_price_cents: +e.target.value })} className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
                </div>
                <div>
                  <label className="text-[10px] text-text-dim uppercase tracking-wider">Label</label>
                  <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Launch Sale" className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
                </div>
                <div>
                  <label className="text-[10px] text-text-dim uppercase tracking-wider">Starts At</label>
                  <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
                </div>
                <div>
                  <label className="text-[10px] text-text-dim uppercase tracking-wider">Ends At</label>
                  <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
                </div>
                <div className="col-span-2 md:col-span-4 flex gap-2 justify-end">
                  <button onClick={() => setEditing(null)} className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--theme-border)] text-text-muted hover:text-text-primary transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={() => save(p)} disabled={saving || !form.ends_at} className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal text-navy hover:bg-teal/90 transition-colors cursor-pointer disabled:opacity-50">
                    {saving ? "Saving..." : "Save Flash Sale"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Coupons ─────────────────────────────────────────────────

function CouponsSection() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    coupon_type: "percent" as "percent" | "fixed_amount",
    discount_value: 0,
    currency: "INR",
    max_uses: "",
    max_uses_per_user: "1",
    min_purchase_cents: "0",
    applies_to_product_id: "",
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: "",
  });

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      (supabase.from("coupons") as any).select("*").order("created_at", { ascending: false }),
      (supabase.from("products") as any).select("id, title").order("title"),
    ]);
    setCoupons((c.data ?? []) as CouponRow[]);
    setProducts((p.data ?? []) as { id: string; title: string }[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setForm({
      code: "",
      coupon_type: "percent",
      discount_value: 0,
      currency: "INR",
      max_uses: "",
      max_uses_per_user: "1",
      min_purchase_cents: "0",
      applies_to_product_id: "",
      valid_from: new Date().toISOString().slice(0, 16),
      valid_until: "",
    });
  }

  async function create() {
    setSaving(true);
    const payload: Record<string, unknown> = {
      code: form.code.toUpperCase().trim(),
      coupon_type: form.coupon_type,
      discount_value: form.discount_value,
      currency: form.currency,
      max_uses_per_user: +form.max_uses_per_user || 1,
      min_purchase_cents: +form.min_purchase_cents || 0,
      valid_from: new Date(form.valid_from).toISOString(),
      is_active: true,
    };
    if (form.max_uses) payload.max_uses = +form.max_uses;
    if (form.valid_until) payload.valid_until = new Date(form.valid_until).toISOString();
    if (form.applies_to_product_id) payload.applies_to_product_id = form.applies_to_product_id;

    const { error } = await (supabase.from("coupons") as any).insert(payload);
    setSaving(false);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Coupon created", "success");
      setShowCreate(false);
      resetForm();
      load();
    }
  }

  async function toggleActive(c: CouponRow) {
    const { error } = await (supabase.from("coupons") as any).update({ is_active: !c.is_active }).eq("id", c.id);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast(c.is_active ? "Coupon deactivated" : "Coupon activated", "success");
      load();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">{coupons.length} coupon{coupons.length !== 1 ? "s" : ""}</h2>
        <button onClick={() => { setShowCreate(!showCreate); resetForm(); }} className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal text-navy hover:bg-teal/90 transition-colors cursor-pointer">
          {showCreate ? "Cancel" : "+ New Coupon"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-teal/30 bg-[var(--theme-white-alpha-5)] p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Code</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. WELCOME50" className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            </div>
            <div>
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Type</label>
              <select value={form.coupon_type} onChange={(e) => setForm({ ...form, coupon_type: e.target.value as "percent" | "fixed_amount" })} className={inputClass} style={{ borderColor: "var(--theme-border)" }}>
                <option value="percent">Percent Off</option>
                <option value="fixed_amount">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Value ({form.coupon_type === "percent" ? "%" : "paise/cents"})</label>
              <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: +e.target.value })} className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            </div>
            <div>
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Max Uses (blank = unlimited)</label>
              <input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="unlimited" className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            </div>
            <div>
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Max Per User</label>
              <input type="number" value={form.max_uses_per_user} onChange={(e) => setForm({ ...form, max_uses_per_user: e.target.value })} className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            </div>
            <div>
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Applies to Product</label>
              <select value={form.applies_to_product_id} onChange={(e) => setForm({ ...form, applies_to_product_id: e.target.value })} className={inputClass} style={{ borderColor: "var(--theme-border)" }}>
                <option value="">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Valid From</label>
              <input type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            </div>
            <div>
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Valid Until (blank = forever)</label>
              <input type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            </div>
            <div className="flex items-end">
              <button onClick={create} disabled={saving || !form.code || !form.discount_value} className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal text-navy hover:bg-teal/90 transition-colors cursor-pointer disabled:opacity-50 w-full">
                {saving ? "Creating..." : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {coupons.map((c) => (
          <div key={c.id} className={`rounded-xl border bg-[var(--theme-white-alpha-5)] p-4 flex items-center justify-between ${c.is_active ? "border-[var(--theme-border)]" : "border-red-500/20 opacity-60"}`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-text-primary">{c.code}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${c.is_active ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                  {c.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-text-dim mt-1">
                {c.coupon_type === "percent" ? `${c.discount_value}% off` : formatPrice(c.discount_value, c.currency)}
                {c.max_uses != null && ` · ${c.used_count}/${c.max_uses} used`}
                {c.valid_until && ` · Until ${new Date(c.valid_until).toLocaleDateString()}`}
              </p>
            </div>
            <button onClick={() => toggleActive(c)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${c.is_active ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-green-500/30 text-green-400 hover:bg-green-500/10"}`}>
              {c.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
        {coupons.length === 0 && <p className="text-sm text-text-dim">No coupons yet.</p>}
      </div>
    </div>
  );
}

// ── Bundles ─────────────────────────────────────────────────

function BundlesSection() {
  const [bundles, setBundles] = useState<BundleRow[]>([]);
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);
  const [bundleProducts, setBundleProducts] = useState<Record<string, string[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    price_cents: 0,
    currency: "INR",
    compare_price_cents: 0,
    valid_from: "",
    valid_until: "",
    selectedProducts: [] as string[],
  });

  const load = useCallback(async () => {
    const [b, p, bp] = await Promise.all([
      (supabase.from("bundles") as any).select("*").order("created_at", { ascending: false }),
      (supabase.from("products") as any).select("id, title").order("title"),
      (supabase.from("bundle_products") as any).select("bundle_id, product_id"),
    ]);
    setBundles((b.data ?? []) as BundleRow[]);
    setProducts((p.data ?? []) as { id: string; title: string }[]);

    const bpMap: Record<string, string[]> = {};
    for (const row of (bp.data ?? []) as { bundle_id: string; product_id: string }[]) {
      if (!bpMap[row.bundle_id]) bpMap[row.bundle_id] = [];
      bpMap[row.bundle_id].push(row.product_id);
    }
    setBundleProducts(bpMap);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    setSaving(true);
    const payload: Record<string, unknown> = {
      slug: form.slug.toLowerCase().trim().replace(/\s+/g, "-"),
      name: form.name,
      description: form.description || null,
      price_cents: form.price_cents,
      currency: form.currency,
      compare_price_cents: form.compare_price_cents || null,
      is_active: true,
    };
    if (form.valid_from) payload.valid_from = new Date(form.valid_from).toISOString();
    if (form.valid_until) payload.valid_until = new Date(form.valid_until).toISOString();

    const { data, error } = await (supabase.from("bundles") as any).insert(payload).select("id").single() as { data: { id: string } | null; error: unknown };
    if (error || !data) {
      setSaving(false);
      showToast((error as { message: string })?.message ?? "Failed to create bundle", "error");
      return;
    }

    if (form.selectedProducts.length > 0) {
      const links = form.selectedProducts.map((pid) => ({ bundle_id: data.id, product_id: pid }));
      await (supabase.from("bundle_products") as any).insert(links);
    }

    setSaving(false);
    showToast("Bundle created", "success");
    setShowCreate(false);
    load();
  }

  async function toggleActive(b: BundleRow) {
    const { error } = await (supabase.from("bundles") as any).update({ is_active: !b.is_active }).eq("id", b.id);
    if (error) {
      showToast((error as { message: string }).message, "error");
    } else {
      showToast(b.is_active ? "Bundle deactivated" : "Bundle activated", "success");
      load();
    }
  }

  function toggleProduct(pid: string) {
    setForm((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(pid) ? prev.selectedProducts.filter((id) => id !== pid) : [...prev.selectedProducts, pid],
    }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">{bundles.length} bundle{bundles.length !== 1 ? "s" : ""}</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal text-navy hover:bg-teal/90 transition-colors cursor-pointer">
          {showCreate ? "Cancel" : "+ New Bundle"}
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-teal/30 bg-[var(--theme-white-alpha-5)] p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            </div>
            <div>
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            </div>
            <div>
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Price (paise/cents)</label>
              <input type="number" value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: +e.target.value })} className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            </div>
            <div>
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Compare Price</label>
              <input type="number" value={form.compare_price_cents} onChange={(e) => setForm({ ...form, compare_price_cents: +e.target.value })} className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            </div>
            <div>
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Valid From</label>
              <input type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            </div>
            <div>
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Valid Until</label>
              <input type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="text-[10px] text-text-dim uppercase tracking-wider">Products in Bundle</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {products.map((p) => (
                  <button key={p.id} type="button" onClick={() => toggleProduct(p.id)} className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${form.selectedProducts.includes(p.id) ? "border-teal/50 bg-teal/10 text-teal" : "border-[var(--theme-border)] text-text-muted hover:border-teal/30"}`}>
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2 md:col-span-3 flex justify-end">
              <button onClick={create} disabled={saving || !form.name || !form.price_cents} className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal text-navy hover:bg-teal/90 transition-colors cursor-pointer disabled:opacity-50">
                {saving ? "Creating..." : "Create Bundle"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {bundles.map((b) => (
          <div key={b.id} className={`rounded-xl border bg-[var(--theme-white-alpha-5)] p-4 ${b.is_active ? "border-[var(--theme-border)]" : "border-red-500/20 opacity-60"}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary">{b.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${b.is_active ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                    {b.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-text-dim mt-1">
                  {formatPrice(b.price_cents, b.currency)}
                  {b.compare_price_cents != null && <span className="ml-1 line-through">{formatPrice(b.compare_price_cents, b.currency)}</span>}
                  {" · "}{(bundleProducts[b.id] ?? []).length} product{(bundleProducts[b.id] ?? []).length !== 1 ? "s" : ""}
                  {b.valid_until && ` · Until ${new Date(b.valid_until).toLocaleDateString()}`}
                </p>
              </div>
              <button onClick={() => toggleActive(b)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${b.is_active ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-green-500/30 text-green-400 hover:bg-green-500/10"}`}>
                {b.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
        {bundles.length === 0 && <p className="text-sm text-text-dim">No bundles yet.</p>}
      </div>
    </div>
  );
}
