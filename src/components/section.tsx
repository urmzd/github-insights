import { h, Fragment } from "../jsx-factory.js";
import { THEME, LAYOUT } from "../theme.js";
import { escapeXml } from "../svg-utils.js";
import { renderBarChart } from "./bar-chart.js";
import type { RenderResult, BarItem } from "../types.js";

export function renderSectionHeader(
  title: string,
  subtitle: string | undefined,
  y: number,
): RenderResult {
  const svg = (
    <>
      <text x={LAYOUT.padX} y={y + 16} className="t t-h">
        {escapeXml(title.toUpperCase())}
      </text>
      {subtitle ? (
        <text x={LAYOUT.padX} y={y + 32} className="t t-sub">
          {escapeXml(subtitle)}
        </text>
      ) : (
        ""
      )}
    </>
  );
  return { svg, height: subtitle ? 42 : 24 };
}

export function renderSubHeader(text: string, y: number): RenderResult {
  const svg = (
    <text x={LAYOUT.padX} y={y + 11} className="t t-subhdr">
      {escapeXml(text.toUpperCase())}
    </text>
  );
  return { svg, height: 14 };
}

export function renderDivider(y: number): RenderResult {
  const svg = (
    <line
      x1={LAYOUT.padX}
      y1={y}
      x2={LAYOUT.padX + 760}
      y2={y}
      stroke={THEME.border}
      stroke-opacity="0.6"
      stroke-width="1"
    />
  );
  return { svg, height: 1 };
}

export function renderSection(
  title: string,
  subtitle: string,
  itemsOrRenderBody: ((y: number) => RenderResult) | BarItem[],
  options: Record<string, unknown> = {},
): RenderResult {
  let y = LAYOUT.padY;
  let svg = "";

  const header = renderSectionHeader(title, subtitle, y);
  svg += header.svg;
  y += header.height;

  if (typeof itemsOrRenderBody === "function") {
    const body = itemsOrRenderBody(y);
    svg += body.svg;
    y += body.height + LAYOUT.padY;
  } else {
    const bars = renderBarChart(itemsOrRenderBody, y, options);
    svg += bars.svg;
    y += bars.height + LAYOUT.padY;
  }

  return { svg, height: y };
}

void Fragment;
