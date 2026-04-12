"use client";

import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/cn";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-1.5 py-1.5 text-sm transition-all duration-200 outline-none",
        "bg-[var(--theme-card)] shadow-[var(--theme-soft-shadow)] backdrop-blur-xl hover:border-[var(--theme-ring)] hover:bg-[var(--theme-card-elevated)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--theme-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-navy)]",
        showLabel ? "pr-3" : "justify-center",
        className
      )}
      style={{ borderColor: "var(--theme-border-strong)" }}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      role="switch"
      aria-checked={isLight}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200",
          isLight ? "bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)]" : "bg-[var(--theme-secondary)] text-text-primary"
        )}
        style={{ borderColor: isLight ? "transparent" : "var(--theme-border-strong)" }}
      >
        {isLight ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4.5" />
            <line x1="12" y1="2" x2="12" y2="4.5" />
            <line x1="12" y1="19.5" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="6.7" y2="6.7" />
            <line x1="17.3" y1="17.3" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="4.5" y2="12" />
            <line x1="19.5" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="6.7" y2="17.3" />
            <line x1="17.3" y1="6.7" x2="19.07" y2="4.93" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 15.5A7.5 7.5 0 118.5 4 6 6 0 0020 15.5z" />
          </svg>
        )}
      </span>

      {showLabel && <span className="pr-1 text-xs font-medium tracking-[-0.02em] text-text-muted">{isLight ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
