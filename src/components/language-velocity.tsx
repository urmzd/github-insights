import { Fragment, h } from "../jsx-factory.js";
import { escapeXml } from "../svg-utils.js";
import { LAYOUT, THEME } from "../theme.js";
import type { MonthlyLanguageBucket, RenderResult } from "../types.js";

export function renderLanguageVelocity(
  velocity: MonthlyLanguageBucket[],
  y: number,
): RenderResult {
  if (velocity.length === 0) return { svg: "", height: 0 };

  const { padX } = LAYOUT;
  const chartWidth = 760;
  const chartHeight = 140;
  const labelHeight = 20;
  const totalHeight = chartHeight + labelHeight;

  // Collect all unique languages across all months
  const langSet = new Map<string, string>();
  for (const bucket of velocity) {
    for (const lang of bucket.languages) {
      if (!langSet.has(lang.name)) {
        langSet.set(lang.name, lang.color);
      }
    }
  }

  // Get top languages by total commits
  const langTotals = new Map<string, number>();
  for (const bucket of velocity) {
    for (const lang of bucket.languages) {
      langTotals.set(
        lang.name,
        (langTotals.get(lang.name) || 0) + lang.commits,
      );
    }
  }
  const topLangs = [...langTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name);

  // Compute max total per month for scaling
  const monthTotals = velocity.map((bucket) =>
    bucket.languages
      .filter((l) => topLangs.includes(l.name))
      .reduce((sum, l) => sum + l.commits, 0),
  );
  const maxTotal = Math.max(...monthTotals, 1);

  // Build stacked area data
  const stepX = chartWidth / Math.max(velocity.length - 1, 1);
  const paths: { path: string; color: string; name: string }[] = [];

  // For each language, build a path from bottom of its stack to top
  for (let li = topLangs.length - 1; li >= 0; li--) {
    const langName = topLangs[li];
    const color = langSet.get(langName) || "#8b949e";

    // Compute cumulative values for this language
    const upperPoints: { x: number; y: number }[] = [];
    const lowerPoints: { x: number; y: number }[] = [];

    for (let mi = 0; mi < velocity.length; mi++) {
      const bucket = velocity[mi];
      const x = padX + mi * stepX;

      // Sum commits for all languages below this one (for stacking)
      let below = 0;
      let current = 0;
      for (let k = 0; k < topLangs.length; k++) {
        const langCommits =
          bucket.languages.find((l) => l.name === topLangs[k])?.commits || 0;
        if (k < li) below += langCommits;
        if (k === li) current = langCommits;
      }

      const bottomY = y + chartHeight - (below / maxTotal) * chartHeight;
      const topY =
        y + chartHeight - ((below + current) / maxTotal) * chartHeight;

      lowerPoints.push({ x, y: bottomY });
      upperPoints.push({ x, y: topY });
    }

    // Build smooth path using the points
    if (upperPoints.length < 2) continue;

    let d = `M ${upperPoints[0].x},${upperPoints[0].y}`;

    // Upper edge (left to right) with smooth curves
    for (let i = 1; i < upperPoints.length; i++) {
      const prev = upperPoints[i - 1];
      const curr = upperPoints[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }

    // Lower edge (right to left) with smooth curves
    d += ` L ${lowerPoints[lowerPoints.length - 1].x},${lowerPoints[lowerPoints.length - 1].y}`;
    for (let i = lowerPoints.length - 2; i >= 0; i--) {
      const prev = lowerPoints[i + 1];
      const curr = lowerPoints[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }

    d += " Z";
    paths.push({ path: d, color, name: langName });
  }

  // Month labels
  const monthLabels = velocity
    .filter((_, i) => i % Math.max(1, Math.floor(velocity.length / 6)) === 0)
    .map((bucket) => {
      const originalIndex = velocity.indexOf(bucket);
      const x = padX + originalIndex * stepX;
      const monthName = new Date(`${bucket.month}-01`).toLocaleDateString(
        "en",
        { month: "short" },
      );
      return { x, label: monthName };
    });

  const svg = (
    <>
      {/* Streamgraph paths */}
      {paths.map((p, i) => (
        <path
          d={p.path}
          fill={p.color}
          fill-opacity="0.75"
          className={`fade-${Math.min(i + 1, 6)}`}
        />
      ))}

      {/* Language legend (inline, below chart) */}
      {(() => {
        let legendX = padX;
        return topLangs.map((name) => {
          const color = langSet.get(name) || "#8b949e";
          const x = legendX;
          legendX += name.length * 7 + 28;
          return (
            <>
              <rect
                x={x}
                y={y + chartHeight + 6}
                width="8"
                height="8"
                rx="2"
                fill={color}
                opacity="0.85"
              />
              <text x={x + 12} y={y + chartHeight + 14} className="t t-value">
                {escapeXml(name)}
              </text>
            </>
          );
        });
      })()}

      {/* Month labels */}
      {monthLabels.map((m) => (
        <text
          x={m.x}
          y={y + chartHeight + 14}
          className="t t-value"
          text-anchor="start"
          opacity="0"
        >
          {escapeXml(m.label)}
        </text>
      ))}
    </>
  );

  return { svg, height: totalHeight };
}

void Fragment;
