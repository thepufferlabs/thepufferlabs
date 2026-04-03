"use client";

import { useTheme } from "@/components/ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button onClick={toggleTheme} className={`flex items-center gap-2 ${className}`} aria-label={`Switch to ${isLight ? "dark" : "light"} mode`} role="switch" aria-checked={isLight}>
      {/* Toggle track */}
      <div className={`relative w-12 h-[26px] rounded-full transition-colors duration-300 ${isLight ? "bg-teal/20" : "bg-teal/15"}`}>
        {/* Thumb with icon inside */}
        <div
          className={`absolute top-[3px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${
            isLight ? "translate-x-[27px] bg-teal" : "translate-x-[3px] bg-teal"
          }`}
        >
          {isLight ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </div>
      </div>

      {showLabel && <span className="text-sm text-text-muted">{isLight ? "Light" : "Dark"}</span>}
    </button>
  );
}
