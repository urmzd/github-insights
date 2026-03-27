/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from "../jsx-factory.js";
import { escapeXml, truncate } from "../svg-utils.js";
import { BAR_COLORS, LAYOUT, THEME } from "../theme.js";
import type { ExternalRepo, RenderResult } from "../types.js";

export function renderImpactTrail(
  repos: ExternalRepo[],
  y: number,
): RenderResult {
  if (repos.length === 0) return { svg: "", height: 0 };

  const { padX } = LAYOUT;
  const rowHeight = 40;
  const nameWidth = 256;
  const barMaxWidth = 340;
  const starsX = padX + nameWidth + barMaxWidth + 16;
  const langX = starsX + 92;
  const gap = 6;

  // Sort by stars (impact proxy)
  const sorted = [...repos].sort((a, b) => b.stargazerCount - a.stargazerCount);
  const maxStars = Math.max(sorted[0]?.stargazerCount || 1, 1);
  const maxLog = Math.log2(maxStars + 1);

  let svg = "";

  for (let i = 0; i < sorted.length; i++) {
    const repo = sorted[i];
    const ry = y + i * (rowHeight + gap);
    const color = BAR_COLORS[i % BAR_COLORS.length];
    const delay = Math.min(i + 1, 6);

    // Bar width proportional to log(stars)
    const logStars = Math.log2(repo.stargazerCount + 1);
    const barWidth = Math.max(4, (logStars / maxLog) * barMaxWidth);

    // Language dot
    const langName = repo.primaryLanguage?.name || "";

    svg += (
      <>
        {/* Repo name */}
        <text
          x={padX}
          y={ry + rowHeight / 2 + 4}
          className={`t t-card-title fade-${delay}`}
        >
          {escapeXml(truncate(repo.nameWithOwner, 38))}
        </text>

        {/* Impact bar */}
        <rect
          x={padX + nameWidth}
          y={ry + rowHeight / 2 - 6}
          width={barWidth}
          height="12"
          rx="3"
          fill={color}
          fill-opacity="0.7"
          className={`fade-${delay}`}
        />

        {/* Star count */}
        <text
          x={starsX}
          y={ry + rowHeight / 2 + 4}
          className={`t t-value fade-${delay}`}
        >
          {`\u2605 ${repo.stargazerCount.toLocaleString()}`}
        </text>

        {/* Language label (same line, after stars) */}
        {langName ? (
          <text
            x={langX}
            y={ry + rowHeight / 2 + 4}
            className={`t t-value fade-${delay}`}
          >
            {escapeXml(langName)}
          </text>
        ) : (
          ""
        )}
      </>
    );
  }

  const totalHeight = sorted.length * (rowHeight + gap) - gap;
  return { svg, height: totalHeight };
}

void Fragment;
