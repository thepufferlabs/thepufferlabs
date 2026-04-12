// World Bank Analytics Platform — Types

export interface WBCountry {
  code: string;
  name: string;
  region: string | null;
  income_level: string | null;
}

export interface WBIndicator {
  code: string;
  name: string;
  description: string | null;
}

export interface WBIndicatorValue {
  country_code: string;
  indicator_code: string;
  year: number;
  value: number | null;
  unit: string | null;
}

export interface CountryYearSummary {
  country_code: string;
  country_name: string;
  region: string;
  year: number;
  gdp: number | null;
  gdp_per_capita: number | null;
  population: number | null;
}

export interface IndicatorTrend {
  country_code: string;
  country_name: string;
  indicator_code: string;
  indicator_name: string;
  year: number;
  value: number | null;
  prev_value: number | null;
  yoy_change_pct: number | null;
}

export interface LatestValue {
  country_code: string;
  country_name: string;
  region: string;
  indicator_code: string;
  indicator_name: string;
  year: number;
  value: number;
}

export interface CountrySnapshot {
  country_name: string;
  region: string;
  income_level: string;
  latest_gdp: number;
  latest_gdp_per_capita: number;
  latest_population: number;
  gdp_cagr_5yr: number | null;
  latest_year: number;
}

export interface SyncRun {
  run_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  rows_inserted: number;
  rows_updated: number;
  error_message: string | null;
}

export interface DashboardData {
  latest_values: LatestValue[];
  gdp_comparison: IndicatorTrend[];
  population_comparison: IndicatorTrend[];
  gdp_per_capita_comparison: IndicatorTrend[];
  sync_status: SyncRun | null;
}

// Country color map for consistent chart styling
export const COUNTRY_COLORS: Record<string, string> = {
  IND: "#FF6B35",
  USA: "#4ECDC4",
  CHN: "#E63946",
  GBR: "#457B9D",
};

export const COUNTRY_FLAGS: Record<string, string> = {
  IND: "🇮🇳",
  USA: "🇺🇸",
  CHN: "🇨🇳",
  GBR: "🇬🇧",
};

export const INDICATOR_LABELS: Record<string, string> = {
  "NY.GDP.MKTP.CD": "GDP (Current US$)",
  "NY.GDP.PCAP.CD": "GDP Per Capita (US$)",
  "SP.POP.TOTL": "Total Population",
};

export function formatValue(value: number, indicator?: string): string {
  if (indicator === "SP.POP.TOTL") {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString();
  }
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}
