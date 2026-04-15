"use client";

import { useEffect, useRef, useCallback } from "react";
import * as echarts from "echarts";
import { INDICATOR_LABELS, INDICATOR_CATEGORIES, formatValue } from "@/lib/wb/types";

function isDarkTheme() {
  return document.documentElement.getAttribute("data-theme") !== "light";
}

function themeColors() {
  const dark = isDarkTheme();
  return {
    line: dark ? "rgba(78,205,196,0.8)" : "rgba(20,184,166,0.8)",
    areaTop: dark ? "rgba(78,205,196,0.2)" : "rgba(20,184,166,0.15)",
    areaBottom: dark ? "rgba(78,205,196,0)" : "rgba(20,184,166,0)",
  };
}

interface Props {
  data: { indicator_code: string; year: number; value: number }[];
}

interface GroupedIndicator {
  code: string;
  label: string;
  values: { year: number; value: number }[];
  currentValue: number;
  yoyChange: number | null;
}

function groupByCategory(data: Props["data"]): { category: string; label: string; indicators: GroupedIndicator[] }[] {
  const byIndicator = new Map<string, { year: number; value: number }[]>();
  for (const d of data) {
    if (!byIndicator.has(d.indicator_code)) byIndicator.set(d.indicator_code, []);
    byIndicator.get(d.indicator_code)!.push({ year: d.year, value: d.value });
  }

  const result: { category: string; label: string; indicators: GroupedIndicator[] }[] = [];

  for (const [catKey, cat] of Object.entries(INDICATOR_CATEGORIES)) {
    const indicators: GroupedIndicator[] = [];
    for (const code of cat.indicators) {
      const values = byIndicator.get(code);
      if (!values || values.length === 0) continue;

      const sorted = [...values].sort((a, b) => a.year - b.year);
      const current = sorted[sorted.length - 1];
      const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
      const yoyChange = prev && prev.value !== 0 ? ((current.value - prev.value) / Math.abs(prev.value)) * 100 : null;

      indicators.push({
        code,
        label: INDICATOR_LABELS[code] ?? code,
        values: sorted,
        currentValue: current.value,
        yoyChange,
      });
    }

    if (indicators.length > 0) {
      result.push({ category: catKey, label: cat.label, indicators });
    }
  }

  return result;
}

function SparklineCell({ indicator }: { indicator: GroupedIndicator }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const buildOption = useCallback((): echarts.EChartsOption => {
    const c = themeColors();
    const values = indicator.values.map((v) => v.value);

    return {
      backgroundColor: "transparent",
      grid: { left: 0, right: 0, top: 4, bottom: 4 },
      xAxis: { type: "category", show: false, data: indicator.values.map((v) => v.year) },
      yAxis: { type: "value", show: false, min: Math.min(...values) * 0.95, max: Math.max(...values) * 1.05 },
      series: [
        {
          type: "line",
          data: values,
          smooth: true,
          symbol: "none",
          lineStyle: { width: 2, color: c.line },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: c.areaTop },
                { offset: 1, color: c.areaBottom },
              ],
            },
          },
        },
      ],
    };
  }, [indicator]);

  useEffect(() => {
    if (!chartRef.current || indicator.values.length < 2) return;

    const chart = echarts.init(chartRef.current, undefined, { renderer: "canvas" });
    chartInstance.current = chart;
    chart.setOption(buildOption(), true);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    const observer = new MutationObserver(() => {
      chart.setOption(buildOption(), true);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      chart.dispose();
      chartInstance.current = null;
    };
  }, [indicator, buildOption]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-glass-border bg-glass/50 backdrop-blur-sm p-4 transition-all duration-300 hover:border-teal/20 hover:shadow-[0_8px_30px_rgba(34,197,94,0.04)]">
      <div className="absolute inset-0 bg-gradient-to-br from-teal/[0.02] to-transparent pointer-events-none" />
      <div className="relative">
        <p className="text-[11px] font-medium text-text-muted/60 truncate mb-1" title={indicator.label}>
          {indicator.label}
        </p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-semibold text-text-primary tracking-tight">{formatValue(indicator.currentValue, indicator.code)}</span>
          {indicator.yoyChange != null && (
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${indicator.yoyChange >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}>
              {indicator.yoyChange >= 0 ? "+" : ""}
              {indicator.yoyChange.toFixed(1)}%
            </span>
          )}
        </div>
        {indicator.values.length >= 2 ? (
          <div ref={chartRef} className="h-[80px] w-full" />
        ) : (
          <div className="h-[80px] w-full flex items-center justify-center text-xs text-text-muted/40">Insufficient data</div>
        )}
      </div>
    </div>
  );
}

export default function IndicatorSparklines({ data }: Props) {
  const grouped = groupByCategory(data);

  if (grouped.length === 0) {
    return <div className="rounded-2xl border border-glass-border bg-glass/50 p-8 text-center text-text-muted/60">No indicator data available.</div>;
  }

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <div key={group.category}>
          <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-text-muted/70 mb-4">{group.label}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {group.indicators.map((indicator) => (
              <SparklineCell key={indicator.code} indicator={indicator} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
