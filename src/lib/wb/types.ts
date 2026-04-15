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
  "NY.GDP.MKTP.KD.ZG": "GDP Growth (%)",
  "NY.GDP.PCAP.CD": "GDP Per Capita (US$)",
  "NY.GDP.PCAP.KD.ZG": "GDP Per Capita Growth (%)",
  "FP.CPI.TOTL.ZG": "Inflation (%)",
  "NE.TRD.GNFS.ZS": "Trade (% of GDP)",
  "BX.KLT.DINV.CD.WD": "FDI Net Inflows (US$)",
  "SL.UEM.TOTL.ZS": "Unemployment (%)",
  "SL.TLF.CACT.ZS": "Labor Force Participation (%)",
  "SP.POP.TOTL": "Population",
  "SP.POP.GROW": "Population Growth (%)",
  "SP.URB.TOTL.IN.ZS": "Urban Population (%)",
  "SP.DYN.LE00.IN": "Life Expectancy (Years)",
  "SH.XPD.CHEX.GD.ZS": "Health Expenditure (% GDP)",
  "SE.ADT.LITR.ZS": "Literacy Rate (%)",
  "SE.XPD.TOTL.GD.ZS": "Education Expenditure (% GDP)",
  "EG.USE.ELEC.KH.PC": "Electric Power (kWh/capita)",
  "IT.NET.USER.ZS": "Internet Users (%)",
  "EN.ATM.CO2E.PC": "CO2 Emissions (tons/capita)",
  "NY.GNP.PCAP.CD": "GNI Per Capita (US$)",
};

export const INDICATOR_CATEGORIES: Record<string, { label: string; indicators: string[] }> = {
  economy: { label: "Economy", indicators: ["NY.GDP.MKTP.CD", "NY.GDP.MKTP.KD.ZG", "NY.GDP.PCAP.CD", "NY.GDP.PCAP.KD.ZG", "NY.GNP.PCAP.CD"] },
  trade: { label: "Trade & Investment", indicators: ["NE.TRD.GNFS.ZS", "BX.KLT.DINV.CD.WD"] },
  employment: { label: "Employment", indicators: ["SL.UEM.TOTL.ZS", "SL.TLF.CACT.ZS", "FP.CPI.TOTL.ZG"] },
  population: { label: "Population", indicators: ["SP.POP.TOTL", "SP.POP.GROW", "SP.URB.TOTL.IN.ZS"] },
  health: { label: "Health & Education", indicators: ["SP.DYN.LE00.IN", "SH.XPD.CHEX.GD.ZS", "SE.ADT.LITR.ZS", "SE.XPD.TOTL.GD.ZS"] },
  infra: { label: "Infrastructure", indicators: ["EG.USE.ELEC.KH.PC", "IT.NET.USER.ZS", "EN.ATM.CO2E.PC"] },
};

export interface CountryListItem {
  code: string;
  name: string;
  region: string;
  income_level: string;
  indicator_count: number;
  latest_year: number | null;
}

export interface CountryReport {
  country_code: string;
  indicator_code: string;
  indicator_name: string;
  year: number;
  value: number;
  prev_value: number | null;
  yoy_pct: number | null;
}

/** Percentage or rate indicators — codes ending in ZS, ZG, or life expectancy */
function isPercentageOrRate(indicator: string): boolean {
  return indicator.endsWith(".ZS") || indicator.endsWith(".ZG") || indicator === "SP.DYN.LE00.IN";
}

export function formatValue(value: number, indicator?: string): string {
  // Percentage / rate indicators — no $, T, B, M suffixes
  if (indicator && isPercentageOrRate(indicator)) {
    return `${value.toFixed(value % 1 === 0 ? 1 : 2)}`;
  }

  // Population (not a dollar value)
  if (indicator === "SP.POP.TOTL") {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString();
  }

  // CO2 emissions, electric power — plain number
  if (indicator === "EN.ATM.CO2E.PC" || indicator === "EG.USE.ELEC.KH.PC") {
    return `${value.toFixed(2)}`;
  }

  // Default: dollar values
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}
