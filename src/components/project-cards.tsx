import { h, Fragment } from "../jsx-factory.js";
import { LAYOUT, BAR_COLORS, THEME } from "../theme.js";
import { escapeXml, truncate } from "../svg-utils.js";
import type { RenderResult, ComplexityItem, DomainMap } from "../types.js";

export function renderProjectCards(
  projects: ComplexityItem[],
  domainMap: DomainMap,
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
    const domains = domainMap?.get(p.name) || [];
    const desc = truncate(p.description, 90);

    let innerH = 20;
    if (desc) innerH += 16;
    if (domains.length > 0) innerH += 22;
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
          {`score ${p.value}`}
        </text>
      </>
    );

    let rowY = cy + 18;

    if (desc) {
      rowY += 16;
      svg += (
        <text x={padX + 16} y={rowY} className="t t-card-detail">
          {escapeXml(desc)}
        </text>
      );
    }

    if (domains.length > 0) {
      rowY += 18;
      let px = padX + 16;
      for (let j = 0; j < domains.length; j++) {
        const tag = escapeXml(truncate(domains[j], 20));
        const pillW = Math.ceil(tag.length * 6) + 16;
        const pillH = 16;
        const tagColor = BAR_COLORS[(i + j + 2) % BAR_COLORS.length];
        svg += (
          <>
            <rect
              x={px}
              y={rowY - 10}
              width={pillW}
              height={pillH}
              rx="8"
              fill={tagColor}
              fill-opacity="0.15"
              stroke={tagColor}
              stroke-opacity="0.4"
              stroke-width="1"
            />
            <text
              x={px + pillW / 2}
              y={rowY + 1}
              fill={tagColor}
              font-size="9"
              className="t t-pill"
              text-anchor="middle"
            >
              {tag}
            </text>
          </>
        );
        px += pillW + 6;
      }
    }

    totalHeight += cardH + gap;
  }

  return { svg, height: totalHeight > 0 ? totalHeight - gap : 0 };
}
