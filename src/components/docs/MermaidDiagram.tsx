"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface MermaidDiagramProps {
  chart: string;
}

// Brand palette
const NAVY = "#0F172A";
const NAVY_LIGHT = "#1E293B";
const NAVY_LIGHTER = "#334155";
const TEAL = "#2DD4BF";
const TEXT = "#E2E8F0";
const TEXT_MUTED = "#94A3B8";

/**
 * Replace ALL color values in the rendered SVG with brand colors.
 * This handles fill="...", stroke="...", and inline style="..." colors.
 * Preserves "none", "transparent", and "url(...)" values.
 */
function recolorSvg(svgStr: string): string {
  // Match any hex color (#xxx, #xxxxxx, #xxxxxxxx), rgb(), rgba(), or named colors
  const colorPattern = /#(?:[0-9a-fA-F]{3,8})\b|rgb\([^)]+\)|rgba\([^)]+\)|(?:white|black|red|pink|salmon|coral|orange|yellow|gold|lightblue|lightyellow|lightgreen|lightcyan|lavender|linen|wheat|beige|ivory|mintcream|honeydew|aliceblue|ghostwhite|seashell|oldlace|floralwhite|snow|mistyrose|antiquewhite|papayawhip|blanchedalmond|bisque|peachpuff|moccasin|navajowhite|cornsilk|lemonchiffon|khaki|palegoldenrod)(?=[\s;'"])/gi;

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
  const lightNames = ["white", "snow", "ivory", "lightyellow", "lightgreen", "lightblue", "lightcyan", "lavender", "linen", "wheat", "beige", "mintcream", "honeydew", "aliceblue", "ghostwhite", "seashell", "oldlace", "floralwhite", "papayawhip", "blanchedalmond", "bisque", "peachpuff", "moccasin", "navajowhite", "cornsilk", "lemonchiffon", "khaki", "palegoldenrod", "pink", "salmon", "coral", "gold", "yellow", "orange", "mistyrose", "antiquewhite"];
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

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          theme: "base",
          themeVariables: {
            // Background & surface
            darkMode: true,
            background: "#0F172A",
            mainBkg: "#1E293B",
            secondBkg: "#1E293B",
            tertiaryColor: "#1E293B",

            // Primary (nodes, borders)
            primaryColor: "#1E293B",
            primaryBorderColor: "#2DD4BF",
            primaryTextColor: "#E2E8F0",

            // Secondary
            secondaryColor: "#1E293B",
            secondaryBorderColor: "#334155",
            secondaryTextColor: "#E2E8F0",

            // Tertiary
            tertiaryBorderColor: "#334155",
            tertiaryTextColor: "#E2E8F0",

            // Lines & arrows
            lineColor: "#2DD4BF",
            arrowheadColor: "#2DD4BF",

            // Text
            textColor: "#E2E8F0",
            labelTextColor: "#E2E8F0",
            nodeTextColor: "#E2E8F0",

            // Fonts
            fontFamily: '"SF Mono", "Cascadia Code", "Fira Code", monospace',
            fontSize: "14px",

            // Notes
            noteBkgColor: "#1E293B",
            noteTextColor: "#E2E8F0",
            noteBorderColor: "#2DD4BF",

            // Flowchart specific
            nodeBorder: "#2DD4BF",
            clusterBkg: "#0F172A",
            clusterBorder: "#334155",
            defaultLinkColor: "#2DD4BF",
            edgeLabelBackground: "#0F172A",

            // Sequence diagram
            actorBkg: "#1E293B",
            actorBorder: "#2DD4BF",
            actorTextColor: "#E2E8F0",
            actorLineColor: "#334155",
            signalColor: "#E2E8F0",
            signalTextColor: "#E2E8F0",
            activationBkgColor: "#1E293B",
            activationBorderColor: "#2DD4BF",
            sequenceNumberColor: "#0F172A",

            // State diagram
            labelColor: "#E2E8F0",
            altBackground: "#1E293B",

            // Pie chart
            pie1: "#2DD4BF",
            pie2: "#A3E635",
            pie3: "#14B8A6",
            pie4: "#84CC16",
            pie5: "#0D9488",
            pie6: "#65A30D",
            pieStrokeColor: "#0F172A",
            pieTitleTextSize: "16px",
            pieTitleTextColor: "#E2E8F0",
            pieSectionTextColor: "#0F172A",

            // Class diagram
            classText: "#E2E8F0",

            // Gantt
            taskBkgColor: "#1E293B",
            taskBorderColor: "#2DD4BF",
            taskTextColor: "#E2E8F0",
            taskTextLightColor: "#E2E8F0",
            activeTaskBkgColor: "#2DD4BF",
            activeTaskBorderColor: "#14B8A6",
            gridColor: "#334155",
            doneTaskBkgColor: "#334155",
            doneTaskBorderColor: "#64748B",
            critBkgColor: "#991B1B",
            critBorderColor: "#EF4444",
            todayLineColor: "#A3E635",

            // Git graph
            git0: "#2DD4BF",
            git1: "#A3E635",
            git2: "#14B8A6",
            git3: "#84CC16",
            gitBranchLabel0: "#0F172A",
            gitBranchLabel1: "#0F172A",
            gitBranchLabel2: "#0F172A",
            gitBranchLabel3: "#0F172A",
            gitInv0: "#0F172A",
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
        if (!cancelled) setSvg(recolorSvg(renderedSvg));
      } catch {
        if (!cancelled) setError(true);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  // Reset zoom/pan when toggling fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

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
      <div className="group relative my-4 rounded-lg border border-white/5 bg-[#0B1120] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim">
            mermaid
          </span>
        </div>
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
          <code className="text-text-muted">{chart}</code>
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="rounded-lg border border-white/5 bg-[#0B1120] p-8 flex items-center justify-center">
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
        <div className="my-6 rounded-lg border border-teal/20 bg-[#0B1120] p-8 flex items-center justify-center">
          <span className="text-xs text-text-dim">Diagram open in fullscreen</span>
        </div>

        {/* Fullscreen overlay */}
        <div
          className="fixed inset-0 z-[100] bg-[#0B1120]/95 backdrop-blur-sm flex items-center justify-center"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Controls */}
          <div className="fixed top-4 right-4 z-[101] flex items-center gap-2">
            <div className="flex items-center gap-1 bg-navy/80 border border-white/10 rounded-lg px-2 py-1">
              <button
                onClick={() => setScale((s) => Math.max(s * 0.8, 0.2))}
                className="text-text-dim hover:text-text-primary px-1.5 py-0.5 text-sm transition-colors"
                aria-label="Zoom out"
              >
                &minus;
              </button>
              <span className="text-[10px] font-mono text-text-dim min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(s * 1.2, 5))}
                className="text-text-dim hover:text-text-primary px-1.5 py-0.5 text-sm transition-colors"
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                onClick={() => {
                  setScale(1);
                  setTranslate({ x: 0, y: 0 });
                }}
                className="text-[10px] font-mono text-text-dim hover:text-teal px-1.5 py-0.5 transition-colors border-l border-white/10 ml-1"
              >
                Reset
              </button>
            </div>
            <button
              onClick={toggleFullscreen}
              className="bg-navy/80 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-dim hover:text-text-primary transition-colors"
            >
              Close
            </button>
          </div>

          {/* Hint */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[101]">
            <span className="text-[10px] text-text-dim/50 font-mono">
              Scroll to zoom &middot; Drag to pan &middot; Esc to close
            </span>
          </div>

          {/* Diagram */}
          <div className="overflow-hidden w-full h-full flex items-center justify-center">
            {diagramContent}
          </div>
        </div>
      </>
    );
  }

  // Inline view
  return (
    <div
      ref={containerRef}
      className="group relative my-6 rounded-lg border border-white/5 bg-[#0B1120] p-4 overflow-x-auto"
    >
      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-navy/80 border border-white/10 rounded-md px-2 py-1 text-[10px] font-mono text-text-dim hover:text-teal z-10"
        aria-label="View diagram fullscreen"
      >
        Fullscreen
      </button>
      {diagramContent}
    </div>
  );
}
