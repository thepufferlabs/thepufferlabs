"use client";

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { formatValue } from "@/lib/wb/types";

interface CountryYearValue {
  country_code: string;
  country_name: string;
  year: number;
  value: number;
}

interface Props {
  data: CountryYearValue[];
  title?: string;
  indicator?: string;
}

const COLORS = [
  "#34d399",
  "#38bdf8",
  "#f472b6",
  "#fb923c",
  "#a78bfa",
  "#facc15",
  "#4ade80",
  "#f87171",
  "#22d3ee",
  "#e879f9",
  "#84cc16",
  "#fbbf24",
  "#60a5fa",
  "#f97316",
  "#a3e635",
  "#c084fc",
  "#2dd4bf",
  "#fb7185",
  "#818cf8",
  "#fdba74",
];

function isDark() {
  return document.documentElement.getAttribute("data-theme") !== "light";
}

function tc() {
  const d = isDark();
  return {
    text: d ? "rgba(255,255,255,0.88)" : "rgba(15,23,42,0.85)",
    muted: d ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.45)",
    yearText: d ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.06)",
  };
}

export default function BarRaceChart({ data, title = "Top 20 Economies by GDP", indicator = "NY.GDP.MKTP.CD" }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentYear, setCurrentYear] = useState(2015);

  const years = [...new Set(data.map((d) => d.year))].sort();
  const startYear = years[0] ?? 2015;
  const endYear = years[years.length - 1] ?? 2025;

  // Assign stable colors per country
  const countryColors = useRef<Record<string, string>>({});
  const allCountries = [...new Set(data.map((d) => d.country_code))];
  allCountries.forEach((code, i) => {
    if (!countryColors.current[code]) {
      countryColors.current[code] = COLORS[i % COLORS.length];
    }
  });

  function getTopN(year: number, n = 20) {
    return data
      .filter((d) => d.year === year)
      .sort((a, b) => b.value - a.value)
      .slice(0, n);
  }

  function buildOption(year: number): echarts.EChartsOption {
    const c = tc();
    const top = getTopN(year);
    const names = top.map((d) => d.country_name || d.country_code).reverse();
    const values = top.map((d) => d.value).reverse();
    const colors = top.map((d) => countryColors.current[d.country_code] ?? "#888").reverse();

    return {
      backgroundColor: "transparent",
      title: {
        text: title,
        left: "center",
        top: 10,
        textStyle: { color: c.text, fontSize: 16, fontWeight: 600 },
      },
      grid: { left: 140, right: 80, top: 50, bottom: 40 },
      xAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: c.muted,
          fontSize: 10,
          formatter: (v: number) => formatValue(v, indicator),
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "category",
        data: names,
        inverse: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: c.text,
          fontSize: 11,
          fontWeight: 500,
        },
        animationDuration: 300,
        animationDurationUpdate: 600,
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
          barWidth: "70%",
          label: {
            show: true,
            position: "right",
            color: c.muted,
            fontSize: 10,
            formatter: (params: unknown) => {
              const p = params as { value: number };
              return formatValue(p.value, indicator);
            },
          },
          animationDuration: 0,
          animationDurationUpdate: 600,
          animationEasing: "linear",
          animationEasingUpdate: "linear",
        },
      ],
      graphic: [
        {
          type: "text",
          right: 60,
          bottom: 50,
          style: {
            text: String(year),
            font: "bold 48px sans-serif",
            fill: c.yearText,
          },
          z: 0,
        },
      ],
      animationDuration: 0,
      animationDurationUpdate: 600,
      animationEasing: "linear",
      animationEasingUpdate: "linear",
    };
  }

  // Init chart
  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const chart = echarts.init(chartRef.current, undefined, { renderer: "canvas" });
    chartInstance.current = chart;
    chart.setOption(buildOption(startYear));
    setCurrentYear(startYear);

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);

    const observer = new MutationObserver(() => {
      chart.setOption(buildOption(currentYear));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      if (timerRef.current) clearInterval(timerRef.current);
      chart.dispose();
      chartInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function play() {
    if (!chartInstance.current) return;
    setPlaying(true);

    let year = currentYear >= endYear ? startYear : currentYear;
    setCurrentYear(year);
    chartInstance.current.setOption(buildOption(year));

    timerRef.current = setInterval(() => {
      year += 1;
      if (year > endYear) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPlaying(false);
        return;
      }
      setCurrentYear(year);
      chartInstance.current?.setOption(buildOption(year));
    }, 1200);
  }

  function pause() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPlaying(false);
  }

  function scrub(year: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setPlaying(false);
    setCurrentYear(year);
    chartInstance.current?.setOption(buildOption(year));
  }

  return (
    <div className="rounded-2xl border border-glass-border bg-glass/50 backdrop-blur-sm p-4 md:p-6">
      <div ref={chartRef} className="h-[560px] w-full" />

      {/* Controls */}
      <div className="mt-4 flex flex-col items-center gap-3">
        {/* Play/Pause + Year display */}
        <div className="flex items-center gap-4">
          <button
            onClick={playing ? pause : play}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-teal/30 bg-teal/10 text-teal transition-all hover:bg-teal/20 cursor-pointer"
          >
            {playing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <span className="text-2xl font-bold tabular-nums text-text-primary">{currentYear}</span>
        </div>

        {/* Year slider */}
        <div className="flex w-full max-w-md items-center gap-2">
          <span className="text-xs text-text-muted">{startYear}</span>
          <input type="range" min={startYear} max={endYear} value={currentYear} onChange={(e) => scrub(Number(e.target.value))} className="flex-1 accent-teal cursor-pointer" />
          <span className="text-xs text-text-muted">{endYear}</span>
        </div>
      </div>
    </div>
  );
}
