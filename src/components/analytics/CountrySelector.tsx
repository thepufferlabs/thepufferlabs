"use client";

import { COUNTRY_COLORS, COUNTRY_FLAGS } from "@/lib/wb/types";

interface Props {
  countries: string[];
  selected: string[];
  onToggle: (code: string) => void;
}

const COUNTRY_NAMES: Record<string, string> = {
  IND: "India",
  USA: "United States",
  CHN: "China",
  GBR: "United Kingdom",
};

export default function CountrySelector({ countries, selected, onToggle }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {countries.map((code) => {
        const isActive = selected.includes(code);
        return (
          <button
            key={code}
            onClick={() => onToggle(code)}
            className={`
              flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200
              ${
                isActive
                  ? "border-teal/40 bg-teal/10 text-text-primary shadow-[0_0_12px_rgba(78,205,196,0.1)]"
                  : "border-glass-border bg-glass/30 text-text-muted hover:border-glass-border/60 hover:bg-glass/50"
              }
            `}
          >
            <span>{COUNTRY_FLAGS[code]}</span>
            <span>{COUNTRY_NAMES[code] ?? code}</span>
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COUNTRY_COLORS[code] }} />
          </button>
        );
      })}
    </div>
  );
}
