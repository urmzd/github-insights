import { Fragment, h } from "../jsx-factory.js";
import { escapeXml, truncate } from "../svg-utils.js";
import { BAR_COLORS, LAYOUT } from "../theme.js";
import type { BarItem, RenderResult } from "../types.js";

export function renderBarChart(
  items: BarItem[],
  y: number,
  options: Record<string, unknown> = {},
): RenderResult {
  if (items.length === 0) return { svg: "", height: 0 };

  const { barLabelWidth, barHeight, barRowHeight, barMaxWidth, padX } = LAYOUT;
  const useItemColors = options.useItemColors === true;
  const maxValue = Math.max(...items.map((d) => d.value));

  const svg = (
    <>
      {items.map((item, i) => {
        const ry = y + i * barRowHeight;
        const barWidth = Math.max((item.value / maxValue) * barMaxWidth, 4);
        const color = useItemColors
          ? item.color || BAR_COLORS[i % BAR_COLORS.length]
          : BAR_COLORS[i % BAR_COLORS.length];
        const label = escapeXml(truncate(item.name, 20));
        const valueLabel = item.percent
          ? `${item.percent}%`
          : String(item.value);

        return (
          <>
            <text x={padX} y={ry + 14} className="t t-label">
              {label}
            </text>
            <rect
              x={padX + barLabelWidth}
              y={ry + 2}
              width={barWidth}
              height={barHeight}
              rx="3"
              fill={color}
              opacity="0.85"
            />
            <text
              x={padX + barLabelWidth + barWidth + 8}
              y={ry + 14}
              className="t t-value"
            >
              {valueLabel}
            </text>
          </>
        );
      })}
    </>
  );

  return { svg, height: items.length * barRowHeight };
}
