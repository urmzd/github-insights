/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from "../jsx-factory.js";
import { escapeXml, truncate } from "../svg-utils.js";
import { LAYOUT, THEME } from "../theme.js";
import type { RenderResult, StackLayer } from "../types.js";

export function renderTechStack(layers: StackLayer[], y: number): RenderResult {
  if (layers.length === 0) return { svg: "", height: 0 };

  const { padX } = LAYOUT;
  const contentWidth = LAYOUT.width - padX * 2;
  const cardWidth = 176;
  const cardHeight = 52;
  const cardGap = 12;
  const headerHeight = 24;
  const bandPadding = 24;
  const bandGap = 8;

  // Render layers top-to-bottom (highest rank first)
  const sortedLayers = [...layers].sort((a, b) => b.rank - a.rank);

  let svg = "";
  let curY = y;

  for (let li = 0; li < sortedLayers.length; li++) {
    const layer = sortedLayers[li];
    const delay = Math.min(li + 1, 6);
    const bandHeight = headerHeight + cardHeight + bandPadding * 2;

    // Layer band background
    svg += (
      <rect
        x={padX}
        y={curY}
        width={contentWidth}
        height={bandHeight}
        rx="8"
        fill={layer.color}
        fill-opacity="0.08"
        className={`fade-${delay}`}
      />
    );

    // Layer header label
    svg += (
      <text
        x={padX + 16}
        y={curY + bandPadding + 12}
        className={`t t-subhdr fade-${delay}`}
        fill-opacity="0.9"
      >
        {escapeXml(layer.name.toUpperCase())}
      </text>
    );

    // Project cards
    const cardY = curY + bandPadding + headerHeight;
    for (let ci = 0; ci < layer.projects.length; ci++) {
      const project = layer.projects[ci];
      const cardX = padX + 16 + ci * (cardWidth + cardGap);

      // Don't render cards that overflow
      if (cardX + cardWidth > padX + contentWidth - 16) break;

      // Card background
      svg += (
        <rect
          x={cardX}
          y={cardY}
          width={cardWidth}
          height={cardHeight}
          rx="6"
          className={`card-fill fade-${delay}`}
        />
      );

      // Project name
      svg += (
        <text
          x={cardX + 10}
          y={cardY + 20}
          className={`t t-card-title fade-${delay}`}
        >
          {escapeXml(truncate(project.name, 20))}
        </text>
      );

      // Stars in top-right
      svg += (
        <text
          x={cardX + cardWidth - 10}
          y={cardY + 20}
          className={`t t-value fade-${delay}`}
          text-anchor="end"
          font-size="9"
        >
          {`\u2605 ${project.stars}`}
        </text>
      );

      // Language pill: circle + text
      svg += (
        <>
          <circle
            cx={cardX + 14}
            cy={cardY + 38}
            r="3"
            fill={project.primaryColor}
            fill-opacity="0.8"
            className={`fade-${delay}`}
          />
          <text
            x={cardX + 22}
            y={cardY + 41}
            className={`t fade-${delay}`}
            font-size="9"
            fill={THEME.muted}
          >
            {escapeXml(project.primaryLanguage)}
          </text>
        </>
      );
    }

    curY += bandHeight + bandGap;
  }

  const totalHeight = curY - y;
  return { svg, height: totalHeight };
}

void Fragment;
