import { Fragment, h } from "../jsx-factory.js";
import { escapeXml } from "../svg-utils.js";
import { BAR_COLORS, LAYOUT, THEME } from "../theme.js";
import type { ContributionRhythm, RenderResult } from "../types.js";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function renderContributionRhythm(
  rhythm: ContributionRhythm,
  y: number,
): RenderResult {
  const { padX } = LAYOUT;

  // Radar chart dimensions
  const radarCx = padX + 120;
  const radarCy = y + 120;
  const radarR = 90;
  const maxVal = Math.max(...rhythm.dayTotals, 1);

  // Guide circles
  const guides = [0.25, 0.5, 0.75, 1.0];
  const guidesSvg = guides.map((pct) => (
    <circle
      cx={radarCx}
      cy={radarCy}
      r={radarR * pct}
      fill="none"
      stroke={THEME.border}
      stroke-width="1"
      stroke-opacity="0.4"
    />
  ));

  // Spoke lines
  const spokesSvg = DAY_NAMES.map((_, i) => {
    const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
    const x2 = radarCx + radarR * Math.cos(angle);
    const y2 = radarCy + radarR * Math.sin(angle);
    return (
      <line
        x1={radarCx}
        y1={radarCy}
        x2={x2}
        y2={y2}
        stroke={THEME.border}
        stroke-width="1"
        stroke-opacity="0.3"
      />
    );
  });

  // Day labels
  const labelsSvg = DAY_NAMES.map((name, i) => {
    const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
    const labelR = radarR + 16;
    const lx = radarCx + labelR * Math.cos(angle);
    const ly = radarCy + labelR * Math.sin(angle) + 4;
    return (
      <text x={lx} y={ly} className="t t-value" text-anchor="middle">
        {escapeXml(name)}
      </text>
    );
  });

  // Data polygon
  const points = rhythm.dayTotals
    .map((val, i) => {
      const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
      const r = (val / maxVal) * radarR;
      const px = radarCx + r * Math.cos(angle);
      const py = radarCy + r * Math.sin(angle);
      return `${px},${py}`;
    })
    .join(" ");

  // Find most active day
  const maxDayIndex = rhythm.dayTotals.indexOf(Math.max(...rhythm.dayTotals));
  const mostActiveDay = DAY_FULL_NAMES[maxDayIndex];

  // Stats section (right side)
  const statsX = padX + 300;
  const statsStartY = y + 30;
  const statColors = [
    BAR_COLORS[0],
    BAR_COLORS[1],
    BAR_COLORS[2],
    BAR_COLORS[4],
    BAR_COLORS[5],
  ];

  const statsSvg = rhythm.stats.map((stat, i) => {
    const sy = statsStartY + i * 42;
    const color = statColors[i % statColors.length];
    return (
      <>
        <text x={statsX} y={sy} className="t t-stat-label">
          {escapeXml(stat.label)}
        </text>
        <text x={statsX} y={sy + 22} fill={color} className="t t-stat-value">
          {escapeXml(stat.value)}
        </text>
      </>
    );
  });

  // Most active day callout
  const calloutY = statsStartY + rhythm.stats.length * 42 + 10;

  const height = 250;

  const svg = (
    <>
      {/* Guide circles */}
      {guidesSvg.join("")}

      {/* Spokes */}
      {spokesSvg.join("")}

      {/* Data polygon */}
      <polygon
        points={points}
        fill={BAR_COLORS[0]}
        fill-opacity="0.2"
        stroke={BAR_COLORS[0]}
        stroke-width="2"
        stroke-opacity="0.8"
        className="fade-2"
        style={`transform-origin: ${radarCx}px ${radarCy}px`}
      />

      {/* Data points */}
      {rhythm.dayTotals.map((val, i) => {
        const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
        const r = (val / maxVal) * radarR;
        const px = radarCx + r * Math.cos(angle);
        const py = radarCy + r * Math.sin(angle);
        return (
          <circle
            cx={px}
            cy={py}
            r="3"
            fill={BAR_COLORS[0]}
            className={`fade-${Math.min(i + 1, 6)}`}
          />
        );
      })}

      {/* Day labels */}
      {labelsSvg.join("")}

      {/* Stats */}
      {statsSvg.join("")}

      {/* Most active day */}
      <text x={statsX} y={calloutY} className="t t-sub">
        {`Most active: ${escapeXml(mostActiveDay)}s`}
      </text>
    </>
  );

  return { svg, height };
}

void Fragment;
