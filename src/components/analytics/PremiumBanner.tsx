"use client";

import { motion } from "framer-motion";

interface PremiumBannerProps {
  isAuthenticated: boolean;
  hasAccess: boolean;
  onAuthRequired: () => void;
  onPurchase: (productSlug: string) => void;
}

const PRODUCTS = [
  {
    slug: "data-analytics-platform",
    title: "Data Analytics Platform",
    description: "200+ countries, 20+ economic indicators, real-time dashboards",
    priceCents: 4900,
    comparePriceCents: 9900,
  },
  {
    slug: "software-engineering-course",
    title: "Software Engineering Course",
    description: "Full-stack engineering with production-grade patterns",
    priceCents: 7900,
    comparePriceCents: 14900,
  },
];

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export default function PremiumBanner({ isAuthenticated, hasAccess, onAuthRequired, onPurchase }: PremiumBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-glass-border bg-glass/60 backdrop-blur-sm p-6 md:p-8"
    >
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal/[0.06] via-transparent to-teal/[0.03] pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] bg-teal/10 text-teal border border-teal/20">
            Paid Analytics Platform
          </span>
          <h2 className="text-xl md:text-2xl font-display font-semibold text-text-primary">Global Economic Intelligence Report</h2>
          <p className="text-sm text-text-muted max-w-lg">200+ Countries, 20+ Indicators — GDP, population, per-capita analysis, growth trends, and more.</p>
        </div>

        {/* Access granted state */}
        {hasAccess && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              You have full access
            </span>
          </motion.div>
        )}

        {/* Not authenticated — prompt to sign in */}
        {!isAuthenticated && !hasAccess && (
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onAuthRequired}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal to-teal-dark text-btn-text font-semibold text-sm transition-all shadow-lg shadow-teal/20 hover:shadow-teal/30 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Unlock Premium Analytics
            </motion.button>
          </div>
        )}

        {/* Authenticated but no access — show product cards */}
        {isAuthenticated && !hasAccess && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRODUCTS.map((product) => (
                <motion.div
                  key={product.slug}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-xl border border-glass-border bg-glass/40 backdrop-blur-sm p-5 flex flex-col gap-3 transition-all hover:border-teal/25 hover:shadow-[0_8px_30px_rgba(34,197,94,0.05)]"
                >
                  <h3 className="text-sm font-semibold text-text-primary">{product.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed flex-1">{product.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-text-primary">{formatPrice(product.priceCents)}</span>
                    <span className="text-xs text-text-muted line-through">{formatPrice(product.comparePriceCents)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onPurchase(product.slug)}
                      className="flex-1 rounded-lg bg-teal/10 border border-teal/20 px-3 py-2 text-xs font-medium text-teal hover:bg-teal/20 transition-colors cursor-pointer"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => onPurchase(product.slug)}
                      className="flex-1 rounded-lg bg-gradient-to-r from-teal to-teal-dark px-3 py-2 text-xs font-semibold text-btn-text transition-all hover:shadow-lg hover:shadow-teal/20 cursor-pointer"
                    >
                      Buy Now
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
