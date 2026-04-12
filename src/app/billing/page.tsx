"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useCart, type CartItem } from "@/components/CartProvider";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/ui/Toast";
import { PAYMENT_CONFIG } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  const code = currency.toUpperCase();
  if (code === "INR") return `\u20B9${amount.toLocaleString("en-IN")}`;
  if (code === "USD") return `$${amount.toLocaleString("en-US")}`;
  return `${amount.toLocaleString()} ${code}`;
}

interface CheckoutSession {
  items: CartItem[];
  subtotalCents: number;
  discountCents: number;
  couponId: string;
  couponCode: string;
  totalCents: number;
  currency: string;
}

type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];

function getStoredCheckoutSession(): CheckoutSession | null {
  try {
    const stored = localStorage.getItem("checkout_session");
    if (!stored) return null;
    const parsed = JSON.parse(stored) as CheckoutSession;
    return parsed.items && parsed.items.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

type Step = "contact" | "address" | "business" | "payment";

const STEPS: { key: Step; label: string; number: number; icon: React.ReactNode }[] = [
  {
    key: "contact",
    label: "Contact Information",
    number: 1,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: "address",
    label: "Billing Address",
    number: 2,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    key: "business",
    label: "Business Details",
    number: 3,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
      </svg>
    ),
  },
  {
    key: "payment",
    label: "Payment",
    number: 4,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
];

const inputClass = "w-full rounded-lg border bg-navy-light px-4 py-3 text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-teal/50 transition-colors";

export default function BillingPage() {
  const router = useRouter();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [activeStep, setActiveStep] = useState<Step>("contact");
  const [paying, setPaying] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    gstin: "",
    businessName: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      const parsed = getStoredCheckoutSession();
      if (!parsed) {
        router.replace(`${basePath}/cart/`);
        return;
      }

      await Promise.resolve();
      if (!cancelled) {
        setSession(parsed);
      }
    }

    void hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [router, basePath]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateContactDetails() {
      if (!user) return;

      const meta = user.user_metadata ?? {};
      await Promise.resolve();

      if (!cancelled) {
        setForm((prev) => ({
          ...prev,
          fullName: meta.full_name || meta.name || prev.fullName,
          email: user.email || prev.email,
        }));
      }
    }

    void hydrateContactDetails();

    return () => {
      cancelled = true;
    };
  }, [user]);

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function nextStep(current: Step) {
    const idx = STEPS.findIndex((s) => s.key === current);
    if (idx < STEPS.length - 1) setActiveStep(STEPS[idx + 1].key);
  }

  function isStepComplete(step: Step): boolean {
    switch (step) {
      case "contact":
        return !!(form.fullName && form.email && form.phone);
      case "address":
        return !!(form.street && form.city && form.state && form.pincode && form.country);
      case "business":
        return true; // optional
      case "payment":
        return false;
    }
  }

  async function handleCompletePurchase() {
    if (!user || !session) return;
    setPaying(true);

    try {
      // Create an order for each item
      for (const item of session.items) {
        const effectiveItemTotal = item.salePriceCents != null && item.saleEndsAt && new Date(item.saleEndsAt) > new Date() ? item.salePriceCents : item.priceCents;

        const orderPayload: OrderInsert = {
          user_id: user.id,
          status: "paid",
          product_id: item.productId,
          coupon_id: session.couponId || null,
          subtotal_cents: effectiveItemTotal,
          discount_cents: session.items.length === 1 ? session.discountCents : 0,
          tax_cents: 0,
          total_cents: session.items.length === 1 ? session.totalCents : effectiveItemTotal,
          currency: item.currency,
          provider: "coupon" as const,
          notes: `Billing: ${form.fullName}, ${form.email}, ${form.phone}. Address: ${form.street}, ${form.city}, ${form.state} ${form.pincode}, ${form.country}.${form.gstin ? ` GSTIN: ${form.gstin}, Business: ${form.businessName}` : ""}`,
          metadata: {
            billing: {
              fullName: form.fullName,
              email: form.email,
              phone: form.phone,
              street: form.street,
              city: form.city,
              state: form.state,
              pincode: form.pincode,
              country: form.country,
              gstin: form.gstin || null,
              businessName: form.businessName || null,
            },
          },
        };

        const { error } = await supabase.from("orders").insert(orderPayload);
        if (error) {
          showToast(`Order failed: ${error.message}`, "error");
          setPaying(false);
          return;
        }
      }

      // Clear cart and checkout session
      clearCart();
      localStorage.removeItem("checkout_session");

      showToast("Purchase complete! Premium content is now unlocked.", "success");
      router.push(`${basePath}/account/`);
    } catch {
      showToast("Something went wrong. Please try again.", "error");
      setPaying(false);
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-navy pt-24 flex items-center justify-center">
        <div className="animate-pulse text-text-dim text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-dim font-mono mb-6">
          <Link href={`${basePath}/cart/`} className="hover:text-teal transition-colors">
            Cart
          </Link>
          <span>/</span>
          <span className="text-teal">Billing</span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-8">Checkout</h1>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Accordion steps */}
          <div className="md:col-span-3 space-y-3">
            {STEPS.map((step) => {
              const isOpen = activeStep === step.key;
              const complete = isStepComplete(step.key);
              const stepIdx = STEPS.findIndex((s) => s.key === step.key);
              const activeIdx = STEPS.findIndex((s) => s.key === activeStep);
              const isPast = stepIdx < activeIdx || complete;

              return (
                <div
                  key={step.key}
                  className="rounded-xl border overflow-hidden transition-colors"
                  style={{
                    borderColor: isOpen ? "var(--color-teal)" : "var(--theme-border)",
                    boxShadow: isOpen ? "var(--theme-card-shadow)" : "none",
                  }}
                >
                  {/* Accordion header */}
                  <button onClick={() => setActiveStep(step.key)} className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer transition-colors hover:bg-[var(--theme-white-alpha-5)]">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors"
                      style={{
                        background: isPast || isOpen ? "var(--color-teal)" : "var(--theme-white-alpha-10)",
                        color: isPast || isOpen ? "var(--color-btn-text)" : "var(--color-text-dim)",
                      }}
                    >
                      {isPast && !isOpen ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </span>
                    <span className={`text-sm font-semibold flex-1 ${isOpen ? "text-text-primary" : "text-text-muted"}`}>{step.label}</span>
                    {step.key === "business" && <span className="text-[10px] text-text-dim">Optional</span>}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`text-text-dim transition-transform ${isOpen ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Accordion body */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1">
                      {step.key === "contact" && (
                        <div className="grid gap-4">
                          <div>
                            <label className="text-[11px] text-text-dim uppercase tracking-wider font-medium mb-1.5 block">Full Name *</label>
                            <input
                              type="text"
                              value={form.fullName}
                              onChange={(e) => updateForm("fullName", e.target.value)}
                              placeholder="Santosh Kumar"
                              className={inputClass}
                              style={{ borderColor: "var(--theme-border)" }}
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[11px] text-text-dim uppercase tracking-wider font-medium mb-1.5 block">Email *</label>
                              <input
                                type="email"
                                value={form.email}
                                onChange={(e) => updateForm("email", e.target.value)}
                                placeholder="you@example.com"
                                className={inputClass}
                                style={{ borderColor: "var(--theme-border)" }}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-text-dim uppercase tracking-wider font-medium mb-1.5 block">Phone *</label>
                              <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => updateForm("phone", e.target.value)}
                                placeholder="+91 9876543210"
                                className={inputClass}
                                style={{ borderColor: "var(--theme-border)" }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => nextStep("contact")}
                              disabled={!isStepComplete("contact")}
                              className="px-5 py-2 text-xs font-semibold rounded-lg bg-teal text-btn-text hover:bg-teal-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Continue
                            </button>
                          </div>
                        </div>
                      )}

                      {step.key === "address" && (
                        <div className="grid gap-4">
                          <div>
                            <label className="text-[11px] text-text-dim uppercase tracking-wider font-medium mb-1.5 block">Street Address *</label>
                            <input
                              type="text"
                              value={form.street}
                              onChange={(e) => updateForm("street", e.target.value)}
                              placeholder="123 Main Street, Apt 4"
                              className={inputClass}
                              style={{ borderColor: "var(--theme-border)" }}
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[11px] text-text-dim uppercase tracking-wider font-medium mb-1.5 block">City *</label>
                              <input
                                type="text"
                                value={form.city}
                                onChange={(e) => updateForm("city", e.target.value)}
                                placeholder="Bengaluru"
                                className={inputClass}
                                style={{ borderColor: "var(--theme-border)" }}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-text-dim uppercase tracking-wider font-medium mb-1.5 block">State *</label>
                              <input
                                type="text"
                                value={form.state}
                                onChange={(e) => updateForm("state", e.target.value)}
                                placeholder="Karnataka"
                                className={inputClass}
                                style={{ borderColor: "var(--theme-border)" }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[11px] text-text-dim uppercase tracking-wider font-medium mb-1.5 block">Pincode *</label>
                              <input
                                type="text"
                                value={form.pincode}
                                onChange={(e) => updateForm("pincode", e.target.value)}
                                placeholder="560001"
                                className={inputClass}
                                style={{ borderColor: "var(--theme-border)" }}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-text-dim uppercase tracking-wider font-medium mb-1.5 block">Country *</label>
                              <input type="text" value={form.country} onChange={(e) => updateForm("country", e.target.value)} className={inputClass} style={{ borderColor: "var(--theme-border)" }} />
                            </div>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => nextStep("address")}
                              disabled={!isStepComplete("address")}
                              className="px-5 py-2 text-xs font-semibold rounded-lg bg-teal text-btn-text hover:bg-teal-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Continue
                            </button>
                          </div>
                        </div>
                      )}

                      {step.key === "business" && (
                        <div className="grid gap-4">
                          <p className="text-[11px] text-text-dim -mt-1">Fill this if purchasing for a business to get a GST invoice.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[11px] text-text-dim uppercase tracking-wider font-medium mb-1.5 block">GSTIN Number</label>
                              <input
                                type="text"
                                value={form.gstin}
                                onChange={(e) => updateForm("gstin", e.target.value.toUpperCase())}
                                placeholder="22AAAAA0000A1Z5"
                                maxLength={15}
                                className={`${inputClass} font-mono tracking-wider`}
                                style={{ borderColor: "var(--theme-border)" }}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-text-dim uppercase tracking-wider font-medium mb-1.5 block">Business Name</label>
                              <input
                                type="text"
                                value={form.businessName}
                                onChange={(e) => updateForm("businessName", e.target.value)}
                                placeholder="Acme Pvt Ltd"
                                className={inputClass}
                                style={{ borderColor: "var(--theme-border)" }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => nextStep("business")}
                              className="px-5 py-2 text-xs font-semibold rounded-lg bg-teal text-btn-text hover:bg-teal-dark transition-colors cursor-pointer"
                            >
                              Continue to Payment
                            </button>
                          </div>
                        </div>
                      )}

                      {step.key === "payment" && (
                        <div className="space-y-4">
                          {/* Payment gateway buttons — controlled by PAYMENT_CONFIG.enabled */}

                          {PAYMENT_CONFIG.enabled === "razorpay" && (
                            <button
                              onClick={() => {
                                /* TODO: Razorpay checkout integration */
                              }}
                              className="w-full px-6 py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ background: "#2B84EA" }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22 9.761c0 .536-.065 1.084-.169 1.627-.789 4.199-4.305 7.385-6.328 8.104a.553.553 0 01-.249.044.558.558 0 01-.544-.44l-.627-2.96a.563.563 0 01.391-.656c1.407-.414 2.868-1.837 3.453-4.099.16-.617.235-1.22.235-1.62 0-1.588-.817-2.403-2.086-2.403-1.57 0-3.035.965-3.907 2.524l-.495.886-.495-.886c-.872-1.559-2.337-2.524-3.907-2.524-1.269 0-2.086.815-2.086 2.403 0 .4.075 1.003.235 1.62.585 2.262 2.046 3.685 3.453 4.099.305.089.46.378.391.656l-.627 2.96a.558.558 0 01-.544.44.553.553 0 01-.249-.044c-2.023-.719-5.539-3.905-6.328-8.104A8.332 8.332 0 012 9.761C2 6.596 4.16 4.23 7.271 4.23c2.303 0 4.058 1.272 4.729 2.208.671-.936 2.426-2.208 4.729-2.208C19.84 4.23 22 6.596 22 9.761z" />
                              </svg>
                              Pay {formatPrice(session.totalCents, session.currency)} with Razorpay
                            </button>
                          )}

                          {PAYMENT_CONFIG.enabled === "stripe" && (
                            <button
                              onClick={() => {
                                /* TODO: Stripe checkout integration */
                              }}
                              className="w-full px-6 py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ background: "#635BFF" }}
                            >
                              Pay {formatPrice(session.totalCents, session.currency)} with Stripe
                            </button>
                          )}

                          {PAYMENT_CONFIG.enabled === "none" && (
                            <button
                              disabled
                              className="w-full px-6 py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-3 opacity-40 cursor-not-allowed"
                              style={{ background: "#2B84EA" }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22 9.761c0 .536-.065 1.084-.169 1.627-.789 4.199-4.305 7.385-6.328 8.104a.553.553 0 01-.249.044.558.558 0 01-.544-.44l-.627-2.96a.563.563 0 01.391-.656c1.407-.414 2.868-1.837 3.453-4.099.16-.617.235-1.22.235-1.62 0-1.588-.817-2.403-2.086-2.403-1.57 0-3.035.965-3.907 2.524l-.495.886-.495-.886c-.872-1.559-2.337-2.524-3.907-2.524-1.269 0-2.086.815-2.086 2.403 0 .4.075 1.003.235 1.62.585 2.262 2.046 3.685 3.453 4.099.305.089.46.378.391.656l-.627 2.96a.558.558 0 01-.544.44.553.553 0 01-.249-.044c-2.023-.719-5.539-3.905-6.328-8.104A8.332 8.332 0 012 9.761C2 6.596 4.16 4.23 7.271 4.23c2.303 0 4.058 1.272 4.729 2.208.671-.936 2.426-2.208 4.729-2.208C19.84 4.23 22 6.596 22 9.761z" />
                              </svg>
                              Razorpay &mdash; Coming Soon
                            </button>
                          )}

                          <div className="flex items-center gap-3 py-1">
                            <div className="flex-1 border-t border-[var(--theme-border)]" />
                            <span className="text-[10px] text-text-dim uppercase tracking-wider">or claim access</span>
                            <div className="flex-1 border-t border-[var(--theme-border)]" />
                          </div>

                          {/* Direct purchase (coupon / free) — always available */}
                          <button
                            onClick={handleCompletePurchase}
                            disabled={paying || !user}
                            className="w-full px-6 py-3.5 rounded-xl bg-teal text-btn-text font-semibold text-sm flex items-center justify-center gap-2 hover:bg-teal-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal/20"
                          >
                            {paying ? (
                              "Processing..."
                            ) : (
                              <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Complete Purchase {session.totalCents > 0 ? `(${formatPrice(session.totalCents, session.currency)})` : "(Free)"}
                              </>
                            )}
                          </button>
                          <p className="text-[11px] text-text-dim text-center">{session.totalCents === 0 ? "This order is free — no payment required." : "Access will be granted instantly."}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Order Summary (sticky sidebar) */}
          <div className="md:col-span-2">
            <div className="rounded-xl border border-[var(--theme-border)] bg-navy-light p-5 sticky top-24" style={{ boxShadow: "var(--theme-card-shadow)" }}>
              <h2 className="text-sm font-bold text-text-primary mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4">
                {session.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-text-primary truncate">{item.title}</p>
                    </div>
                    <span className="text-xs font-semibold text-text-muted whitespace-nowrap">
                      {formatPrice(item.salePriceCents != null && item.saleEndsAt && new Date(item.saleEndsAt) > new Date() ? item.salePriceCents : item.priceCents, item.currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm border-t border-[var(--theme-border)] pt-4">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(session.subtotalCents, session.currency)}</span>
                </div>
                {session.discountCents > 0 && (
                  <div className="flex justify-between" style={{ color: "var(--theme-success-text)" }}>
                    <span>Discount ({session.couponCode})</span>
                    <span>-{formatPrice(session.discountCents, session.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-text-primary font-bold text-lg pt-2 border-t border-[var(--theme-border)]">
                  <span>Total</span>
                  <span>{formatPrice(session.totalCents, session.currency)}</span>
                </div>
              </div>

              {/* Security note */}
              <div className="mt-4 flex items-start gap-2 text-[11px] text-text-dim">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "var(--theme-success-text)" }}
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Your payment is secured with 256-bit SSL encryption. We never store your card details.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
