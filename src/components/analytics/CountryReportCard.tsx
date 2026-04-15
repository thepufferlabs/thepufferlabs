"use client";

import { COUNTRY_FLAGS, formatValue } from "@/lib/wb/types";
import Link from "next/link";

interface CountryReportCardProps {
  countryCode: string;
  countryName: string;
  region: string;
  incomeLevel: string;
  gdp: number | null;
  gdpPerCapita: number | null;
  population: number | null;
  gdpYoY: number | null;
  populationYoY: number | null;
  gdpPerCapitaYoY: number | null;
  year: number;
}

function ChangeIndicator({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-text-muted/50">--</span>;
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className={positive ? "" : "rotate-180"}>
        <path d="M5 2L8.5 7H1.5L5 2Z" />
      </svg>
      {positive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export default function CountryReportCard({ countryCode, countryName, region, incomeLevel, gdp, gdpPerCapita, population, gdpYoY, populationYoY, gdpPerCapitaYoY, year }: CountryReportCardProps) {
  const flag = COUNTRY_FLAGS[countryCode] ?? "";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-glass/60 backdrop-blur-sm p-5 transition-all duration-300 hover:border-teal/25 hover:shadow-[0_12px_40px_rgba(34,197,94,0.06)]">
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal/[0.03] to-transparent pointer-events-none" />

      <div className="relative">
        {/* Header: flag + name */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{flag}</span>
            <div>
              <h3 className="text-sm font-semibold text-text-primary leading-tight">{countryName}</h3>
              <p className="text-xs text-text-muted/60 mt-0.5">{region}</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-teal/10 text-teal border border-teal/20">{incomeLevel}</span>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <span className="block text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted/60 mb-1">GDP</span>
            <span className="block text-sm font-semibold text-text-primary">{gdp != null ? formatValue(gdp, "NY.GDP.MKTP.CD") : "--"}</span>
            <ChangeIndicator value={gdpYoY} />
          </div>
          <div>
            <span className="block text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted/60 mb-1">GDP/Capita</span>
            <span className="block text-sm font-semibold text-text-primary">{gdpPerCapita != null ? formatValue(gdpPerCapita, "NY.GDP.PCAP.CD") : "--"}</span>
            <ChangeIndicator value={gdpPerCapitaYoY} />
          </div>
          <div>
            <span className="block text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted/60 mb-1">Population</span>
            <span className="block text-sm font-semibold text-text-primary">{population != null ? formatValue(population, "SP.POP.TOTL") : "--"}</span>
            <ChangeIndicator value={populationYoY} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-glass-border/40">
          <span className="text-[10px] text-text-muted/50">as of {year}</span>
          <Link href={`/analytics/${countryCode.toLowerCase()}`} className="inline-flex items-center gap-1 text-xs font-medium text-teal hover:text-teal-dark transition-colors">
            View Full Report
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
