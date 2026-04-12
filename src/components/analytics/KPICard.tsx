"use client";

import { formatValue } from "@/lib/wb/types";

interface Props {
  label: string;
  value: number;
  indicator?: string;
  year?: number;
  change?: number | null;
  icon?: string;
}

export default function KPICard({ label, value, indicator, year, change, icon }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-glass/60 backdrop-blur-sm p-6 transition-all duration-300 hover:border-teal/25 hover:shadow-[0_12px_40px_rgba(34,197,94,0.06)]">
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal/[0.03] to-transparent pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted/70">{label}</span>
          {icon && <span className="text-lg">{icon}</span>}
        </div>

        <div className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">{formatValue(value, indicator)}</div>

        <div className="mt-2 flex items-center gap-3">
          {year && <span className="text-xs text-text-muted/50">as of {year}</span>}
          {change != null && (
            <span className={`text-xs font-medium ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)}% YoY
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
