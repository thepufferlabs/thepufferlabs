"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface MermaidDiagramProps {
  chart: string;
}

// Brand palettes per theme
const PALETTES = {
  dark: {
    NAVY: "#0F172A",
    NAVY_LIGHT: "#1E293B",
    NAVY_LIGHTER: "#334155",
    TEAL: "#2DD4BF",
    TEXT: "#E2E8F0",
    TEXT_MUTED: "#94A3B8",
    SURFACE: "#0B1120",
  },
  light: {
    NAVY: "#FFFFFF",
    NAVY_LIGHT: "#F1F5F9",
    NAVY_LIGHTER: "#CBD5E1",
    TEAL: "#0D9488",
    TEXT: "#0F172A",
    TEXT_MUTED: "#475569",
    SURFACE: "#F8FAFC",
  },
};

/**
 * Replace ALL color values in the rendered SVG with brand colors.
 * This handles fill="...", stroke="...", and inline style="..." colors.
 * Preserves "none", "transparent", and "url(...)" values.
 */
function recolorSvg(svgStr: string, palette: typeof PALETTES.dark = PALETTES.dark): string {
  const { NAVY, NAVY_LIGHT, TEAL, TEXT } = palette;
  // Classify what "role" a color plays based on context
  function replaceColor(fullMatch: string, context: string): string {
    const lower = fullMatch.toLowerCase();

    // Preserve special values
    if (lower === "none" || lower === "transparent") return fullMatch;

    // Determine what this color is used for based on surrounding context
    if (context === "fill") {
      return isLightColor(lower) ? NAVY_LIGHT : NAVY_LIGHT;
    }
    if (context === "stroke") {
      return TEAL;
    }
    if (context === "color" || context === "text") {
      return TEXT;
    }
    if (context === "background" || context === "background-color") {
      return NAVY;
    }
    // Default: treat as fill
    return NAVY_LIGHT;
  }

  let result = svgStr;

  // 1. Recolor fill="..." attributes
  result = result.replace(/fill="([^"]*)"/g, (match, val) => {
    if (val === "none" || val.startsWith("url(")) return match;
    const newColor = replaceColor(val, "fill");
    return `fill="${newColor}"`;
  });

  // 2. Recolor stroke="..." attributes
  result = result.replace(/stroke="([^"]*)"/g, (match, val) => {
    if (val === "none") return match;
    const newColor = replaceColor(val, "stroke");
    return `stroke="${newColor}"`;
  });

  // 3. Recolor inline styles
  result = result.replace(/style="([^"]*)"/g, (_match, styleStr: string) => {
    let newStyle = styleStr;
    // Replace fill: ... ;
    newStyle = newStyle.replace(/fill\s*:\s*([^;]+)/gi, (m, val) => {
      if (val.trim() === "none" || val.trim().startsWith("url(")) return m;
      return `fill: ${NAVY_LIGHT}`;
    });
    // Replace stroke: ... ;
    newStyle = newStyle.replace(/stroke\s*:\s*([^;]+)/gi, (m, val) => {
      if (val.trim() === "none") return m;
      return `stroke: ${TEAL}`;
    });
    // Replace color: ... ;
    newStyle = newStyle.replace(/(?<![a-z-])color\s*:\s*([^;]+)/gi, () => {
      return `color: ${TEXT}`;
    });
    // Replace background-color: ... ; and background: ... ;
    newStyle = newStyle.replace(/background(?:-color)?\s*:\s*([^;]+)/gi, () => {
      return `background: ${NAVY}`;
    });
    return `style="${newStyle}"`;
  });

  // 4. Rewrite <style> blocks inside the SVG
  result = result.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_match, css: string) => {
    let newCss = css;
    // Replace all color property values
    newCss = newCss.replace(/fill\s*:\s*([^;!}]+)/gi, (m, val) => {
      if (val.trim() === "none" || val.trim().startsWith("url(")) return m;
      return `fill: ${NAVY_LIGHT}`;
    });
    newCss = newCss.replace(/stroke\s*:\s*([^;!}]+)/gi, (m, val) => {
      if (val.trim() === "none") return m;
      return `stroke: ${TEAL}`;
    });
    newCss = newCss.replace(/(?<![a-z-])color\s*:\s*([^;!}]+)/gi, () => {
      return `color: ${TEXT}`;
    });
    newCss = newCss.replace(/background(?:-color)?\s*:\s*([^;!}]+)/gi, () => {
      return `background: ${NAVY}`;
    });
    return `<style>${newCss}</style>`;
  });

  return result;
}

function isLightColor(color: string): boolean {
  // Quick check: if it's a hex color, check luminance
  const hex = color.replace("#", "");
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }
  // Named light colors
  const lightNames = [
    "white",
    "snow",
    "ivory",
    "lightyellow",
    "lightgreen",
    "lightblue",
    "lightcyan",
    "lavender",
    "linen",
    "wheat",
    "beige",
    "mintcream",
    "honeydew",
    "aliceblue",
    "ghostwhite",
    "seashell",
    "oldlace",
    "floralwhite",
    "papayawhip",
    "blanchedalmond",
    "bisque",
    "peachpuff",
    "moccasin",
    "navajowhite",
    "cornsilk",
    "lemonchiffon",
    "khaki",
    "palegoldenrod",
    "pink",
    "salmon",
    "coral",
    "gold",
    "yellow",
    "orange",
    "mistyrose",
    "antiquewhite",
  ];
  return lightNames.includes(color.toLowerCase());
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const { theme } = useTheme();
  const palette = PALETTES[theme];

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        const p = palette;
        mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          theme: "base",
          themeVariables: {
            darkMode: theme === "dark",
            background: p.NAVY,
            mainBkg: p.NAVY_LIGHT,
            secondBkg: p.NAVY_LIGHT,
            tertiaryColor: p.NAVY_LIGHT,

            primaryColor: p.NAVY_LIGHT,
            primaryBorderColor: p.TEAL,
            primaryTextColor: p.TEXT,

            secondaryColor: p.NAVY_LIGHT,
            secondaryBorderColor: p.NAVY_LIGHTER,
            secondaryTextColor: p.TEXT,

            tertiaryBorderColor: p.NAVY_LIGHTER,
            tertiaryTextColor: p.TEXT,

            lineColor: p.TEAL,
            arrowheadColor: p.TEAL,

            textColor: p.TEXT,
            labelTextColor: p.TEXT,
            nodeTextColor: p.TEXT,

            fontFamily: '"SF Mono", "Cascadia Code", "Fira Code", monospace',
            fontSize: "14px",

            noteBkgColor: p.NAVY_LIGHT,
            noteTextColor: p.TEXT,
            noteBorderColor: p.TEAL,

            nodeBorder: p.TEAL,
            clusterBkg: p.NAVY,
            clusterBorder: p.NAVY_LIGHTER,
            defaultLinkColor: p.TEAL,
            edgeLabelBackground: p.NAVY,

            actorBkg: p.NAVY_LIGHT,
            actorBorder: p.TEAL,
            actorTextColor: p.TEXT,
            actorLineColor: p.NAVY_LIGHTER,
            signalColor: p.TEXT,
            signalTextColor: p.TEXT,
            activationBkgColor: p.NAVY_LIGHT,
            activationBorderColor: p.TEAL,
            sequenceNumberColor: p.NAVY,

            labelColor: p.TEXT,
            altBackground: p.NAVY_LIGHT,

            pie1: "#2DD4BF",
            pie2: "#A3E635",
            pie3: "#14B8A6",
            pie4: "#84CC16",
            pie5: "#0D9488",
            pie6: "#65A30D",
            pieStrokeColor: p.NAVY,
            pieTitleTextSize: "16px",
            pieTitleTextColor: p.TEXT,
            pieSectionTextColor: p.NAVY,

            classText: p.TEXT,

            taskBkgColor: p.NAVY_LIGHT,
            taskBorderColor: p.TEAL,
            taskTextColor: p.TEXT,
            taskTextLightColor: p.TEXT,
            activeTaskBkgColor: p.TEAL,
            activeTaskBorderColor: "#14B8A6",
            gridColor: p.NAVY_LIGHTER,
            doneTaskBkgColor: p.NAVY_LIGHTER,
            doneTaskBorderColor: "#64748B",
            critBkgColor: "#991B1B",
            critBorderColor: "#EF4444",
            todayLineColor: "#A3E635",

            git0: "#2DD4BF",
            git1: "#A3E635",
            git2: "#14B8A6",
            git3: "#84CC16",
            gitBranchLabel0: p.NAVY,
            gitBranchLabel1: p.NAVY,
            gitBranchLabel2: p.NAVY,
            gitBranchLabel3: p.NAVY,
            gitInv0: p.NAVY,
          },
          flowchart: {
            htmlLabels: true,
            curve: "basis",
            padding: 15,
          },
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);

        // Recolor the SVG: replace all color values in fill/stroke attributes
        // and inline styles with our brand palette, preserving structure.
        if (!cancelled) setSvg(recolorSvg(renderedSvg, palette));
      } catch {
        if (!cancelled) setError(true);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart, theme, palette]);

  // Reset zoom/pan when toggling fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // Auto-fit diagram to viewport when entering fullscreen
  const fullscreenRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isFullscreen || !svg) return;
    // Wait for DOM to render
    const timer = setTimeout(() => {
      const container = fullscreenRef.current;
      if (!container) return;
      const svgEl = container.querySelector("svg");
      if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect();
      const svgWidth = rect.width || parseFloat(svgEl.getAttribute("width") || "0");
      const svgHeight = rect.height || parseFloat(svgEl.getAttribute("height") || "0");
      if (!svgWidth || !svgHeight) return;
      const scaleX = (window.innerWidth - 120) / svgWidth;
      const scaleY = (window.innerHeight - 160) / svgHeight;
      const fitScale = Math.min(scaleX, scaleY, 5);
      if (fitScale > 1.05) {
        setScale(fitScale);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isFullscreen, svg]);

  // Close on Escape
  useEffect(() => {
    if (!isFullscreen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsFullscreen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFullscreen]);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!isFullscreen) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((s) => Math.min(Math.max(s * delta, 0.2), 5));
    },
    [isFullscreen]
  );

  // Mouse drag pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isFullscreen) return;
      setDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: translate.x,
        ty: translate.y,
      };
    },
    [isFullscreen, translate]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      setTranslate({
        x: dragStart.current.tx + (e.clientX - dragStart.current.x),
        y: dragStart.current.ty + (e.clientY - dragStart.current.y),
      });
    },
    [dragging]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // On error, fallback to plain code block
  if (error) {
    return (
      <div className="group relative my-4 rounded-lg border border-[var(--theme-border)] bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--theme-border)] bg-[var(--theme-white-alpha-5)]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim">mermaid</span>
        </div>
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
          <code className="text-text-muted">{chart}</code>
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="rounded-lg border border-[var(--theme-border)] bg-surface p-8 flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
      </div>
    );
  }

  const diagramContent = (
    <div
      className={`mermaid-themed [&_svg]:mx-auto [&_svg]:max-w-full ${isFullscreen ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={
        isFullscreen
          ? {
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transformOrigin: "center center",
              transition: dragging ? "none" : "transform 0.1s ease-out",
            }
          : undefined
      }
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );

  // Fullscreen overlay
  if (isFullscreen) {
    return (
      <>
        {/* Inline placeholder */}
        <div className="my-6 rounded-lg border border-teal/20 bg-surface p-8 flex items-center justify-center">
          <span className="text-xs text-text-dim">Diagram open in fullscreen</span>
        </div>

        {/* Fullscreen overlay */}
        <div
          ref={fullscreenRef}
          className="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-sm flex items-center justify-center"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Controls */}
          <div className="fixed top-4 right-4 z-[101] flex items-center gap-2">
            <div className="flex items-center gap-1 bg-navy/80 border border-[var(--theme-white-alpha-10)] rounded-lg px-2 py-1">
              <button onClick={() => setScale((s) => Math.max(s * 0.8, 0.2))} className="text-text-dim hover:text-text-primary px-1.5 py-0.5 text-sm transition-colors" aria-label="Zoom out">
                &minus;
              </button>
              <span className="text-[10px] font-mono text-text-dim min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale((s) => Math.min(s * 1.2, 5))} className="text-text-dim hover:text-text-primary px-1.5 py-0.5 text-sm transition-colors" aria-label="Zoom in">
                +
              </button>
              <button
                onClick={() => {
                  setScale(1);
                  setTranslate({ x: 0, y: 0 });
                }}
                className="text-[10px] font-mono text-text-dim hover:text-teal px-1.5 py-0.5 transition-colors border-l border-[var(--theme-white-alpha-10)] ml-1"
              >
                Reset
              </button>
            </div>
            <button
              onClick={toggleFullscreen}
              className="bg-navy/80 border border-[var(--theme-white-alpha-10)] rounded-lg px-3 py-1.5 text-xs text-text-dim hover:text-text-primary transition-colors"
            >
              Close
            </button>
          </div>

          {/* Hint */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[101]">
            <span className="text-[10px] text-text-dim/50 font-mono">Scroll to zoom &middot; Drag to pan &middot; Esc to close</span>
          </div>

          {/* Diagram */}
          <div className="w-full h-full flex items-center justify-center overflow-auto p-8">{diagramContent}</div>
        </div>
      </>
    );
  }

  // Inline view
  return (
    <div ref={containerRef} className="group relative my-6 rounded-lg border border-[var(--theme-border)] bg-surface p-4 overflow-x-auto">
      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-navy/80 border border-[var(--theme-white-alpha-10)] rounded-md px-2 py-1 text-[10px] font-mono text-text-dim hover:text-teal z-10"
        aria-label="View diagram fullscreen"
      >
        Fullscreen
      </button>
      {diagramContent}
    </div>
  );
}
