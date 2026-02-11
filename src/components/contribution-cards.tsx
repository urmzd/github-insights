import { Fragment, h } from "../jsx-factory.js";
import { escapeXml, truncate } from "../svg-utils.js";
import { BAR_COLORS, LAYOUT, THEME } from "../theme.js";
import type { ContributionHighlight, RenderResult } from "../types.js";

export function renderContributionCards(
  highlights: ContributionHighlight[],
  y: number,
): RenderResult {
  const { padX } = LAYOUT;
  const cardW = 760;
  const cardH = 44;
  const gap = 8;

  const svg = (
    <>
      {highlights.map((hl, i) => {
        const cy = y + i * (cardH + gap);
        const color = BAR_COLORS[i % BAR_COLORS.length];

        return (
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
            <rect
              x={padX}
              y={cy}
              width="4"
              height={cardH}
              rx="2"
              fill={color}
            />
            <text x={padX + 16} y={cy + 18} className="t t-card-title">
              {escapeXml(truncate(hl.project, 40))}
            </text>
            <text x={padX + 16} y={cy + 34} className="t t-card-detail">
              {escapeXml(truncate(hl.detail, 80))}
            </text>
          </>
        );
      })}
    </>
  );

  return {
    svg,
    height:
      highlights.length * (cardH + gap) - (highlights.length > 0 ? gap : 0),
  };
}
