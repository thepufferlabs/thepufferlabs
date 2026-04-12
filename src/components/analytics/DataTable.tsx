"use client";

import { COUNTRY_FLAGS, formatValue, type LatestValue } from "@/lib/wb/types";

interface Props {
  data: LatestValue[];
}

export default function DataTable({ data }: Props) {
  // Group by country
  const countries = [...new Set(data.map((d) => d.country_code))];

  return (
    <div className="overflow-x-auto rounded-2xl border border-glass-border bg-glass/50 backdrop-blur-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-glass-border/50">
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted/60">Country</th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted/60">Region</th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-text-muted/60">GDP</th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-text-muted/60">GDP/Capita</th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-text-muted/60">Population</th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-text-muted/60">Year</th>
          </tr>
        </thead>
        <tbody>
          {countries.map((code) => {
            const countryData = data.filter((d) => d.country_code === code);
            const gdp = countryData.find((d) => d.indicator_code === "NY.GDP.MKTP.CD");
            const gdpPc = countryData.find((d) => d.indicator_code === "NY.GDP.PCAP.CD");
            const pop = countryData.find((d) => d.indicator_code === "SP.POP.TOTL");
            const name = gdp?.country_name ?? code;
            const region = gdp?.region ?? "—";

            return (
              <tr key={code} className="border-b border-glass-border/30 transition-colors hover:bg-teal/[0.03]">
                <td className="px-6 py-4 text-sm font-medium text-text-primary">
                  {COUNTRY_FLAGS[code]} {name}
                </td>
                <td className="px-6 py-4 text-sm text-text-muted">{region}</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-text-primary">{gdp ? formatValue(gdp.value, "NY.GDP.MKTP.CD") : "—"}</td>
                <td className="px-6 py-4 text-right text-sm text-text-primary">{gdpPc ? formatValue(gdpPc.value, "NY.GDP.PCAP.CD") : "—"}</td>
                <td className="px-6 py-4 text-right text-sm text-text-primary">{pop ? formatValue(pop.value, "SP.POP.TOTL") : "—"}</td>
                <td className="px-6 py-4 text-right text-xs text-text-muted">{gdp?.year ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
