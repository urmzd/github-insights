import { h, Fragment } from "../jsx-factory.js";
import { LAYOUT, BAR_COLORS } from "../theme.js";
import { escapeXml, truncate } from "../svg-utils.js";
import type { RenderResult, DomainItem } from "../types.js";

export function renderDomainCloud(
  domains: DomainItem[],
  y: number,
): RenderResult {
  const { padX } = LAYOUT;
  const maxWidth = 760;
  const gapX = 10;
  const gapY = 10;
  const maxCount = Math.max(...domains.map((d) => d.count), 1);
  let svg = "";
  let cx = padX;
  let cy = y;
  let maxRowY = cy;

  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i];
    const scale = 0.7 + (domain.count / maxCount) * 0.6;
    const fontSize = Math.round(11 * scale);
    const pillH = Math.round(28 * scale);
    const text = truncate(domain.name, 30);
    const pillW = Math.ceil(text.length * fontSize * 0.55) + 28;
    const color = BAR_COLORS[i % BAR_COLORS.length];

    if (cx + pillW > padX + maxWidth && cx > padX) {
      cx = padX;
      cy += pillH + gapY;
    }

    svg += (
      <>
        <rect
          x={cx}
          y={cy}
          width={pillW}
          height={pillH}
          rx={pillH / 2}
          fill={color}
          fill-opacity="0.15"
          stroke={color}
          stroke-opacity="0.4"
          stroke-width="1"
        />
        <text
          x={cx + pillW / 2}
          y={cy + pillH / 2 + fontSize / 3}
          fill={color}
          font-size={fontSize}
          className="t t-pill"
          text-anchor="middle"
        >
          {escapeXml(text)}
        </text>
      </>
    );

    maxRowY = Math.max(maxRowY, cy + pillH);
    cx += pillW + gapX;
  }

  return { svg, height: maxRowY - y + 4 };
}
