import { h, Fragment } from "../jsx-factory.js";
import { LAYOUT, BAR_COLORS, THEME } from "../theme.js";
import { escapeXml } from "../svg-utils.js";
import type { RenderResult, StatItem } from "../types.js";

export function renderStatCards(stats: StatItem[], y: number): RenderResult {
  const { padX } = LAYOUT;
  const cardW = 140;
  const cardH = 72;
  const gap = 15;
  const colors = [
    BAR_COLORS[0],
    BAR_COLORS[1],
    BAR_COLORS[2],
    BAR_COLORS[4],
    BAR_COLORS[5],
  ];

  const svg = (
    <>
      {stats.map((stat, i) => {
        const cx = padX + i * (cardW + gap);
        const color = colors[i % colors.length];

        return (
          <>
            <rect
              x={cx}
              y={y}
              width={cardW}
              height={cardH}
              rx="8"
              fill={THEME.cardBg}
              stroke={THEME.border}
              stroke-width="1"
            />
            <circle cx={cx + 14} cy={y + 16} r="4" fill={color} />
            <text x={cx + 24} y={y + 20} className="t t-stat-label">
              {escapeXml(stat.label)}
            </text>
            <text
              x={cx + cardW / 2}
              y={y + 52}
              fill={color}
              className="t t-stat-value"
              text-anchor="middle"
            >
              {escapeXml(String(stat.value))}
            </text>
          </>
        );
      })}
    </>
  );

  return { svg, height: cardH };
}
