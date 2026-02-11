import { Fragment, h } from "../jsx-factory.js";
import { escapeXml, truncate, wrapText } from "../svg-utils.js";
import { BAR_COLORS, LAYOUT } from "../theme.js";
import type { RenderResult, TechHighlight } from "../types.js";

export function renderTechHighlights(
  highlights: TechHighlight[],
  y: number,
): RenderResult {
  if (highlights.length === 0) return { svg: "", height: 0 };

  const { padX, barHeight, barMaxWidth } = LAYOUT;
  const labelMaxChars = 24;
  const skillMaxChars = 90;
  const skillLineHeight = 16;
  const barX = padX + 180;
  const scoreX = barX + barMaxWidth + 10;
  const skillY = 16;
  const rowGap = 14;

  let svg = "";
  let height = 0;

  for (let hi = 0; hi < highlights.length; hi++) {
    const group = highlights[hi];
    const color = BAR_COLORS[hi % BAR_COLORS.length];
    const score = Math.max(0, Math.min(100, group.score));
    const fillWidth = (score / 100) * barMaxWidth;

    const baseY = y + height;

    // Category label (uppercase, left-aligned, truncated to fit before bar)
    svg += (
      <text x={padX} y={baseY + barHeight / 2 + 4} className="t t-subhdr">
        {escapeXml(truncate(group.category.toUpperCase(), labelMaxChars))}
      </text>
    );

    // Bar track (full width, low opacity)
    svg += (
      <rect
        x={barX}
        y={baseY}
        width={barMaxWidth}
        height={barHeight}
        rx={4}
        fill={color}
        fill-opacity="0.15"
      />
    );

    // Bar fill (proportional to score)
    if (fillWidth > 0) {
      svg += (
        <rect
          x={barX}
          y={baseY}
          width={fillWidth}
          height={barHeight}
          rx={4}
          fill={color}
          fill-opacity="0.85"
        />
      );
    }

    // Score label (right of bar)
    svg += (
      <text x={scoreX} y={baseY + barHeight / 2 + 4} className="t t-value">
        {`${score}%`}
      </text>
    );

    // Skill items text (below bar, muted, wrapped to avoid overflow)
    const skillText = group.items
      .map((item) => truncate(item, 30))
      .join(" \u00B7 ");

    const skillLines = wrapText(skillText, skillMaxChars);
    for (let li = 0; li < skillLines.length; li++) {
      svg += (
        <text
          x={barX}
          y={baseY + barHeight + skillY + li * skillLineHeight}
          className="t t-card-detail"
        >
          {escapeXml(skillLines[li])}
        </text>
      );
    }

    height += barHeight + skillY + (skillLines.length - 1) * skillLineHeight + rowGap;
  }

  return { svg, height };
}

void Fragment;
