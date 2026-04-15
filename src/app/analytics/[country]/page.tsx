"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import * as echarts from "echarts";
import { supabase } from "@/lib/supabase";
import { fetchCountrySnapshot } from "@/lib/wb/api";
import { formatValue, INDICATOR_LABELS, INDICATOR_CATEGORIES, type CountrySnapshot } from "@/lib/wb/types";
import KPICard from "@/components/analytics/KPICard";
import SectionWrapper from "@/components/ui/SectionWrapper";

interface TimeSeriesRow {
  indicator_code: string;
  year: number;
  value: number;
}

function isDark() {
  return document.documentElement.getAttribute("data-theme") !== "light";
}

function tc() {
  const d = isDark();
  return {
    text: d ? "rgba(255,255,255,0.92)" : "rgba(15,23,42,0.88)",
    muted: d ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.45)",
    axis: d ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)",
    split: d ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)",
    tooltipBg: d ? "rgba(15,20,35,0.95)" : "rgba(255,255,255,0.96)",
    tooltipText: d ? "#e0e0e0" : "#1e293b",
  };
}

function codeToFlag(code: string): string {
  const cc = code.slice(0, 2).toUpperCase();
  try {
    return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
  } catch {
    return cc;
  }
}

export default function CountryDetailPage() {
  const params = useParams<{ country: string }>();
  const countryCode = params.country?.toUpperCase() ?? "";

  const [snapshot, setSnapshot] = useState<CountrySnapshot | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesRow[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState("NY.GDP.MKTP.CD");
  const [loading, setLoading] = useState(true);

  const chartRef = useRef<HTMLDivElement>(null);

  // Fetch all time series data for this country
  useEffect(() => {
    if (!countryCode) return;

    async function load() {
      setLoading(true);
      const [snap, tsResult] = await Promise.all([
        fetchCountrySnapshot(countryCode),
        supabase
          .from("wb_indicator_values" as never)
          .select("indicator_code, year, value")
          .eq("country_code", countryCode)
          .not("value", "is", null)
          .order("year", { ascending: true })
          .limit(5000),
      ]);

      setSnapshot(snap);
      setTimeSeries((tsResult.data ?? []) as unknown as TimeSeriesRow[]);
      setLoading(false);
    }

    load();
  }, [countryCode]);

  // Build chart when indicator or data changes
  useEffect(() => {
    if (!chartRef.current || timeSeries.length === 0) return;

    const chart = echarts.init(chartRef.current, undefined, { renderer: "canvas" });
    const c = tc();

    const filtered = timeSeries.filter((r) => r.indicator_code === selectedIndicator).sort((a, b) => a.year - b.year);

    const years = filtered.map((r) => String(r.year));
    const values = filtered.map((r) => r.value);

    chart.setOption(
      {
        backgroundColor: "transparent",
        title: {
          text: INDICATOR_LABELS[selectedIndicator] ?? selectedIndicator,
          left: "center",
          textStyle: { color: c.text, fontSize: 16, fontWeight: 600 },
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: c.tooltipBg,
          textStyle: { color: c.tooltipText, fontSize: 13 },
          formatter: (params: unknown) => {
            const arr = params as { axisValue: string; value: number }[];
            if (!Array.isArray(arr) || !arr[0]) return "";
            return `<b>${arr[0].axisValue}</b><br/>${formatValue(arr[0].value, selectedIndicator)}`;
          },
        },
        grid: { left: 70, right: 20, top: 50, bottom: 40 },
        xAxis: {
          type: "category",
          data: years,
          axisLine: { lineStyle: { color: c.axis } },
          axisLabel: { color: c.muted, fontSize: 11 },
          axisTick: { show: false },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          splitLine: { lineStyle: { color: c.split } },
          axisLabel: {
            color: c.muted,
            fontSize: 11,
            formatter: (v: number) => formatValue(v, selectedIndicator),
          },
        },
        series: [
          {
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: { width: 3, color: "#34d399" },
            itemStyle: { color: "#34d399" },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(52,211,153,0.25)" },
                { offset: 1, color: "rgba(52,211,153,0)" },
              ]),
            },
            data: values,
          },
        ],
      },
      true
    );

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);

    const observer = new MutationObserver(() => {
      const nc = tc();
      chart.setOption({
        title: { textStyle: { color: nc.text } },
        tooltip: { backgroundColor: nc.tooltipBg, textStyle: { color: nc.tooltipText } },
        xAxis: { axisLine: { lineStyle: { color: nc.axis } }, axisLabel: { color: nc.muted } },
        yAxis: { splitLine: { lineStyle: { color: nc.split } }, axisLabel: { color: nc.muted } },
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, [timeSeries, selectedIndicator]);

  // Get available indicators for this country
  const availableIndicators = [...new Set(timeSeries.map((r) => r.indicator_code))];

  // Latest values for KPI cards
  function latestFor(code: string) {
    const rows = timeSeries.filter((r) => r.indicator_code === code).sort((a, b) => b.year - a.year);
    return rows[0] ?? null;
  }

  const kpis = [
    { code: "NY.GDP.MKTP.CD", label: "GDP" },
    { code: "NY.GDP.PCAP.CD", label: "GDP Per Capita" },
    { code: "SP.POP.TOTL", label: "Population" },
    { code: "SP.DYN.LE00.IN", label: "Life Expectancy" },
    { code: "SL.UEM.TOTL.ZS", label: "Unemployment" },
    { code: "IT.NET.USER.ZS", label: "Internet Users" },
  ];

  if (loading) {
    return (
      <SectionWrapper>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal/30 border-t-teal" />
        </div>
      </SectionWrapper>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Back + Header */}
      <SectionWrapper className="pb-0">
        <Link href="/analytics" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-teal">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All Countries
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <span className="text-5xl">{codeToFlag(countryCode)}</span>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">{snapshot?.country_name ?? countryCode}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {snapshot?.region && snapshot.region !== "Unknown" && (
                <span className="rounded-full border border-glass-border bg-glass/40 px-3 py-1 text-xs font-medium text-text-muted">{snapshot.region}</span>
              )}
              {snapshot?.income_level && snapshot.income_level !== "Unknown" && (
                <span className="rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-medium text-teal">{snapshot.income_level}</span>
              )}
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* KPI Cards */}
      <SectionWrapper>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map(({ code, label }) => {
            const row = latestFor(code);
            if (!row) return null;
            return <KPICard key={code} label={label} value={row.value} indicator={code} year={row.year} />;
          })}
        </div>
      </SectionWrapper>

      {/* Indicator Dropdown + Line Chart */}
      <SectionWrapper>
        <div className="rounded-2xl border border-glass-border bg-glass/50 backdrop-blur-sm p-4 md:p-6">
          {/* Dropdown */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-text-muted/60">Select Indicator</label>
            <select
              value={selectedIndicator}
              onChange={(e) => setSelectedIndicator(e.target.value)}
              className="w-full max-w-md rounded-xl border border-glass-border bg-glass/60 px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-teal/40 cursor-pointer"
            >
              {Object.entries(INDICATOR_CATEGORIES).map(([key, cat]) => (
                <optgroup key={key} label={cat.label}>
                  {cat.indicators
                    .filter((code) => availableIndicators.includes(code))
                    .map((code) => (
                      <option key={code} value={code}>
                        {INDICATOR_LABELS[code] ?? code}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Chart */}
          <div ref={chartRef} className="h-[400px] w-full" />

          {/* No data message */}
          {timeSeries.filter((r) => r.indicator_code === selectedIndicator).length === 0 && <p className="py-12 text-center text-sm text-text-muted">No data available for this indicator.</p>}
        </div>
      </SectionWrapper>

      {/* Footer */}
      <SectionWrapper className="py-8">
        <p className="text-center text-xs text-text-muted/40">Data sourced from World Bank Open Data API</p>
      </SectionWrapper>
    </div>
  );
}
