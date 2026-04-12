// World Bank Analytics — Supabase data fetching

import { supabase } from "@/lib/supabase";
import type { DashboardData, CountrySnapshot, IndicatorTrend } from "./types";

const DEFAULT_COUNTRIES = ["IND", "USA", "CHN", "GBR"];

export async function fetchDashboardData(countries: string[] = DEFAULT_COUNTRIES): Promise<DashboardData | null> {
  const { data, error } = await supabase.rpc("get_dashboard_data", {
    p_countries: countries,
  });

  if (error) {
    console.error("Failed to fetch dashboard data:", error);
    return null;
  }

  return data as DashboardData;
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

  return data ?? [];
}

export async function fetchCountrySnapshot(countryCode: string): Promise<CountrySnapshot | null> {
  const { data, error } = await supabase.rpc("get_country_snapshot", {
    p_country: countryCode,
  });

  if (error) {
    console.error("Failed to fetch country snapshot:", error);
    return null;
  }

  return data?.[0] ?? null;
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

  return data ?? [];
}

export async function fetchLatestValues() {
  const { data, error } = await supabase.rpc("get_latest_values");

  if (error) {
    console.error("Failed to fetch latest values:", error);
    return [];
  }

  return data ?? [];
}

export async function fetchSyncStatus() {
  const { data, error } = await supabase.from("wb_sync_runs").select("*").order("started_at", { ascending: false }).limit(5);

  if (error) {
    console.error("Failed to fetch sync status:", error);
    return [];
  }

  return data ?? [];
}
