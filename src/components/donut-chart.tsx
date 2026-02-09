import { h, Fragment } from "../jsx-factory.js";
import { LAYOUT, BAR_COLORS, THEME } from "../theme.js";
import { escapeXml, FIRE_ICON } from "../svg-utils.js";
import type { RenderResult, LanguageItem } from "../types.js";

export function renderDonutChart(
  items: LanguageItem[],
  y: number,
): RenderResult {
  const { padX } = LAYOUT;
  const cx = padX + 90;
  const cy = y + 90;
  const r = 70;
  const strokeW = 28;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const segments = items.map((item, i) => {
    const pct = parseFloat(item.percent) / 100;
    const dash = pct * circumference;
    const color = item.color || BAR_COLORS[i % BAR_COLORS.length];
    const seg = (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        stroke-width={strokeW}
        stroke-dasharray={`${dash} ${circumference - dash}`}
        stroke-dashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        opacity="0.85"
      />
    );
    offset += dash;
    return seg;
  });

  const legendX = padX + 220;
  const legendItemH = 24;
  const legend = items.map((item, i) => {
    const ly = y + 10 + i * legendItemH;
    const color = item.color || BAR_COLORS[i % BAR_COLORS.length];
    const trendingSvg = item.trending ? FIRE_ICON(legendX + 250, ly - 6) : "";

    return (
      <>
        <rect
          x={legendX}
          y={ly}
          width="12"
          height="12"
          rx="2"
          fill={color}
          opacity="0.85"
        />
        <text x={legendX + 20} y={ly + 10} className="t t-label">
          {escapeXml(item.name)}
        </text>
        <text
          x={legendX + 200}
          y={ly + 10}
          className="t t-value"
          text-anchor="end"
        >
          {item.percent}%
        </text>
        {trendingSvg}
      </>
    );
  });

  const height = Math.max(180, items.length * legendItemH + 20);

  const svg = (
    <>
      {segments.join("")}
      <text
        x={cx}
        y={cy + 5}
        className="t"
        fill={THEME.text}
        font-size="14"
        font-weight="700"
        text-anchor="middle"
      >
        {String(items.length)}
      </text>
      <text
        x={cx}
        y={cy + 20}
        className="t"
        fill={THEME.muted}
        font-size="10"
        text-anchor="middle"
      >
        languages
      </text>
      {legend.join("")}
    </>
  );

  return { svg, height };
}
