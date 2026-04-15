// World Bank Analytics — Supabase data fetching

import { supabase } from "@/lib/supabase";
import { INDICATOR_LABELS, type DashboardData, type CountrySnapshot, type IndicatorTrend, type CountryListItem, type CountryReport } from "./types";

const DEFAULT_COUNTRIES = ["IND", "USA", "CHN", "GBR"];

export async function fetchDashboardData(countries: string[] = DEFAULT_COUNTRIES): Promise<DashboardData | null> {
  const { data, error } = await supabase.rpc("get_dashboard_data", {
    p_countries: countries,
  });

  if (error) {
    console.error("Failed to fetch dashboard data:", error);
    return null;
  }

  return data as unknown as DashboardData;
}

export async function fetchGdpTrend(countryCode: string): Promise<
  {
    year: number;
    gdp: number;
    gdp_per_capita: number;
    population: number;
    gdp_yoy_pct: number | null;
  }[]
> {
  const { data, error } = await supabase.rpc("get_gdp_trend", {
    p_country: countryCode,
  });

  if (error) {
    console.error("Failed to fetch GDP trend:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    year: row.year,
    gdp: row.gdp ?? 0,
    gdp_per_capita: row.gdp_per_capita ?? 0,
    population: row.population ?? 0,
    gdp_yoy_pct: row.gdp_yoy_pct,
  }));
}

export async function fetchCountrySnapshot(countryCode: string): Promise<CountrySnapshot | null> {
  const { data, error } = await supabase.rpc("get_country_snapshot", {
    p_country: countryCode,
  });

  if (error) {
    console.error("Failed to fetch country snapshot:", error);
    return null;
  }

  const snapshot = data?.[0];
  if (!snapshot) return null;

  return {
    country_name: snapshot.country_name ?? countryCode,
    region: snapshot.region ?? "",
    income_level: snapshot.income_level ?? "",
    latest_gdp: snapshot.latest_gdp ?? 0,
    latest_gdp_per_capita: snapshot.latest_gdp_per_capita ?? 0,
    latest_population: snapshot.latest_population ?? 0,
    gdp_cagr_5yr: snapshot.gdp_cagr_5yr,
    latest_year: snapshot.latest_year ?? 0,
  };
}

export async function fetchCompareCountries(indicator: string, countries: string[] = DEFAULT_COUNTRIES): Promise<IndicatorTrend[]> {
  const { data, error } = await supabase.rpc("compare_countries", {
    p_indicator: indicator,
    p_countries: countries,
  });

  if (error) {
    console.error("Failed to fetch comparison:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    country_code: row.country_code,
    country_name: row.country_name,
    indicator_code: indicator,
    indicator_name: INDICATOR_LABELS[indicator] ?? indicator,
    year: row.year,
    value: row.value,
    prev_value: null,
    yoy_change_pct: row.yoy_change_pct,
  }));
}

export async function fetchLatestValues() {
  // Read from pre-computed flat table (refreshed after every sync)
  const { data, error } = await supabase
    .from("wb_country_latest" as never)
    .select("country_code, country_name, region, indicator_code, indicator_name, latest_year, latest_value, yoy_change_pct, global_rank")
    .not("latest_value", "is", null)
    .limit(10000);

  if (error) {
    // Fallback to raw table if flat table doesn't exist yet
    console.warn("wb_country_latest not available, falling back to raw query");
    return fetchLatestValuesFallback();
  }

  const rows = (data ?? []) as unknown as {
    country_code: string;
    country_name: string;
    region: string;
    indicator_code: string;
    indicator_name: string;
    latest_year: number;
    latest_value: number;
    yoy_change_pct: number | null;
    global_rank: number | null;
  }[];

  return rows.map((row) => ({
    country_code: row.country_code,
    country_name: row.country_name,
    region: row.region ?? "",
    indicator_code: row.indicator_code,
    indicator_name: row.indicator_name ?? INDICATOR_LABELS[row.indicator_code] ?? row.indicator_code,
    year: row.latest_year,
    value: row.latest_value,
  }));
}

async function fetchLatestValuesFallback() {
  const { data, error } = await supabase
    .from("wb_indicator_values" as never)
    .select("country_code, indicator_code, year, value")
    .not("value", "is", null)
    .order("year", { ascending: false })
    .limit(10000);

  if (error) {
    console.error("Fallback fetch failed:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as { country_code: string; indicator_code: string; year: number; value: number }[];
  const seen = new Set<string>();
  return rows
    .filter((row) => {
      const key = `${row.country_code}:${row.indicator_code}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((row) => ({
      country_code: row.country_code,
      country_name: row.country_code,
      region: "",
      indicator_code: row.indicator_code,
      indicator_name: INDICATOR_LABELS[row.indicator_code] ?? row.indicator_code,
      year: row.year,
      value: row.value,
    }));
}

// Fetch country summary from flat table
export async function fetchCountrySummaries() {
  const { data, error } = await supabase
    .from("wb_country_summary" as never)
    .select("*")
    .order("gdp_rank", { ascending: true })
    .limit(300);

  if (error) {
    console.error("Failed to fetch summaries:", error);
    return [];
  }
  return (data ?? []) as unknown as {
    country_code: string;
    country_name: string;
    region: string;
    income_level: string;
    gdp: number | null;
    gdp_year: number | null;
    gdp_growth_pct: number | null;
    gdp_per_capita: number | null;
    population: number | null;
    pop_growth_pct: number | null;
    urban_pct: number | null;
    life_expectancy: number | null;
    unemployment_pct: number | null;
    internet_pct: number | null;
    inflation_pct: number | null;
    gdp_rank: number | null;
    gdp_pc_rank: number | null;
    pop_rank: number | null;
    latest_year: number | null;
    indicator_count: number;
  }[];
}

export async function fetchSyncStatus() {
  const { data, error } = await supabase.from("wb_sync_runs").select("*").order("started_at", { ascending: false }).limit(5);

  if (error) {
    console.error("Failed to fetch sync status:", error);
    return [];
  }

  return data ?? [];
}

export async function fetchAllCountries(): Promise<CountryListItem[]> {
  // Try RPC first, fall back to direct table query
  const { data, error } = await supabase.rpc("get_all_countries" as never);
  if (!error && data) return (data ?? []) as unknown as CountryListItem[];

  // Fallback: query wb_countries directly
  const { data: countries, error: err2 } = await supabase
    .from("wb_countries" as never)
    .select("code, name, region, income_level")
    .order("name");

  if (err2) {
    console.error("Failed to fetch countries:", err2);
    return [];
  }
  const rows = (countries ?? []) as unknown as { code: string; name: string; region: string | null; income_level: string | null }[];
  return rows.map((c) => ({
    code: c.code,
    name: c.name,
    region: c.region ?? "",
    income_level: c.income_level ?? "",
    indicator_count: 0,
    latest_year: null,
  }));
}

export async function fetchCountryReport(countryCode: string): Promise<CountryReport[]> {
  const { data, error } = await supabase.rpc("get_country_report" as never, { p_country: countryCode } as never);
  if (error) {
    console.error("Failed to fetch country report:", error);
    return [];
  }
  return (data ?? []) as unknown as CountryReport[];
}

export async function fetchIndicatorCoverage() {
  const { data, error } = await supabase.rpc("get_indicator_coverage_summary" as never);
  if (error) {
    console.error("Failed to fetch coverage:", error);
    return [];
  }
  return (data ?? []) as unknown as { indicator_code: string; indicator_name: string; category: string; country_count: number; avg_year_span: number; avg_non_null_pct: number }[];
}
