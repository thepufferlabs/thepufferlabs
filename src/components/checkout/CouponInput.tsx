"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { showToast } from "@/components/ui/Toast";

interface CouponInputProps {
  productId: string;
  priceCents: number;
  currency: string;
  onApply: (discountCents: number, couponId: string, code: string) => void;
}

export default function CouponInput({ productId, priceCents, currency, onApply }: CouponInputProps) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<{ code: string; discountCents: number } | null>(null);

  async function apply() {
    if (!code.trim() || !user) return;
    setLoading(true);

    // Fetch the coupon
    const { data, error } = await supabase.from("coupons").select("*").eq("code", code.toUpperCase().trim()).single();

    if (error || !data) {
      setLoading(false);
      showToast("Invalid coupon code", "error");
      return;
    }

    // Validate active
    if (!data.is_active) {
      setLoading(false);
      showToast("This coupon is no longer active", "error");
      return;
    }

    // Validate date range
    if (data.valid_until && new Date(data.valid_until) < new Date()) {
      setLoading(false);
      showToast("This coupon has expired", "error");
      return;
    }

    // Validate usage limits
    if (data.max_uses != null && data.used_count >= data.max_uses) {
      setLoading(false);
      showToast("This coupon has reached its usage limit", "error");
      return;
    }

    // Validate product applicability
    if (data.applies_to_product_id && data.applies_to_product_id !== productId) {
      setLoading(false);
      showToast("This coupon doesn't apply to this product", "error");
      return;
    }

    // Validate minimum purchase
    if (priceCents < data.min_purchase_cents) {
      setLoading(false);
      showToast(`Minimum purchase of ${formatAmount(data.min_purchase_cents, currency)} required`, "error");
      return;
    }

    // Calculate discount
    let discountCents: number;
    if (data.coupon_type === "percent") {
      discountCents = Math.round((priceCents * data.discount_value) / 100);
    } else {
      discountCents = data.discount_value;
    }
    discountCents = Math.min(discountCents, priceCents);

    setLoading(false);
    setApplied({ code: data.code, discountCents });
    onApply(discountCents, data.id, data.code);
    showToast(`Coupon applied! You save ${formatAmount(discountCents, currency)}`, "success");
  }

  function remove() {
    setApplied(null);
    setCode("");
    onApply(0, "", "");
  }

  if (!user) return null;

  if (applied) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="text-xs text-green-400 font-medium flex-1">
          {applied.code} &mdash; {formatAmount(applied.discountCents, currency)} off
        </span>
        <button onClick={remove} className="text-xs text-text-dim hover:text-red-400 transition-colors cursor-pointer">
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Coupon code"
        className="flex-1 rounded-lg border bg-navy-light px-3 py-2 text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-teal/50 transition-colors font-mono uppercase tracking-wider"
        style={{ borderColor: "var(--theme-border)" }}
        onKeyDown={(e) => e.key === "Enter" && apply()}
      />
      <button
        onClick={apply}
        disabled={loading || !code.trim()}
        className="px-4 py-2 text-xs font-semibold rounded-lg border border-teal/30 text-teal hover:bg-teal/10 transition-colors cursor-pointer disabled:opacity-50"
      >
        {loading ? "..." : "Apply"}
      </button>
    </div>
  );
}

function formatAmount(cents: number, currency: string): string {
  const amount = cents / 100;
  const code = currency.toUpperCase();
  if (code === "INR") return `\u20B9${amount.toLocaleString("en-IN")}`;
  if (code === "USD") return `$${amount.toLocaleString("en-US")}`;
  return `${amount.toLocaleString()} ${code}`;
}
