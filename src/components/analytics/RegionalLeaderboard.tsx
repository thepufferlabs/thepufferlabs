"use client";

import { useState, useMemo } from "react";
import { formatValue, INDICATOR_LABELS } from "@/lib/wb/types";

type SortKey = "rank" | "country" | "value";

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: "asc" | "desc" }) {
  if (sortKey !== column) return <span className="text-text-muted/30 ml-1">&#8597;</span>;
  return <span className="text-teal ml-1">{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>;
}

interface Props {
  data: { country_code: string; country_name: string; region: string; value: number }[];
  indicator: string;
  title: string;
}

type SortDir = "asc" | "desc";

const MEDAL_COLORS = [
  "text-amber-400", // Gold
  "text-slate-300", // Silver
  "text-orange-400", // Bronze
];

export default function RegionalLeaderboard({ data, indicator, title }: Props) {
  const regions = useMemo(() => {
    const set = new Set(data.map((d) => d.region).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [data]);

  const [activeRegion, setActiveRegion] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    const subset = activeRegion === "All" ? data : data.filter((d) => d.region === activeRegion);
    return [...subset].sort((a, b) => b.value - a.value);
  }, [data, activeRegion]);

  const sorted = useMemo(() => {
    const ranked = filtered.map((d, i) => ({ ...d, rank: i + 1 }));

    const compare = (a: (typeof ranked)[0], b: (typeof ranked)[0]) => {
      let cmp = 0;
      if (sortKey === "rank") cmp = a.rank - b.rank;
      else if (sortKey === "country") cmp = a.country_name.localeCompare(b.country_name);
      else cmp = a.value - b.value;
      return sortDir === "desc" ? -cmp : cmp;
    };

    return [...ranked].sort(compare);
  }, [filtered, sortKey, sortDir]);

  const maxValue = filtered.length > 0 ? filtered[0].value : 1;

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "value" ? "desc" : "asc");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-glass/50 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-teal/[0.03] to-transparent pointer-events-none" />

      <div className="relative p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
        <p className="text-xs text-text-muted/60 mb-5">
          {INDICATOR_LABELS[indicator] ?? indicator} &middot; {filtered.length} countries
        </p>

        {/* Region tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeRegion === region ? "bg-teal/15 text-teal border border-teal/25" : "bg-glass/40 text-text-muted/70 border border-glass-border hover:border-teal/15 hover:text-text-muted"
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-glass-border">
                <th
                  className="text-left py-3 px-2 text-[11px] font-medium uppercase tracking-[0.15em] text-text-muted/60 cursor-pointer select-none hover:text-text-muted w-16"
                  onClick={() => handleSort("rank")}
                >
                  Rank <SortIcon column="rank" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th
                  className="text-left py-3 px-2 text-[11px] font-medium uppercase tracking-[0.15em] text-text-muted/60 cursor-pointer select-none hover:text-text-muted"
                  onClick={() => handleSort("country")}
                >
                  Country <SortIcon column="country" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th
                  className="text-right py-3 px-2 text-[11px] font-medium uppercase tracking-[0.15em] text-text-muted/60 cursor-pointer select-none hover:text-text-muted w-32"
                  onClick={() => handleSort("value")}
                >
                  Value <SortIcon column="value" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="py-3 px-2 w-40 hidden sm:table-cell" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const isTop3 = row.rank <= 3;
                const isBottom3 = row.rank > filtered.length - 3;
                const barWidth = maxValue > 0 ? (row.value / maxValue) * 100 : 0;

                return (
                  <tr key={row.country_code} className={`border-b border-glass-border/50 transition-colors hover:bg-glass/30 ${isBottom3 && filtered.length > 6 ? "bg-red-500/[0.04]" : ""}`}>
                    <td className="py-2.5 px-2">
                      {isTop3 ? (
                        <span className={`font-bold ${MEDAL_COLORS[row.rank - 1]}`}>{row.rank === 1 ? "\uD83E\uDD47" : row.rank === 2 ? "\uD83E\uDD48" : "\uD83E\uDD49"}</span>
                      ) : (
                        <span className="text-text-muted/50 font-mono text-xs">{row.rank}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`font-medium ${isTop3 ? "text-text-primary" : "text-text-muted"}`}>{row.country_name}</span>
                      <span className="text-text-muted/40 text-xs ml-2">{row.country_code}</span>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="font-semibold text-text-primary tabular-nums">{formatValue(row.value, indicator)}</span>
                    </td>
                    <td className="py-2.5 px-2 hidden sm:table-cell">
                      <div className="h-2 w-full rounded-full bg-glass/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isTop3 ? "bg-gradient-to-r from-teal to-lime" : isBottom3 && filtered.length > 6 ? "bg-red-400/40" : "bg-teal/30"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sorted.length === 0 && <div className="py-8 text-center text-text-muted/50 text-sm">No data available for this region.</div>}
      </div>
    </div>
  );
}
