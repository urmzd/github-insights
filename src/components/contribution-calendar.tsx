import { Fragment, h } from "../jsx-factory.js";
import { escapeXml } from "../svg-utils.js";
import { LAYOUT, THEME } from "../theme.js";
import type { ContributionCalendar, RenderResult } from "../types.js";

const CELL_SIZE = 11;
const CELL_GAP = 2;
const STEP = CELL_SIZE + CELL_GAP;
const DAY_LABEL_WIDTH = 30;
const MONTH_LABEL_HEIGHT = 16;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function renderContributionCalendar(
  calendar: ContributionCalendar,
  y: number,
): RenderResult {
  const { padX } = LAYOUT;
  const weeks = calendar.weeks;
  const gridX = padX + DAY_LABEL_WIDTH;
  const gridY = y + MONTH_LABEL_HEIGHT;

  // Build month labels from the first day of each week
  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    const days = weeks[w].contributionDays;
    if (days.length === 0) continue;
    const month = new Date(days[0].date).getMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        label: MONTH_NAMES[month],
        x: gridX + w * STEP,
      });
      lastMonth = month;
    }
  }

  const svg = (
    <>
      {/* Month labels */}
      {monthLabels.map((m) => (
        <text x={m.x} y={y + 11} className="t t-value">
          {escapeXml(m.label)}
        </text>
      ))}
      {/* Day labels */}
      {DAY_LABELS.map((label, d) =>
        label ? (
          <text
            x={padX}
            y={gridY + d * STEP + CELL_SIZE - 1}
            className="t t-value"
          >
            {escapeXml(label)}
          </text>
        ) : (
          ""
        ),
      )}
      {/* Cells */}
      {weeks.map((week, w) =>
        week.contributionDays.map((day, d) => (
          <rect
            x={gridX + w * STEP}
            y={gridY + d * STEP}
            width={CELL_SIZE}
            height={CELL_SIZE}
            rx="2"
            fill={day.color || THEME.cardBg}
          />
        )),
      )}
    </>
  );

  const height = MONTH_LABEL_HEIGHT + 7 * STEP;
  return { svg, height };
}

void Fragment;
