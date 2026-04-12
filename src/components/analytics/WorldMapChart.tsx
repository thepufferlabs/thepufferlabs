"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { COUNTRY_COLORS, formatValue, type LatestValue } from "@/lib/wb/types";

// GDP vs Population bubble chart — conveys economic weight at a glance
interface Props {
  data: LatestValue[];
}

export default function EconomicBubbleChart({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, { renderer: "canvas" });
    }

    // Group by country
    const countries = [...new Set(data.map((d) => d.country_code))];
    const seriesData = countries.map((code) => {
      const gdp = data.find((d) => d.country_code === code && d.indicator_code === "NY.GDP.MKTP.CD");
      const pop = data.find((d) => d.country_code === code && d.indicator_code === "SP.POP.TOTL");
      const gdpPc = data.find((d) => d.country_code === code && d.indicator_code === "NY.GDP.PCAP.CD");
      return {
        name: gdp?.country_name ?? code,
        value: [
          gdpPc?.value ?? 0, // x: GDP per capita
          pop?.value ?? 0, // y: Population
          gdp?.value ?? 0, // size: GDP
        ],
        itemStyle: { color: COUNTRY_COLORS[code] ?? "#888" },
      };
    });

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      title: {
        text: "Economic Weight: GDP Per Capita vs Population",
        subtext: "Bubble size = Total GDP",
        left: "center",
        textStyle: { color: "rgba(255,255,255,0.92)", fontSize: 18, fontWeight: 600 },
        subtextStyle: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
      },
      tooltip: {
        backgroundColor: "rgba(15,20,35,0.95)",
        borderColor: "rgba(78,205,196,0.2)",
        textStyle: { color: "#e0e0e0", fontSize: 13 },
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number[] };
          return `<div style="font-weight:600;margin-bottom:4px">${p.name}</div>
            <div>GDP/Capita: ${formatValue(p.value[0], "NY.GDP.PCAP.CD")}</div>
            <div>Population: ${formatValue(p.value[1], "SP.POP.TOTL")}</div>
            <div>Total GDP: ${formatValue(p.value[2], "NY.GDP.MKTP.CD")}</div>`;
        },
      },
      grid: { left: 90, right: 40, top: 80, bottom: 60 },
      xAxis: {
        type: "value",
        name: "GDP Per Capita (US$)",
        nameLocation: "center",
        nameGap: 35,
        nameTextStyle: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
        axisLabel: {
          color: "rgba(255,255,255,0.5)",
          formatter: (v: number) => formatValue(v, "NY.GDP.PCAP.CD"),
        },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
      },
      yAxis: {
        type: "value",
        name: "Population",
        nameLocation: "center",
        nameGap: 65,
        nameTextStyle: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
        axisLine: { show: false },
        axisLabel: {
          color: "rgba(255,255,255,0.5)",
          formatter: (v: number) => formatValue(v, "SP.POP.TOTL"),
        },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
      },
      series: [
        {
          type: "scatter",
          data: seriesData,
          symbolSize: (val: number[]) => {
            // Scale bubble size by GDP (logarithmic for visual balance)
            return Math.max(20, Math.min(80, Math.log10(val[2]) * 6));
          },
          label: {
            show: true,
            formatter: (p: { name: string }) => p.name,
            position: "top",
            color: "rgba(255,255,255,0.7)",
            fontSize: 12,
          },
          emphasis: { scale: 1.3 },
        },
      ],
    };

    chartInstance.current.setOption(option, true);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data]);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  return <div ref={chartRef} className="h-[450px] w-full rounded-2xl border border-glass-border bg-glass/50 p-4" />;
}
