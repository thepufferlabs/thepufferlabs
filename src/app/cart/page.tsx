"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart, getEffectivePrice } from "@/components/CartProvider";
import CouponInput from "@/components/checkout/CouponInput";

function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  const code = currency.toUpperCase();
  if (code === "INR") return `\u20B9${amount.toLocaleString("en-IN")}`;
  if (code === "USD") return `$${amount.toLocaleString("en-US")}`;
  return `${amount.toLocaleString()} ${code}`;
}

export default function CartPage() {
  const router = useRouter();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const { items, removeItem, subtotalCents, clearCart } = useCart();
  const [coupon, setCoupon] = useState<{ discountCents: number; couponId: string; code: string }>({ discountCents: 0, couponId: "", code: "" });

  const currency = items[0]?.currency ?? "INR";
  const totalCents = Math.max(0, subtotalCents - coupon.discountCents);

  function handleCouponApply(discountCents: number, couponId: string, code: string) {
    setCoupon({ discountCents, couponId, code });
  }

  function proceedToBilling() {
    localStorage.setItem(
      "checkout_session",
      JSON.stringify({
        items,
        subtotalCents,
        discountCents: coupon.discountCents,
        couponId: coupon.couponId,
        couponCode: coupon.code,
        totalCents,
        currency,
      })
    );
    router.push(`${basePath}/billing/`);
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-navy pt-24 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--theme-white-alpha-5)] flex items-center justify-center mx-auto mb-5">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-dim">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Your cart is empty</h1>
          <p className="text-sm text-text-muted mb-6">Browse our courses and add something you love.</p>
          <Link href={`${basePath}/courses/`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal text-btn-text text-sm font-semibold hover:bg-teal-dark transition-colors">
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-2xl font-bold text-text-primary mb-8">Your Cart</h1>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Items list */}
          <div className="md:col-span-3 space-y-3">
            {items.map((item) => {
              const effectivePrice = getEffectivePrice(item);
              const hasSale = effectivePrice < item.priceCents;

              return (
                <div key={item.productId} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] p-4 flex items-center gap-4">
                  {/* Thumbnail */}
                  {item.thumbnailUrl && (
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-navy-light flex-shrink-0">
                      <Image src={item.thumbnailUrl} alt={item.title} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`${basePath}/courses/${item.slug}/`} className="text-sm font-semibold text-text-primary hover:text-teal transition-colors">
                      {item.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-teal">{formatPrice(effectivePrice, item.currency)}</span>
                      {hasSale && <span className="text-xs text-text-dim line-through">{formatPrice(item.priceCents, item.currency)}</span>}
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-2 text-text-dim hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-red-500/10"
                    aria-label="Remove"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {/* Clear cart */}
            <button onClick={clearCart} className="text-xs text-text-dim hover:text-red-400 transition-colors cursor-pointer">
              Clear cart
            </button>
          </div>

          {/* Order summary */}
          <div className="md:col-span-2">
            <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)] p-5 sticky top-24">
              <h2 className="text-sm font-bold text-text-primary mb-4">Order Summary</h2>

              {/* Coupon */}
              <div className="mb-4">
                <CouponInput productId={items.length === 1 ? items[0].productId : ""} priceCents={subtotalCents} currency={currency} onApply={handleCouponApply} />
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm border-t border-[var(--theme-border)] pt-4">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotalCents, currency)}</span>
                </div>
                {coupon.discountCents > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount ({coupon.code})</span>
                    <span>-{formatPrice(coupon.discountCents, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-text-primary font-bold text-base pt-2 border-t border-[var(--theme-border)]">
                  <span>Total</span>
                  <span>{formatPrice(totalCents, currency)}</span>
                </div>
              </div>

              {/* Proceed */}
              <button
                onClick={proceedToBilling}
                className="w-full mt-5 px-4 py-3 rounded-xl bg-teal text-btn-text font-semibold text-sm hover:bg-teal-dark transition-colors cursor-pointer shadow-lg shadow-teal/20"
              >
                Proceed to Billing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
