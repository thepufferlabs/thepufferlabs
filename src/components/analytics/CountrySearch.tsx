"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";

interface CountrySearchProps {
  countries: { code: string; name: string; region: string }[];
  selected: string[];
  onToggle: (code: string) => void;
  maxSelected?: number;
}

/** Convert a 2-letter or 3-letter ISO code to a flag emoji (uses first 2 chars). */
function codeToFlag(code: string): string {
  const cc = code.slice(0, 2).toUpperCase();
  // Regional indicator symbols: 🇦 = U+1F1E6, offset from 'A' (65)
  try {
    return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
  } catch {
    return code.slice(0, 2);
  }
}

export default function CountrySearch({ countries, selected, onToggle, maxSelected = 8 }: CountrySearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filter countries
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [query, countries]);

  // Group by region
  const grouped = useMemo(() => {
    const map = new Map<string, typeof countries>();
    for (const c of filtered) {
      const region = c.region || "Other";
      if (!map.has(region)) map.set(region, []);
      map.get(region)!.push(c);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Flat list for keyboard nav
  const flatList = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  const handleToggle = useCallback(
    (code: string) => {
      if (selected.includes(code)) {
        onToggle(code);
      } else if (selected.length < maxSelected) {
        onToggle(code);
      }
    },
    [selected, onToggle, maxSelected]
  );

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        setFocusIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusIndex((i) => Math.min(i + 1, flatList.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (focusIndex >= 0 && focusIndex < flatList.length) {
          handleToggle(flatList[focusIndex].code);
        }
        break;
      case "Escape":
        setOpen(false);
        setFocusIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }

  // Scroll focused item into view
  useEffect(() => {
    if (focusIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${focusIndex}"]`);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [focusIndex]);

  const selectedCountries = countries.filter((c) => selected.includes(c.code));
  const atLimit = selected.length >= maxSelected;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Selected pills */}
      {selectedCountries.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedCountries.map((c) => (
            <button
              key={c.code}
              onClick={() => onToggle(c.code)}
              className="flex items-center gap-1.5 rounded-full border border-teal/40 bg-teal/10 px-3 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-teal/20"
              aria-label={`Remove ${c.name}`}
            >
              <span>{codeToFlag(c.code)}</span>
              <span>{c.name}</span>
              <svg className="h-3 w-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setFocusIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search countries by name or code..."
          className="w-full rounded-xl border border-glass-border bg-glass/60 py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted/50 backdrop-blur-sm transition-colors focus:border-teal/40 focus:outline-none"
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
          aria-controls="country-listbox"
        />
      </div>

      {/* Count */}
      <p className="mt-2 text-xs text-text-muted/60">
        {selected.length} of {countries.length} countries selected
        {atLimit && <span className="ml-1 text-text-muted">(max {maxSelected})</span>}
      </p>

      {/* Dropdown */}
      {open && (
        <div
          id="country-listbox"
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-glass-border bg-glass/95 shadow-xl backdrop-blur-md"
        >
          {grouped.length === 0 && <div className="px-4 py-6 text-center text-sm text-text-muted">No countries found</div>}
          {grouped.map(([region, items]) => {
            // Compute the starting flat index for this group
            let groupStartIdx = 0;
            for (const [r, g] of grouped) {
              if (r === region) break;
              groupStartIdx += g.length;
            }

            return (
              <div key={region}>
                <div className="sticky top-0 bg-glass/90 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted/60 backdrop-blur-sm">{region}</div>
                {items.map((c, idx) => {
                  const flatIdx = groupStartIdx + idx;
                  const isSelected = selected.includes(c.code);
                  const isFocused = flatIdx === focusIndex;
                  const disabled = !isSelected && atLimit;

                  return (
                    <button
                      key={c.code}
                      role="option"
                      aria-selected={isSelected}
                      data-idx={flatIdx}
                      disabled={disabled}
                      onClick={() => {
                        handleToggle(c.code);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        isFocused ? "bg-teal/10" : ""
                      } ${isSelected ? "text-text-primary" : "text-text-muted"} ${disabled ? "cursor-not-allowed opacity-40" : "hover:bg-teal/[0.06]"}`}
                    >
                      <span className="text-base">{codeToFlag(c.code)}</span>
                      <span className="flex-1 truncate font-medium">{c.name}</span>
                      <span className="rounded-md border border-glass-border/50 bg-glass/40 px-1.5 py-0.5 text-[10px] text-text-muted/60">{c.code}</span>
                      {isSelected && (
                        <svg className="h-4 w-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
