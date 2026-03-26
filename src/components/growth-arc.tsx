import { Fragment, h } from "../jsx-factory.js";
import { escapeXml } from "../svg-utils.js";
import { LAYOUT, THEME } from "../theme.js";
import type { GrowthArcPoint, RenderResult } from "../types.js";

export function renderGrowthArc(
  points: GrowthArcPoint[],
  y: number,
): RenderResult {
  if (points.length < 2) return { svg: "", height: 0 };

  const { padX } = LAYOUT;
  const chartWidth = 760;
  const chartHeight = 120;
  const labelHeight = 20;
  const totalHeight = chartHeight + labelHeight;

  const maxComplexity = Math.max(...points.map((p) => p.avgComplexity));
  const minComplexity = Math.min(...points.map((p) => p.avgComplexity));
  const range = maxComplexity - minComplexity || 1;

  const stepX = chartWidth / Math.max(points.length - 1, 1);

  // Compute point positions
  const coords = points.map((p, i) => ({
    x: padX + i * stepX,
    y:
      y +
      chartHeight -
      ((p.avgComplexity - minComplexity) / range) * (chartHeight - 20) -
      10,
    ...p,
  }));

  // Build smooth path
  let pathD = `M ${coords[0].x},${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }

  // Build filled area path
  let areaD = pathD;
  areaD += ` L ${coords[coords.length - 1].x},${y + chartHeight}`;
  areaD += ` L ${coords[0].x},${y + chartHeight} Z`;

  const svg = (
    <>
      {/* Filled area under curve */}
      <path d={areaD} fill="#58a6ff" fill-opacity="0.15" className="fade-1" />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="#58a6ff"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        className="fade-1"
      />

      {/* Data points */}
      {coords.map((p, i) => (
        <circle
          key={`pt-${p.label}`}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="#58a6ff"
          className={`fade-${Math.min(i + 1, 6)}`}
        />
      ))}

      {/* Point labels (complexity value) */}
      {coords.map((p) => (
        <text
          key={`lbl-${p.label}`}
          x={p.x}
          y={p.y - 10}
          className="t t-value"
          text-anchor="middle"
          font-size="10"
        >
          {p.avgComplexity.toFixed(0)}
        </text>
      ))}

      {/* X-axis labels (relative time) */}
      {coords.map((p) => (
        <text
          key={`x-${p.label}`}
          x={p.x}
          y={y + chartHeight + 14}
          className="t t-value"
          text-anchor="middle"
        >
          {escapeXml(p.label)}
        </text>
      ))}

      {/* Repo count annotations */}
      {coords.map((p) => (
        <text
          key={`rc-${p.label}`}
          x={p.x}
          y={y + chartHeight + 24}
          className="t t-muted"
          text-anchor="middle"
          font-size="9"
        >
          {`${p.repoCount} repo${p.repoCount !== 1 ? "s" : ""}`}
        </text>
      ))}
    </>
  );

  return { svg, height: totalHeight + 10 };
}

void Fragment;
