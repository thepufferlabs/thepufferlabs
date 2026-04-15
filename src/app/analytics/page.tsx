"use client";

import { useState, useEffect, useMemo } from "react";
import SectionWrapper from "@/components/ui/SectionWrapper";
import SectionHeading from "@/components/ui/SectionHeading";
import BarRaceChart from "@/components/analytics/BarRaceChart";
import { supabase } from "@/lib/supabase";
import { INDICATOR_LABELS } from "@/lib/wb/types";

const RACE_INDICATORS = [
  { code: "NY.GDP.MKTP.CD", label: "GDP" },
  { code: "NY.GDP.PCAP.CD", label: "GDP Per Capita" },
  { code: "SP.POP.TOTL", label: "Population" },
];

interface BarRaceRow {
  indicator_code: string;
  year: number;
  rank: number;
  country_code: string;
  country_name: string;
  value: number;
}

export default function AnalyticsPage() {
  const [raceData, setRaceData] = useState<BarRaceRow[]>([]);
  const [raceIndicator, setRaceIndicator] = useState("NY.GDP.MKTP.CD");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Single query to pre-computed bar race table
      const { data, error } = await supabase
        .from("wb_bar_race" as never)
        .select("indicator_code, year, rank, country_code, country_name, value")
        .in(
          "indicator_code",
          RACE_INDICATORS.map((i) => i.code)
        )
        .order("year", { ascending: true })
        .order("rank", { ascending: true })
        .limit(5000);

      if (error) {
        console.warn("wb_bar_race not available, falling back to raw query");
        await loadFallback();
        return;
      }

      setRaceData((data ?? []) as unknown as BarRaceRow[]);
      setLoading(false);
    }

    async function loadFallback() {
      // Fallback: query raw table per indicator
      const allRows: BarRaceRow[] = [];
      for (const ind of RACE_INDICATORS) {
        const { data } = await supabase
          .from("wb_indicator_values" as never)
          .select("country_code, indicator_code, year, value")
          .eq("indicator_code", ind.code)
          .not("value", "is", null)
          .order("year", { ascending: true })
          .limit(5000);

        if (data) {
          const rows = data as unknown as { country_code: string; indicator_code: string; year: number; value: number }[];
          allRows.push(
            ...rows.map((r) => ({
              ...r,
              country_name: r.country_code,
              rank: 0,
            }))
          );
        }
      }
      setRaceData(allRows);
      setLoading(false);
    }

    load();
  }, []);

  const raceFiltered = useMemo(() => raceData.filter((r) => r.indicator_code === raceIndicator), [raceData, raceIndicator]);

  if (loading) {
    return (
      <SectionWrapper className="min-h-screen">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal/30 border-t-teal" />
          <p className="mt-4 text-text-muted">Loading...</p>
        </div>
      </SectionWrapper>
    );
  }

  return (
    <main className="min-h-screen pb-12">
      <SectionWrapper className="pt-8 pb-2 md:pt-10">
        <SectionHeading label="World Bank Analytics" title="Global Economic Intelligence" description="Top 20 countries racing across GDP, GDP Per Capita, and Population — 2015 to 2025" />
      </SectionWrapper>

      <SectionWrapper className="pt-2 pb-4">
        <div className="mb-4 flex justify-center gap-2">
          {RACE_INDICATORS.map((ind) => (
            <button
              key={ind.code}
              onClick={() => setRaceIndicator(ind.code)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                raceIndicator === ind.code ? "bg-teal/15 text-teal border border-teal/30" : "border border-glass-border bg-glass/30 text-text-muted hover:border-teal/20 hover:text-text-primary"
              }`}
            >
              {ind.label}
            </button>
          ))}
        </div>

        <BarRaceChart data={raceFiltered} title={`Top 20 Countries — ${INDICATOR_LABELS[raceIndicator] ?? raceIndicator}`} indicator={raceIndicator} />
      </SectionWrapper>

      <SectionWrapper className="py-6">
        <p className="text-center text-xs text-text-muted/40">Data sourced from World Bank Open Data API. Refreshed weekly.</p>
        <p className="mt-1 text-center text-xs text-text-muted/30">&copy; {new Date().getFullYear()} The Puffer Labs</p>
      </SectionWrapper>
    </main>
  );
}
