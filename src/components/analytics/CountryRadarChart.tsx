"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { INDICATOR_CATEGORIES } from "@/lib/wb/types";

function isDarkTheme() {
  return document.documentElement.getAttribute("data-theme") !== "light";
}

function themeColors() {
  const dark = isDarkTheme();
  return {
    text: dark ? "rgba(255,255,255,0.92)" : "rgba(15,23,42,0.88)",
    textMuted: dark ? "rgba(255,255,255,0.7)" : "rgba(15,23,42,0.6)",
    textDim: dark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.5)",
    axisLine: dark ? "rgba(255,255,255,0.15)" : "rgba(15,23,42,0.12)",
    splitLine: dark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.08)",
    splitArea1: dark ? "rgba(78,205,196,0.02)" : "rgba(15,23,42,0.02)",
    splitArea2: dark ? "rgba(78,205,196,0.04)" : "rgba(15,23,42,0.04)",
    tooltipBg: dark ? "rgba(15,20,35,0.95)" : "rgba(255,255,255,0.96)",
    tooltipBorder: dark ? "rgba(78,205,196,0.2)" : "rgba(15,23,42,0.1)",
    tooltipText: dark ? "#e0e0e0" : "#1e293b",
    primary: dark ? "rgba(78,205,196,0.85)" : "rgba(20,184,166,0.85)",
    primaryFill: dark ? "rgba(78,205,196,0.15)" : "rgba(20,184,166,0.12)",
    compare: dark ? "rgba(251,146,60,0.85)" : "rgba(234,88,12,0.85)",
    compareFill: dark ? "rgba(251,146,60,0.1)" : "rgba(234,88,12,0.08)",
  };
}

interface Props {
  countryCode: string;
  countryName: string;
  data: { indicator_code: string; value: number; year: number }[];
  compareData?: { indicator_code: string; value: number; year: number }[];
  compareName?: string;
}

interface NormConfig {
  indicator: string;
  min: number;
  max: number;
  invert?: boolean;
}

const AXIS_CONFIG: Record<string, NormConfig> = {
  economy: { indicator: "NY.GDP.PCAP.CD", min: 0, max: 80000 },
  trade: { indicator: "NE.TRD.GNFS.ZS", min: 0, max: 200 },
  employment: { indicator: "SL.UEM.TOTL.ZS", min: 0, max: 30, invert: true },
  population: { indicator: "SP.DYN.LE00.IN", min: 50, max: 85 },
  health: { indicator: "SH.XPD.CHEX.GD.ZS", min: 0, max: 20 },
  infra: { indicator: "IT.NET.USER.ZS", min: 0, max: 100 },
};

function normalize(value: number | undefined, config: NormConfig): number {
  if (value === undefined || value === null) return 0;
  const clamped = Math.max(config.min, Math.min(config.max, value));
  let score = ((clamped - config.min) / (config.max - config.min)) * 100;
  if (config.invert) score = 100 - score;
  return Math.round(score * 10) / 10;
}

function computeScores(data: { indicator_code: string; value: number; year: number }[]): number[] {
  const categories = Object.keys(AXIS_CONFIG);
  return categories.map((cat) => {
    const config = AXIS_CONFIG[cat];
    // Find the best (most recent) value for the target indicator
    const match = data.filter((d) => d.indicator_code === config.indicator).sort((a, b) => b.year - a.year)[0];
    return normalize(match?.value, config);
  });
}

function buildOption(
  countryName: string,
  data: { indicator_code: string; value: number; year: number }[],
  compareData?: { indicator_code: string; value: number; year: number }[],
  compareName?: string
): echarts.EChartsOption {
  const c = themeColors();
  const categories = Object.keys(AXIS_CONFIG);
  const labels = categories.map((cat) => INDICATOR_CATEGORIES[cat].label);

  const scores = computeScores(data);
  const series: echarts.SeriesOption[] = [
    {
      name: countryName,
      type: "radar",
      symbol: "circle",
      symbolSize: 7,
      lineStyle: { width: 2.5, color: c.primary },
      itemStyle: { color: c.primary, borderWidth: 2, borderColor: c.primary },
      areaStyle: { color: c.primaryFill },
      data: [{ value: scores, name: countryName }],
    },
  ];

  if (compareData && compareName) {
    const compareScores = computeScores(compareData);
    series.push({
      name: compareName,
      type: "radar",
      symbol: "diamond",
      symbolSize: 7,
      lineStyle: { width: 2.5, color: c.compare },
      itemStyle: { color: c.compare, borderWidth: 2, borderColor: c.compare },
      areaStyle: { color: c.compareFill },
      data: [{ value: compareScores, name: compareName }],
    });
  }

  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: c.tooltipBg,
      borderColor: c.tooltipBorder,
      textStyle: { color: c.tooltipText, fontSize: 13 },
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number[] };
        if (!p || !p.value) return "";
        let html = `<div style="font-weight:600;margin-bottom:6px">${p.name}</div>`;
        labels.forEach((label, i) => {
          html += `<div style="margin:2px 0"><span style="color:${c.textDim}">${label}:</span> <strong>${p.value[i].toFixed(1)}</strong>/100</div>`;
        });
        return html;
      },
    },
    legend: {
      bottom: 8,
      textStyle: { color: c.textMuted, fontSize: 12 },
      icon: "circle",
    },
    radar: {
      indicator: labels.map((name) => ({ name, max: 100 })),
      shape: "polygon",
      splitNumber: 5,
      axisName: {
        color: c.textMuted,
        fontSize: 12,
        fontWeight: 500,
      },
      splitLine: { lineStyle: { color: c.splitLine } },
      splitArea: {
        show: true,
        areaStyle: { color: [c.splitArea1, c.splitArea2] },
      },
      axisLine: { lineStyle: { color: c.axisLine } },
    },
    series,
  };
}

export default function CountryRadarChart({ countryName, data, compareData, compareName }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    const chart = echarts.init(chartRef.current, undefined, { renderer: "canvas" });
    chart.setOption(buildOption(countryName, data, compareData, compareName), true);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    const observer = new MutationObserver(() => {
      chart.setOption(buildOption(countryName, data, compareData, compareName), true);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [countryName, data, compareData, compareName]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-glass/50 backdrop-blur-sm p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-teal/[0.03] to-transparent pointer-events-none" />
      <h3 className="relative text-sm font-medium uppercase tracking-[0.15em] text-text-muted/70 mb-2">Strength Profile</h3>
      <div ref={chartRef} className="relative h-[400px] w-full" />
    </div>
  );
}
