import { Fragment, h } from "../jsx-factory.js";
import { escapeXml, truncate } from "../svg-utils.js";
import { BAR_COLORS, LAYOUT, THEME } from "../theme.js";
import type { ProjectItem, RenderResult } from "../types.js";

export function renderProjectCards(
  projects: ProjectItem[],
  y: number,
): RenderResult {
  const { padX } = LAYOUT;
  const cardW = 760;
  const gap = 10;
  let svg = "";
  let totalHeight = 0;

  for (let i = 0; i < projects.length; i++) {
    const cy = y + totalHeight;
    const color = BAR_COLORS[i % BAR_COLORS.length];
    const p = projects[i];
    const desc = truncate(p.description, 90);

    let innerH = 20;
    if (desc) innerH += 16;
    const cardH = Math.max(innerH + 16, 44);

    // Card background + accent bar
    svg += (
      <>
        <rect
          x={padX}
          y={cy}
          width={cardW}
          height={cardH}
          rx="6"
          fill={THEME.cardBg}
          stroke={THEME.border}
          stroke-width="1"
        />
        <rect x={padX} y={cy} width="4" height={cardH} rx="2" fill={color} />
        <text x={padX + 16} y={cy + 18} className="t t-card-title">
          {escapeXml(truncate(p.name, 40))}
        </text>
        <text
          x={padX + cardW - 16}
          y={cy + 18}
          className="t t-value"
          text-anchor="end"
        >
          {`\u2605 ${p.stars.toLocaleString()}`}
        </text>
      </>
    );

    if (desc) {
      svg += (
        <text x={padX + 16} y={cy + 34} className="t t-card-detail">
          {escapeXml(desc)}
        </text>
      );
    }

    totalHeight += cardH + gap;
  }

  return { svg, height: totalHeight > 0 ? totalHeight - gap : 0 };
}
