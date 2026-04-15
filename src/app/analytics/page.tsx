"use client";

import { useState, useEffect, useCallback } from "react";
import SectionWrapper from "@/components/ui/SectionWrapper";
import SectionHeading from "@/components/ui/SectionHeading";
import GDPComparisonChart from "@/components/analytics/GDPComparisonChart";
import YoYGrowthChart from "@/components/analytics/YoYGrowthChart";
import EconomicBubbleChart from "@/components/analytics/WorldMapChart";
import KPICard from "@/components/analytics/KPICard";
import CountrySelector from "@/components/analytics/CountrySelector";
import DataTable from "@/components/analytics/DataTable";
import PremiumBanner from "@/components/analytics/PremiumBanner";
import { fetchDashboardData } from "@/lib/wb/api";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { supabase } from "@/lib/supabase";
import AuthModal from "@/components/ui/AuthModal";
import type { DashboardData, IndicatorTrend, LatestValue } from "@/lib/wb/types";

const ALL_COUNTRIES = ["IND", "USA", "CHN", "GBR"];

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(ALL_COUNTRIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();

  useEffect(() => {
    fetchDashboardData()
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Check if user has entitlement for the analytics product
  useEffect(() => {
    async function checkEntitlement() {
      if (!user) {
        setHasAccess(false);
        return;
      }
      try {
        const { data: product } = await supabase.from("products").select("id").eq("slug", "data-analytics-platform").single();

        if (!product) {
          setHasAccess(false);
          return;
        }

        const { data: entitlement } = await supabase.from("user_entitlements").select("id").eq("user_id", user.id).eq("product_id", product.id).eq("is_active", true).limit(1);

        setHasAccess(!!(entitlement && entitlement.length > 0));
      } catch {
        setHasAccess(false);
      }
    }

    if (!authLoading) {
      checkEntitlement();
    }
  }, [user, authLoading]);

  function handlePurchase(productSlug: string) {
    addItem({
      productId: productSlug,
      slug: productSlug,
      title: productSlug === "data-analytics-platform" ? "Data Analytics Platform" : "Software Engineering Course",
      priceCents: productSlug === "data-analytics-platform" ? 4900 : 7900,
      salePriceCents: null,
      saleEndsAt: null,
      currency: "usd",
      thumbnailUrl: "",
    });
  }

  const toggleCountry = useCallback((code: string) => {
    setSelectedCountries((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }, []);

  // Filter data by selected countries
  const filterByCountry = <T extends { country_code: string }>(items: T[]): T[] => items?.filter((d) => selectedCountries.includes(d.country_code)) ?? [];

  const filteredGdp = filterByCountry(data?.gdp_comparison ?? []);
  const filteredPop = filterByCountry(data?.population_comparison ?? []);
  const filteredGdpPc = filterByCountry(data?.gdp_per_capita_comparison ?? []);
  const filteredLatest = filterByCountry(data?.latest_values ?? []);

  // Get latest GDP YoY for KPI cards
  function getLatestYoY(trends: IndicatorTrend[], countryCode: string): number | null {
    const countryTrends = trends.filter((t) => t.country_code === countryCode && t.yoy_change_pct != null);
    if (!countryTrends.length) return null;
    return countryTrends[countryTrends.length - 1].yoy_change_pct;
  }

  function getLatestForIndicator(latestValues: LatestValue[], code: string, indicator: string): LatestValue | undefined {
    return latestValues.find((v) => v.country_code === code && v.indicator_code === indicator);
  }

  if (loading) {
    return (
      <SectionWrapper className="min-h-screen">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal/30 border-t-teal" />
          <p className="mt-4 text-text-muted">Loading economic intelligence...</p>
        </div>
      </SectionWrapper>
    );
  }

  if (error || !data) {
    return (
      <SectionWrapper className="min-h-screen">
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-red-400">Failed to load analytics data</p>
          <p className="mt-2 text-sm text-text-muted">{error}</p>
        </div>
      </SectionWrapper>
    );
  }

  const syncStatus = data.sync_status;

  return (
    <main className="min-h-screen pb-20">
      {/* Auth Modal */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Premium Banner */}
      <SectionWrapper className="pt-8 pb-0 md:pt-12">
        <PremiumBanner isAuthenticated={!!user} hasAccess={hasAccess} onAuthRequired={() => setAuthOpen(true)} onPurchase={handlePurchase} />
      </SectionWrapper>

      {/* Hero / Header */}
      <SectionWrapper className="pt-8 pb-0 md:pt-12">
        <SectionHeading
          label="World Bank Analytics"
          title="Global Economic Intelligence Report"
          description="Real-time economic indicators powered by World Bank data. GDP, population, and per-capita analysis across major economies."
        />

        {/* Sync status badge */}
        {syncStatus && (
          <div className="mx-auto mb-8 flex items-center justify-center gap-2 text-xs text-text-muted/50">
            <span className={`h-2 w-2 rounded-full ${syncStatus.status === "completed" ? "bg-emerald-400" : syncStatus.status === "running" ? "bg-amber-400 animate-pulse" : "bg-red-400"}`} />
            <span>
              Last sync: {new Date(syncStatus.started_at).toLocaleDateString()} &middot; {syncStatus.status}
            </span>
          </div>
        )}

        {/* Country filter */}
        <div className="flex justify-center">
          <CountrySelector countries={ALL_COUNTRIES} selected={selectedCountries} onToggle={toggleCountry} />
        </div>
      </SectionWrapper>

      {/* KPI Cards */}
      <SectionWrapper className="py-10 md:py-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {selectedCountries.map((code) => {
            const gdp = getLatestForIndicator(data.latest_values, code, "NY.GDP.MKTP.CD");
            const yoy = getLatestYoY(data.gdp_comparison, code);
            return gdp ? (
              <KPICard
                key={code}
                label={`${gdp.country_name} GDP`}
                value={gdp.value}
                indicator="NY.GDP.MKTP.CD"
                year={gdp.year}
                change={yoy}
                icon={code === "IND" ? "🇮🇳" : code === "USA" ? "🇺🇸" : code === "CHN" ? "🇨🇳" : "🇬🇧"}
              />
            ) : null;
          })}
        </div>
      </SectionWrapper>

      {/* GDP Comparison Chart */}
      <SectionWrapper className="py-6 md:py-8">
        <GDPComparisonChart data={filteredGdp} title="GDP Comparison (Current US$)" indicatorCode="NY.GDP.MKTP.CD" />
      </SectionWrapper>

      {/* YoY Growth + GDP Per Capita side by side */}
      <SectionWrapper className="py-6 md:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <YoYGrowthChart data={filteredGdp} title="GDP Growth Rate (YoY %)" />
          <GDPComparisonChart data={filteredGdpPc} title="GDP Per Capita (US$)" indicatorCode="NY.GDP.PCAP.CD" />
        </div>
      </SectionWrapper>

      {/* Population Chart */}
      <SectionWrapper className="py-6 md:py-8">
        <GDPComparisonChart data={filteredPop} title="Population Trends" indicatorCode="SP.POP.TOTL" />
      </SectionWrapper>

      {/* Economic Bubble Chart */}
      <SectionWrapper className="py-6 md:py-8">
        <EconomicBubbleChart data={filteredLatest} />
      </SectionWrapper>

      {/* Data Table */}
      <SectionWrapper className="py-6 md:py-8">
        <h3 className="mb-6 font-display text-xl font-semibold text-text-primary">Latest Indicator Values</h3>
        <DataTable data={filteredLatest} />
      </SectionWrapper>

      {/* Report Footer */}
      <SectionWrapper className="py-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs text-text-muted/40">
            Data sourced from the World Bank Open Data API. Values are in current US dollars unless otherwise noted. This report is generated automatically and refreshed daily.
          </p>
          <p className="mt-2 text-xs text-text-muted/30">&copy; {new Date().getFullYear()} The Puffer Labs &middot; Global Economic Intelligence</p>
        </div>
      </SectionWrapper>
    </main>
  );
}
