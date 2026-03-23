import { Fragment, h } from "../jsx-factory.js";
import { LAYOUT } from "../theme.js";
import type { ContributionCalendar, RenderResult } from "../types.js";

export function renderContributionHeatmap(
  calendar: ContributionCalendar,
  y: number,
): RenderResult {
  if (calendar.weeks.length === 0) return { svg: "", height: 0 };

  const { padX } = LAYOUT;
  const cellSize = 11;
  const cellGap = 2;
  const step = cellSize + cellGap;

  const rows = 7;
  const chartHeight = rows * step;
  const totalHeight = chartHeight + 4;

  const svg = (
    <>
      {/* Heatmap cells */}
      {calendar.weeks.map((week, wi) =>
        week.contributionDays.map((day, di) => (
          <rect
            x={padX + wi * step}
            y={y + di * step}
            width={cellSize}
            height={cellSize}
            rx="2"
            fill={day.color}
            opacity="0.85"
            className={`fade-${Math.min((wi % 6) + 1, 6)}`}
          />
        )),
      )}
    </>
  );

  return { svg, height: totalHeight };
}

void Fragment;
