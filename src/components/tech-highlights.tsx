import { h, Fragment } from "../jsx-factory.js";
import { LAYOUT, BAR_COLORS } from "../theme.js";
import { escapeXml, truncate } from "../svg-utils.js";
import { renderSubHeader, renderDivider } from "./section.js";
import type { RenderResult, TechHighlight } from "../types.js";

export function renderTechHighlights(
  highlights: TechHighlight[],
  y: number,
): RenderResult {
  if (highlights.length === 0) return { svg: "", height: 0 };

  const { padX } = LAYOUT;
  const maxWidth = 760;
  const gapX = 10;
  const gapY = 10;
  const fontSize = 11;
  const pillH = 26;

  let svg = "";
  let height = 0;

  for (let hi = 0; hi < highlights.length; hi++) {
    const group = highlights[hi];
    const color = BAR_COLORS[hi % BAR_COLORS.length];

    if (hi > 0) {
      const div = renderDivider(y + height + 6);
      svg += div.svg;
      height += 18;
    }

    const sub = renderSubHeader(group.category, y + height);
    svg += sub.svg;
    height += sub.height + 8;

    let cx = padX;
    let rowStartY = y + height;

    for (const item of group.items) {
      const text = truncate(item, 30);
      const pillW = Math.ceil(text.length * fontSize * 0.55) + 28;

      if (cx + pillW > padX + maxWidth && cx > padX) {
        cx = padX;
        rowStartY += pillH + gapY;
        height += pillH + gapY;
      }

      svg += (
        <>
          <rect
            x={cx}
            y={rowStartY}
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
            y={rowStartY + pillH / 2 + fontSize / 3}
            fill={color}
            font-size={fontSize}
            className="t t-pill"
            text-anchor="middle"
          >
            {escapeXml(text)}
          </text>
        </>
      );

      cx += pillW + gapX;
    }

    height += pillH + 10;
  }

  return { svg, height };
}

void Fragment;
