"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { formatValue, INDICATOR_LABELS } from "@/lib/wb/types";

function isDarkTheme() {
  return document.documentElement.getAttribute("data-theme") !== "light";
}

function themeColors() {
  const dark = isDarkTheme();
  return {
    text: dark ? "rgba(255,255,255,0.92)" : "rgba(15,23,42,0.88)",
    textMuted: dark ? "rgba(255,255,255,0.7)" : "rgba(15,23,42,0.6)",
    textDim: dark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.5)",
    textFaint: dark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.4)",
    axisLine: dark ? "rgba(255,255,255,0.15)" : "rgba(15,23,42,0.12)",
    splitLine: dark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.08)",
    tooltipBg: dark ? "rgba(15,20,35,0.95)" : "rgba(255,255,255,0.96)",
    tooltipBorder: dark ? "rgba(78,205,196,0.2)" : "rgba(15,23,42,0.1)",
    tooltipText: dark ? "#e0e0e0" : "#1e293b",
    teal: dark ? "rgba(78,205,196,1)" : "rgba(20,184,166,1)",
    lime: dark ? "rgba(163,230,53,1)" : "rgba(132,204,22,1)",
  };
}

interface Props {
  data: { country_code: string; country_name: string; value: number }[];
  indicator: string;
  title: string;
  topN?: number;
}

function interpolateColor(color1: string, color2: string, t: number): string {
  // Parse rgba colors
  const parse = (c: string) => {
    const m = c.match(/[\d.]+/g);
    return m ? m.map(Number) : [0, 0, 0, 1];
  };
  const c1 = parse(color1);
  const c2 = parse(color2);
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  const a = c1[3] + (c2[3] - c1[3]) * t;
  return `rgba(${r},${g},${b},${a.toFixed(2)})`;
}

function buildOption(data: { country_code: string; country_name: string; value: number }[], indicator: string, title: string, topN: number): echarts.EChartsOption {
  const c = themeColors();
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, topN);
  // Reverse for bottom-to-top display (highest at top)
  const displayed = [...sorted].reverse();

  const countries = displayed.map((d, i) => `#${sorted.length - i}  ${d.country_name}`);
  const values = displayed.map((d) => d.value);
  const colors = displayed.map((_, i) => {
    const t = i / Math.max(displayed.length - 1, 1);
    return interpolateColor(c.lime, c.teal, t);
  });

  return {
    backgroundColor: "transparent",
    title: {
      text: title,
      left: "center",
      textStyle: { color: c.text, fontSize: 18, fontWeight: 600, fontFamily: "inherit" },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: c.tooltipBg,
      borderColor: c.tooltipBorder,
      textStyle: { color: c.tooltipText, fontSize: 13 },
      formatter: (params: unknown) => {
        const arr = params as { name: string; value: number }[];
        if (!Array.isArray(arr) || !arr.length) return "";
        const p = arr[0];
        return `<div style="font-weight:600;margin-bottom:4px">${p.name}</div>
          <div>${INDICATOR_LABELS[indicator] ?? indicator}: <strong>${formatValue(p.value, indicator)}</strong></div>`;
      },
    },
    grid: { left: 200, right: 60, top: 50, bottom: 30 },
    xAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: c.splitLine } },
      axisLabel: {
        color: c.textFaint,
        fontSize: 11,
        formatter: (val: number) => formatValue(val, indicator),
      },
    },
    yAxis: {
      type: "category",
      data: countries,
      axisLine: { lineStyle: { color: c.axisLine } },
      axisTick: { show: false },
      axisLabel: {
        color: c.textDim,
        fontSize: 12,
        fontWeight: 500,
        width: 170,
        overflow: "truncate",
      },
    },
    series: [
      {
        type: "bar",
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            color: colors[i],
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: "60%",
        label: {
          show: true,
          position: "right",
          color: c.textMuted,
          fontSize: 11,
          fontWeight: 600,
          formatter: (params: unknown) => {
            const p = params as { value: number };
            return formatValue(p.value, indicator);
          },
        },
      },
    ],
  };
}

export default function RankingBarChart({ data, indicator, title, topN = 15 }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    const chart = echarts.init(chartRef.current, undefined, { renderer: "canvas" });
    chart.setOption(buildOption(data, indicator, title, topN), true);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    const observer = new MutationObserver(() => {
      chart.setOption(buildOption(data, indicator, title, topN), true);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [data, indicator, title, topN]);

  const chartHeight = Math.max(400, Math.min(topN, data.length) * 36 + 80);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-glass/50 backdrop-blur-sm p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-teal/[0.03] to-transparent pointer-events-none" />
      <div ref={chartRef} className="relative w-full" style={{ height: `${chartHeight}px` }} />
    </div>
  );
}
