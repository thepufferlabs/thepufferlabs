interface PremiumContentBadgeProps {
  compact?: boolean;
}

export default function PremiumContentBadge({ compact = false }: PremiumContentBadgeProps) {
  const iconSize = compact ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}`}
      style={{ background: "var(--theme-success-bg)", color: "var(--theme-success-text)", border: "1px solid var(--theme-success-border)" }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 8 7.5 12 12 5l4.5 7L21 8l-2 10H5L3 8Z" />
        <path d="M5 18h14" />
      </svg>
      Premium
    </span>
  );
}
