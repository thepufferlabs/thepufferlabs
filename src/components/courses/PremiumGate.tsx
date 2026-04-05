"use client";

import { useAuth } from "@/components/AuthProvider";

interface PremiumGateProps {
  title: string;
  tags?: string[];
}

export default function PremiumGate({ title, tags }: PremiumGateProps) {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto py-20 px-6 text-center">
      {/* Lock icon */}
      <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-8">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-text-primary mb-3">{title}</h2>

      <p className="text-text-muted mb-6 leading-relaxed max-w-md mx-auto">
        {user ? "This is premium content. Unlock full access to continue your learning journey." : "Sign in and unlock premium access to continue your learning journey."}
      </p>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-mono bg-[var(--theme-white-alpha-5)] text-text-dim border border-[var(--theme-border)]">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <button
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-navy font-semibold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
        onClick={() => {
          // Future: open payment/auth flow
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        Get Premium Access
      </button>

      <p className="text-xs text-text-dim mt-6">Premium includes deep dives, cheatsheets, interview prep, and production architecture guides.</p>
    </div>
  );
}
