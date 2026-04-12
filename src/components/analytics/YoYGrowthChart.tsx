"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { COUNTRY_COLORS, type IndicatorTrend } from "@/lib/wb/types";

interface Props {
  data: IndicatorTrend[];
  title: string;
}

export default function YoYGrowthChart({ data, title }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, { renderer: "canvas" });
    }

    const countries = [...new Set(data.map((d) => d.country_code))];
    const years = [...new Set(data.map((d) => d.year))].sort();

    const series = countries.map((code) => {
      const countryData = data.filter((d) => d.country_code === code);
      const name = countryData[0]?.country_name ?? code;
      return {
        name,
        type: "bar" as const,
        barGap: "10%",
        itemStyle: {
          color: COUNTRY_COLORS[code] ?? "#888",
          borderRadius: [3, 3, 0, 0],
        },
        emphasis: { itemStyle: { opacity: 1 } },
        data: years.map((y) => {
          const point = countryData.find((d) => d.year === y);
          return point?.yoy_change_pct ?? null;
        }),
      };
    });

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      title: {
        text: title,
        left: "center",
        textStyle: { color: "rgba(255,255,255,0.92)", fontSize: 18, fontWeight: 600 },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(15,20,35,0.95)",
        borderColor: "rgba(78,205,196,0.2)",
        textStyle: { color: "#e0e0e0", fontSize: 13 },
        formatter: (params: unknown) => {
          const arr = params as { seriesName: string; value: number; color: string; axisValue: string }[];
          if (!Array.isArray(arr)) return "";
          let html = `<div style="font-weight:600;margin-bottom:6px">${arr[0].axisValue}</div>`;
          arr.forEach((p) => {
            if (p.value != null) {
              const sign = p.value >= 0 ? "+" : "";
              const color = p.value >= 0 ? "#4ECDC4" : "#E63946";
              html += `<div style="display:flex;align-items:center;gap:8px;margin:3px 0">
                <span style="width:10px;height:10px;border-radius:50%;background:${p.color};display:inline-block"></span>
                <span>${p.seriesName}:</span>
                <span style="font-weight:600;color:${color}">${sign}${p.value.toFixed(2)}%</span>
              </div>`;
            }
          });
          return html;
        },
      },
      legend: {
        bottom: 10,
        textStyle: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
        icon: "circle",
      },
      grid: { left: 60, right: 30, top: 60, bottom: 60 },
      xAxis: {
        type: "category",
        data: years.map(String),
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
        axisLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, rotate: 45 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
        axisLabel: {
          color: "rgba(255,255,255,0.5)",
          fontSize: 11,
          formatter: (v: number) => `${v}%`,
        },
      },
      series,
    };

    chartInstance.current.setOption(option, true);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data, title]);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  return <div ref={chartRef} className="h-[420px] w-full rounded-2xl border border-glass-border bg-glass/50 p-4" />;
}
