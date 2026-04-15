"use client";

import { Fragment } from "react";
import { INDICATOR_CATEGORIES, INDICATOR_LABELS, formatValue, COUNTRY_FLAGS } from "@/lib/wb/types";

interface IndicatorGridProps {
  countries: string[];
  data: {
    country_code: string;
    indicator_code: string;
    indicator_name: string;
    year: number;
    value: number;
    yoy_pct: number | null;
  }[];
}

/** Convert a 2/3-letter ISO code to a flag emoji. */
function codeToFlag(code: string): string {
  if (COUNTRY_FLAGS[code]) return COUNTRY_FLAGS[code];
  const cc = code.slice(0, 2).toUpperCase();
  try {
    return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
  } catch {
    return code.slice(0, 2);
  }
}

export default function IndicatorGrid({ countries, data }: IndicatorGridProps) {
  // Build a lookup: { `${country_code}:${indicator_code}` => row }
  const lookup = new Map<string, IndicatorGridProps["data"][number]>();
  for (const row of data) {
    lookup.set(`${row.country_code}:${row.indicator_code}`, row);
  }

  const categories = Object.entries(INDICATOR_CATEGORIES);

  return (
    <div className="overflow-x-auto rounded-2xl border border-glass-border bg-glass/50 backdrop-blur-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-glass-border/50">
            <th className="sticky left-0 z-10 bg-glass/90 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted/60 backdrop-blur-sm">Indicator</th>
            {countries.map((code) => (
              <th key={code} className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-text-muted/60">
                <span className="mr-1">{codeToFlag(code)}</span>
                {code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map(([catKey, { label, indicators }]) => {
            // Check if any indicator in this category has data
            const hasData = indicators.some((ind) => countries.some((cc) => lookup.has(`${cc}:${ind}`)));
            if (!hasData) return null;

            return (
              <Fragment key={catKey}>
                {/* Category header */}
                <tr>
                  <td colSpan={countries.length + 1} className="bg-glass/30 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">
                    {label}
                  </td>
                </tr>
                {indicators.map((ind) => {
                  // Only show rows that have at least one value
                  const hasRow = countries.some((cc) => lookup.has(`${cc}:${ind}`));
                  if (!hasRow) return null;

                  return (
                    <tr key={ind} className="border-b border-glass-border/20 transition-colors hover:bg-teal/[0.03]">
                      <td className="sticky left-0 z-10 bg-glass/80 px-5 py-3 text-sm font-medium text-text-primary backdrop-blur-sm">{INDICATOR_LABELS[ind] ?? ind}</td>
                      {countries.map((cc) => {
                        const row = lookup.get(`${cc}:${ind}`);
                        if (!row) {
                          return (
                            <td key={cc} className="px-5 py-3 text-center text-sm text-text-muted/40">
                              --
                            </td>
                          );
                        }
                        return (
                          <td key={cc} className="px-5 py-3 text-center">
                            <div className="text-sm font-medium text-text-primary">{formatValue(row.value, ind)}</div>
                            {row.yoy_pct != null && (
                              <span
                                className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                  row.yoy_pct >= 0 ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                                }`}
                              >
                                {row.yoy_pct >= 0 ? "+" : ""}
                                {row.yoy_pct.toFixed(1)}%
                              </span>
                            )}
                            <div className="text-[10px] text-text-muted/40">{row.year}</div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
