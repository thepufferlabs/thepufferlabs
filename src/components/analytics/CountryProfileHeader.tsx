"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { COUNTRY_FLAGS, formatValue } from "@/lib/wb/types";

interface Props {
  code: string;
  name: string;
  region: string;
  incomeLevel: string;
  gdp: number | null;
  gdpGrowth: number | null;
  population: number | null;
  lifeExpectancy: number | null;
  gdpPerCapita: number | null;
  year: number | null;
}

function computeEconomicScore(props: Props): number {
  let sum = 0;
  let count = 0;

  if (props.gdpPerCapita != null) {
    sum += Math.min(100, Math.max(0, (props.gdpPerCapita / 80000) * 100));
    count++;
  }
  if (props.gdpGrowth != null) {
    // Growth -5 to 15 mapped to 0-100
    sum += Math.min(100, Math.max(0, ((props.gdpGrowth + 5) / 20) * 100));
    count++;
  }
  if (props.lifeExpectancy != null) {
    sum += Math.min(100, Math.max(0, ((props.lifeExpectancy - 50) / 35) * 100));
    count++;
  }
  if (props.population != null) {
    // Population diversity score — normalize log scale
    const logPop = Math.log10(Math.max(1, props.population));
    sum += Math.min(100, Math.max(0, (logPop / 10) * 100));
    count++;
  }

  return count > 0 ? Math.round(sum / count) : 0;
}

function KPIPill({ label, value, indicator }: { label: string; value: number | null; indicator?: string }) {
  if (value == null) return null;
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-glass-border bg-glass/40 px-4 py-3 backdrop-blur-sm min-w-[120px]">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted/60">{label}</span>
      <span className="text-lg font-semibold text-text-primary">{formatValue(value, indicator)}</span>
    </div>
  );
}

export default function CountryProfileHeader(props: Props) {
  const { code, name, region, incomeLevel, gdp, gdpGrowth, population, lifeExpectancy, gdpPerCapita: _gdpPerCapita, year } = props;
  const flag = COUNTRY_FLAGS[code] ?? code;
  const score = computeEconomicScore(props);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-glass-border bg-glass/60 backdrop-blur-sm"
    >
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal/[0.06] via-transparent to-lime/[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal via-lime to-teal opacity-60" />

      <div className="relative p-6 md:p-8">
        {/* Back link */}
        <Link href="/analytics" className="inline-flex items-center gap-2 text-sm text-text-muted/70 hover:text-teal transition-colors mb-5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Analytics
        </Link>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left: Identity */}
          <div className="flex items-start gap-4">
            <span className="text-5xl md:text-6xl leading-none">{flag}</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">{name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-glass-border bg-glass/40 px-3 py-1 text-xs font-medium text-text-muted">{region}</span>
                <span className="inline-flex items-center rounded-full border border-teal/20 bg-teal/[0.08] px-3 py-1 text-xs font-medium text-teal">{incomeLevel}</span>
                {year && <span className="text-xs text-text-muted/50">Data as of {year}</span>}
              </div>
            </div>
          </div>

          {/* Right: KPI pills */}
          <div className="flex flex-wrap gap-3">
            <KPIPill label="GDP" value={gdp} indicator="NY.GDP.MKTP.CD" />
            <KPIPill label="Growth" value={gdpGrowth} indicator="NY.GDP.MKTP.KD.ZG" />
            <KPIPill label="Population" value={population} indicator="SP.POP.TOTL" />
            <KPIPill label="Life Exp." value={lifeExpectancy} indicator="SP.DYN.LE00.IN" />
          </div>
        </div>

        {/* Economic Score Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-text-muted/70">Economic Score</span>
            <span className="text-sm font-semibold text-text-primary">{score}/100</span>
          </div>
          <div className="h-2 w-full rounded-full bg-glass/80 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-teal to-lime"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
