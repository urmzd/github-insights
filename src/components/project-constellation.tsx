/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from "../jsx-factory.js";
import { escapeXml, truncate } from "../svg-utils.js";
import { LAYOUT } from "../theme.js";
import type { ConstellationBar, RenderResult } from "../types.js";

export function renderProjectConstellation(
  bars: ConstellationBar[],
  y: number,
): RenderResult {
  if (bars.length === 0) return { svg: "", height: 0 };

  const { padX } = LAYOUT;
  const nameColWidth = 180;
  const barStartX = padX + nameColWidth;
  const barMaxWidth = 380;
  const starX = barStartX + barMaxWidth + 20;
  const groupHeaderHeight = 32;
  const groupGap = 16;
  const rowBaseHeight = 36;
  const langDotsHeight = 18;
  const rowGap = 6;

  const maxComplexity = Math.max(...bars.map((b) => b.complexity), 1);

  // Build a color map from all bars so language dots can use real colors
  const langColorMap = new Map<string, string>();
  for (const bar of bars) {
    if (!langColorMap.has(bar.languages[0] || "")) {
      langColorMap.set(bar.languages[0] || "", bar.primaryColor);
    }
  }

  let currentLang = "";
  let svg = "";
  let curY = y;
  let itemIndex = 0;

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];

    // Group header when language changes
    if (bar.primaryLanguage !== currentLang) {
      if (currentLang !== "") curY += groupGap;
      currentLang = bar.primaryLanguage;
      const delay = Math.min(itemIndex + 1, 6);

      svg += (
        <>
          <circle
            cx={padX + 5}
            cy={curY + groupHeaderHeight / 2}
            r="5"
            fill={currentLang === "Other" ? undefined : bar.primaryColor}
            className={`${currentLang === "Other" ? "secondary-fill" : ""} fade-${delay}`}
            fill-opacity="0.8"
          />
          <text
            x={padX + 16}
            y={curY + groupHeaderHeight / 2 + 4}
            className={`t t-subhdr fade-${delay}`}
          >
            {escapeXml(currentLang)}
          </text>
          {/* Subtle divider line */}
          <line
            x1={barStartX}
            y1={curY + groupHeaderHeight / 2}
            x2={starX + 40}
            y2={curY + groupHeaderHeight / 2}
            className="border-stroke"
            stroke-opacity="0.3"
            stroke-width="1"
          />
        </>
      );
      curY += groupHeaderHeight;
    }

    const delay = Math.min(itemIndex + 1, 6);
    const barWidth = Math.max(
      4,
      (bar.complexity / maxComplexity) * barMaxWidth,
    );

    const secondaryLangs = bar.languages.slice(1);
    const hasSecondary = secondaryLangs.length > 0;
    const totalRowHeight = rowBaseHeight + (hasSecondary ? langDotsHeight : 0);

    // Project name
    svg += (
      <text
        x={padX + 8}
        y={curY + 16}
        className={`t t-card-title fade-${delay}`}
      >
        {escapeXml(truncate(bar.name, 24))}
      </text>
    );

    // Complexity bar
    svg += (
      <rect
        x={barStartX}
        y={curY + 8}
        width={barWidth}
        height="14"
        rx="4"
        fill={bar.primaryColor}
        fill-opacity="0.7"
        className={`fade-${delay}`}
      />
    );

    // Star count
    svg += (
      <text x={starX} y={curY + 16} className={`t t-value fade-${delay}`}>
        {`\u2605 ${bar.stars.toLocaleString()}`}
      </text>
    );

    // Secondary language tags
    if (hasSecondary) {
      let dotX = padX + 8;
      for (const lang of secondaryLangs.slice(0, 5)) {
        const langColor = langColorMap.get(lang);
        svg += (
          <>
            <circle
              cx={dotX + 4}
              cy={curY + rowBaseHeight + 4}
              r="3"
              fill={langColor}
              className={`${langColor ? "" : "muted-fill"} fade-${delay}`}
              fill-opacity="0.6"
            />
            <text
              x={dotX + 10}
              y={curY + rowBaseHeight + 7}
              className={`t muted-fill fade-${delay}`}
              font-size="9"
            >
              {escapeXml(truncate(lang, 10))}
            </text>
          </>
        );
        dotX += Math.min(lang.length * 6 + 20, 80);
      }
    }

    curY += totalRowHeight + rowGap;
    itemIndex++;
  }

  const totalHeight = curY - y;
  return { svg, height: totalHeight };
}

void Fragment;
